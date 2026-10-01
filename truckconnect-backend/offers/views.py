from django.db import transaction

from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from accounts.permissions import IsCustomer, IsTruckOwner
from bookings.models import Booking
from loads.models import Load
from notifications.services import create_notification
from trucks.models import Truck
from trips.models import Trip

from .models import Offer
from .serializers import OfferSerializer


class OwnerOfferListCreateView(generics.ListCreateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                owner=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
            .order_by("-created_at")
        )

    @transaction.atomic
    def perform_create(self, serializer):
        load_id = self.request.data.get("load")
        truck_id = self.request.data.get("truck")

        try:
            load = Load.objects.get(id=load_id)
        except Load.DoesNotExist:
            raise ValidationError(
                {
                    "load": "Load does not exist."
                }
            )

        try:
            truck = Truck.objects.get(
                id=truck_id,
                owner=self.request.user,
            )
        except Truck.DoesNotExist:
            raise PermissionDenied(
                "You can only use your own truck."
            )

        if truck.status != Truck.TruckStatus.AVAILABLE:
            raise ValidationError(
                {
                    "truck": (
                        "Only an available truck can be used "
                        "to make an offer."
                    )
                }
            )

        if load.status not in [
            Load.Status.ACTIVE,
            Load.Status.OFFER_RECEIVED,
        ]:
            raise ValidationError(
                {
                    "load": (
                        "Offers cannot be made for this load "
                        "because it is no longer available."
                    )
                }
            )

        if truck.capacity_kg < load.weight_kg:
            raise ValidationError(
                {
                    "truck": (
                        "Truck capacity is less than the "
                        "load weight."
                    )
                }
            )

        existing_offer = Offer.objects.filter(
            load=load,
            owner=self.request.user,
            truck=truck,
            status__in=[
                Offer.Status.PENDING,
                Offer.Status.NEGOTIATING,
            ],
        ).exists()

        if existing_offer:
            raise ValidationError(
                {
                    "offer": (
                        "You already have an active offer "
                        "for this load using this truck."
                    )
                }
            )

        offer = serializer.save(
            owner=self.request.user,
        )

        if load.status == Load.Status.ACTIVE:
            load.status = Load.Status.OFFER_RECEIVED
            load.save(
                update_fields=["status"]
            )

        # Automatic notification:
        # Notify the customer that a new offer was received.
        create_notification(
            recipient=load.customer,
            notification_type="offer_received",
            title="New Offer Received",
            message=(
                f"You received a new offer of "
                f"{offer.offered_price} for your load "
                f"from {self.request.user.full_name}."
            ),
        )


class OwnerOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                owner=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
        )

    def perform_update(self, serializer):
        offer = self.get_object()
        if offer.status not in [
            Offer.Status.PENDING,
            Offer.Status.NEGOTIATING,
        ]:
            raise ValidationError(
                {
                    "offer": (
                        "This offer cannot be updated because "
                        "it is no longer pending or negotiating."
                    )
                }
            )
        updated_offer = serializer.save()
        create_notification(
            recipient=updated_offer.load.customer,
            notification_type="offer_received",
            title="Offer Price Revised",
            message=(
                f"Transporter {self.request.user.full_name or self.request.user.username} "
                f"has updated their offer to ₹{updated_offer.offered_price} "
                f"for your load from {updated_offer.load.pickup_location} "
                f"to {updated_offer.load.destination}."
            ),
        )

    def perform_destroy(self, instance):
        if instance.status not in [
            Offer.Status.PENDING,
            Offer.Status.NEGOTIATING,
        ]:
            raise ValidationError(
                {
                    "offer": (
                        "This offer cannot be withdrawn because "
                        "it is already accepted, rejected, or completed."
                    )
                }
            )
        load = instance.load
        instance_id = instance.id
        instance.delete()

        # Revert load to ACTIVE if no active offers remain
        has_other_offers = Offer.objects.filter(
            load=load,
            status__in=[Offer.Status.PENDING, Offer.Status.NEGOTIATING],
        ).exclude(id=instance_id).exists()

        if not has_other_offers and load.status == Load.Status.OFFER_RECEIVED:
            load.status = Load.Status.ACTIVE
            load.save(update_fields=["status"])


class CustomerOfferListView(generics.ListAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                load__customer=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
            .order_by("-created_at")
        )


class CustomerOfferDetailView(generics.RetrieveAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                load__customer=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
        )


class AcceptOfferView(generics.UpdateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                load__customer=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        offer = self.get_object()

        if offer.status not in [
            Offer.Status.PENDING,
            Offer.Status.NEGOTIATING,
        ]:
            raise ValidationError(
                {
                    "offer": (
                        "This offer can no longer be accepted."
                    )
                }
            )

        load = offer.load

        if load.status not in [
            Load.Status.ACTIVE,
            Load.Status.OFFER_RECEIVED,
        ]:
            raise ValidationError(
                {
                    "load": (
                        "This load is no longer available."
                    )
                }
            )

        existing_booking = Booking.objects.filter(
            load=load,
            status=Booking.Status.CONFIRMED,
        ).exists()

        if existing_booking:
            raise ValidationError(
                {
                    "booking": (
                        "This load already has a confirmed booking."
                    )
                }
            )

        accepted_offer_exists = Offer.objects.filter(
            load=load,
            status=Offer.Status.ACCEPTED,
        ).exclude(
            id=offer.id
        ).exists()

        if accepted_offer_exists:
            raise ValidationError(
                {
                    "offer": (
                        "Another offer for this load "
                        "has already been accepted."
                    )
                }
            )

        offer.status = Offer.Status.ACCEPTED
        offer.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        rejected_statuses = [
            Offer.Status.PENDING,
            Offer.Status.NEGOTIATING,
        ]

        Offer.objects.filter(
            load=load,
            status__in=rejected_statuses,
        ).exclude(
            id=offer.id
        ).update(
            status=Offer.Status.REJECTED
        )

        booking = Booking.objects.create(
            customer=request.user,
            owner=offer.owner,
            load=load,
            offer=offer,
            truck=offer.truck,
            final_price=offer.offered_price,
            status=Booking.Status.CONFIRMED,
        )

        trip = Trip.objects.create(
            booking=booking,
            load=load,
            truck=offer.truck,
            start_location=load.pickup_location,
            pickup_location=load.pickup_location,
            destination=load.destination,
            current_location=load.pickup_location,
            current_status=Trip.Status.TRIP_CONFIRMED,
        )

        load.status = Load.Status.BOOKED
        load.save(
            update_fields=["status"]
        )

        offer.truck.status = Truck.TruckStatus.ON_TRIP
        offer.truck.save(
            update_fields=["status"]
        )

        # Automatic notification:
        # Notify the owner that their offer was accepted.
        create_notification(
            recipient=offer.owner,
            notification_type="offer_accepted",
            title="Offer Accepted",
            message=(
                f"Your offer of {offer.offered_price} "
                f"for the load from {load.pickup_location} "
                f"to {load.destination} has been accepted."
            ),
        )

        response_data = OfferSerializer(
            offer,
            context={
                "request": request,
            },
        ).data

        response_data["booking_id"] = booking.id
        response_data["trip_id"] = trip.trip_id
        response_data["trip_status"] = trip.current_status

        return Response(response_data)

    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


class RejectOfferView(generics.UpdateAPIView):
    serializer_class = OfferSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return (
            Offer.objects.filter(
                load__customer=self.request.user
            )
            .select_related(
                "owner",
                "truck",
                "load",
            )
        )

    def update(self, request, *args, **kwargs):
        offer = self.get_object()

        if offer.status not in [
            Offer.Status.PENDING,
            Offer.Status.NEGOTIATING,
        ]:
            raise ValidationError(
                {
                    "offer": (
                        "This offer can no longer be rejected."
                    )
                }
            )

        offer.status = Offer.Status.REJECTED
        offer.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        load = offer.load
        has_other_offers = Offer.objects.filter(
            load=load,
            status__in=[Offer.Status.PENDING, Offer.Status.NEGOTIATING],
        ).exclude(id=offer.id).exists()

        if not has_other_offers and load.status == Load.Status.OFFER_RECEIVED:
            load.status = Load.Status.ACTIVE
            load.save(update_fields=["status"])

        try:
            create_notification(
                recipient=offer.owner,
                notification_type="cancellation",
                title="Offer Declined",
                message=(
                    f"Your offer of ₹{offer.offered_price} for load from "
                    f"{load.pickup_location} to {load.destination} was declined."
                ),
            )
        except Exception:
            pass

        return Response(
            OfferSerializer(
                offer,
                context={
                    "request": request,
                },
            ).data
        )

    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)