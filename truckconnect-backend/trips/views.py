from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTruckOwner
from deliveries.models import DeliveryProof
from drivers.models import Driver
from notifications.services import create_notification
from payments.models import Payment, PaymentTransaction
from trucks.models import Truck
from rest_framework import generics

from .models import Trip, TripLocationUpdate
from .serializers import TripSerializer, TripLocationUpdateSerializer


class TripListView(generics.ListAPIView):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = (
            Trip.objects
            .select_related(
                "booking",
                "booking__customer",
                "booking__owner",
                "load",
                "truck",
                "driver",
                "payment",
            )
            .prefetch_related("delivery_proofs")
            .order_by("-created_at")
        )
        if getattr(user, "role", None) == "truck_owner":
            return base_qs.filter(truck__owner=user)
        elif getattr(user, "role", None) == "customer":
            return base_qs.filter(booking__customer=user)
        elif getattr(user, "role", None) == "admin" or user.is_staff:
            return base_qs
        return base_qs.filter(
            models.Q(truck__owner=user) | models.Q(booking__customer=user)
        )


class TripLocationUpdateListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trip_id):
        try:
            trip = Trip.objects.get(id=trip_id)
        except Trip.DoesNotExist:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        location_updates = (
            TripLocationUpdate.objects
            .filter(trip=trip)
            .order_by("-created_at")
        )

        serializer = TripLocationUpdateSerializer(
            location_updates,
            many=True,
        )

        return Response(serializer.data)

    @transaction.atomic
    def post(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                    "driver",
                    "truck",
                    "load",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Only the truck owner can update the trip.
        if trip.truck.owner_id != request.user.id:
            return Response(
                {
                    "detail": "You can only update your own trip."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # A driver must be assigned before location/status updates.
        if not trip.driver_id:
            return Response(
                {
                    "trip": "A driver must be assigned before updating the trip."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TripLocationUpdateSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        location_update = serializer.save(
            trip=trip,
            updated_by=request.user,
        )

        old_status = trip.current_status
        new_status = location_update.status

        # Update the main Trip location.
        trip.current_location = location_update.location

        # Update the main Trip status.
        trip.current_status = new_status

        # If journey has started and started_at is empty,
        # record the start time.
        if (
            new_status == Trip.Status.JOURNEY_STARTED
            and not trip.started_at
        ):
            trip.started_at = timezone.now()

        # If the trip reaches completed status,
        # record the completion time.
        if (
            new_status == Trip.Status.TRIP_COMPLETED
            and not trip.completed_at
        ):
            trip.completed_at = timezone.now()

        update_fields = [
            "current_location",
            "current_status",
            "updated_at",
        ]

        if (
            new_status == Trip.Status.JOURNEY_STARTED
            and trip.started_at
        ):
            update_fields.append("started_at")

        if (
            new_status == Trip.Status.TRIP_COMPLETED
            and trip.completed_at
        ):
            update_fields.append("completed_at")

        trip.save(update_fields=update_fields)

        # Send notification only when the Trip status actually changes.
        if old_status != new_status:

            # Special notification for delivery completion.
            if new_status == Trip.Status.DELIVERED:
                create_notification(
                    recipient=trip.booking.customer,
                    notification_type="delivery_completed",
                    title="Delivery Completed",
                    message=(
                        f"Delivery for your trip {trip.trip_id} "
                        f"has been completed successfully. "
                        f"Current location: {trip.current_location}."
                    ),
                    trip=trip,
                )

            else:
                status_display = trip.get_current_status_display()

                create_notification(
                    recipient=trip.booking.customer,
                    notification_type="trip_status_changed",
                    title="Trip Status Updated",
                    message=(
                        f"Your trip {trip.trip_id} status has been updated "
                        f"to {status_display}. "
                        f"Current location: {trip.current_location}."
                    ),
                    trip=trip,
                )

        return Response(
            {
                "message": "Trip location and status updated successfully.",
                "data": TripLocationUpdateSerializer(
                    location_update
                ).data,
                "trip": TripSerializer(trip).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AssignDriverView(APIView):
    permission_classes = [IsAuthenticated, IsTruckOwner]

    @transaction.atomic
    def patch(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                    "truck",
                    "load",
                    "driver",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if trip.truck.owner_id != request.user.id:
            return Response(
                {
                    "detail": "You can only assign a driver to your own trip."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        driver_id = request.data.get("driver")

        if not driver_id:
            return Response(
                {
                    "driver": "Driver ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            driver = Driver.objects.get(
                id=driver_id,
                owner=request.user,
            )
        except Driver.DoesNotExist:
            return Response(
                {
                    "driver": "Driver does not exist or does not belong to you."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if driver.verification_status != Driver.VerificationStatus.VERIFIED:
            return Response(
                {
                    "driver": "Only a verified driver can be assigned to a trip."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if driver.status != Driver.DriverStatus.AVAILABLE:
            return Response(
                {
                    "driver": "Only an available driver can be assigned to a trip."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.booking.status != "confirmed":
            return Response(
                {
                    "trip": "Driver can only be assigned after booking confirmation."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.driver_id and trip.driver_id != driver.id:
            return Response(
                {
                    "driver": "A driver is already assigned to this trip."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.driver_id == driver.id:
            return Response(
                {
                    "message": "This driver is already assigned to the trip.",
                    "data": TripSerializer(trip).data,
                },
                status=status.HTTP_200_OK,
            )

        trip.driver = driver
        trip.current_status = Trip.Status.DRIVER_ASSIGNED

        trip.save(
            update_fields=[
                "driver",
                "current_status",
                "updated_at",
            ]
        )

        driver.status = Driver.DriverStatus.ON_TRIP

        driver.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        create_notification(
            recipient=trip.booking.customer,
            notification_type="driver_assigned",
            title="Driver Assigned",
            message=(
                f"Driver {driver.full_name} has been assigned to your trip "
                f"{trip.trip_id}. Driver mobile number: "
                f"{driver.mobile_number}."
            ),
            trip=trip,
        )

        return Response(
            {
                "message": "Driver assigned successfully.",
                "data": TripSerializer(trip).data,
            },
            status=status.HTTP_200_OK,
        )


class StartTripView(APIView):
    permission_classes = [IsAuthenticated, IsTruckOwner]

    @transaction.atomic
    def patch(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                    "truck",
                    "driver",
                    "load",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response(
                {"detail": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if trip.truck.owner_id != request.user.id:
            return Response(
                {
                    "detail": "You can only start your own trip."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not trip.driver_id:
            return Response(
                {
                    "trip": "A driver must be assigned before starting the trip."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.current_status != Trip.Status.DRIVER_ASSIGNED:
            return Response(
                {
                    "trip": (
                        "Trip can only be started when the current status "
                        "is driver_assigned."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.booking.status != "confirmed":
            return Response(
                {
                    "booking": "Trip can only be started after booking confirmation."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip.current_status = Trip.Status.JOURNEY_STARTED
        trip.started_at = timezone.now()

        trip.save(
            update_fields=[
                "current_status",
                "started_at",
                "updated_at",
            ]
        )

        create_notification(
            recipient=trip.booking.customer,
            notification_type="trip_started",
            title="Trip Started",
            message=(
                f"Your trip {trip.trip_id} has started. "
                f"The truck is travelling from {trip.pickup_location} "
                f"to {trip.destination}."
            ),
            trip=trip,
        )

        return Response(
            {
                "message": "Trip started successfully.",
                "data": TripSerializer(trip).data,
            },
            status=status.HTTP_200_OK,
        )


class DeliverTripView(APIView):
    """
    Called by Truck Owner when the shipment arrives at destination.
    Uploads the Unload Report and Delivery Receipt / Proof of Delivery (POD).
    Sets current_status to 'delivered'.
    Notifies customer to inspect unload report/receipt and confirm.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                    "truck",
                    "driver",
                    "load",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        is_owner = trip.truck.owner_id == request.user.id
        is_admin = request.user.is_staff or getattr(request.user, "role", None) == "admin"
        if not (is_owner or is_admin):
            return Response({"detail": "You can only submit delivery proof for your own trips."}, status=status.HTTP_403_FORBIDDEN)

        location = request.data.get("location", trip.destination or trip.current_location)
        unload_notes = request.data.get("note") or request.data.get("unload_notes") or "Shipment delivered at destination. Unloading completed in good condition."
        proof_type = request.data.get("proof_type", "delivery_receipt")
        proof_file = request.FILES.get("file")

        trip.current_status = Trip.Status.DELIVERED
        trip.current_location = location
        trip.save(update_fields=["current_status", "current_location", "updated_at"])

        # Save DeliveryProof
        DeliveryProof.objects.create(
            trip=trip,
            proof_type=proof_type,
            file=proof_file if proof_file else None,
            notes=unload_notes,
            uploaded_by=request.user,
        )

        # Save TripLocationUpdate
        TripLocationUpdate.objects.create(
            trip=trip,
            status=Trip.Status.DELIVERED,
            location=location,
            note=f"Delivered at destination. Unload Report: {unload_notes}",
            updated_by=request.user,
        )

        # Notify Customer to inspect and confirm
        if trip.booking and trip.booking.customer:
            create_notification(
                recipient=trip.booking.customer,
                notification_type="delivery_delivered",
                title="Shipment Delivered - Action Required",
                message=(
                    f"Transporter has delivered shipment for Trip #{trip.trip_id} at {location} "
                    f"and uploaded the destination unload report/receipt. Please inspect and click Confirm Delivery to finalize the trip."
                ),
                trip=trip,
            )

        return Response(
            {
                "message": "Unload report and delivery proof submitted successfully. Awaiting customer confirmation.",
                "data": TripSerializer(trip).data,
            },
            status=status.HTTP_200_OK,
        )


class ConfirmDeliveryView(APIView):
    """
    Called by Customer (or Admin) to confirm inspection of the unload report and finalize the trip.
    Marks Trip completed, releases Truck & Driver to 'available', marks Load/Booking completed,
    and automatically creates/settles the Payment record.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                    "truck",
                    "driver",
                    "load",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        is_customer = (
            (getattr(trip, "booking", None) and trip.booking.customer_id == request.user.id)
            or (getattr(trip, "load", None) and trip.load.customer_id == request.user.id)
        )
        is_owner = (
            (getattr(trip, "truck", None) and trip.truck.owner_id == request.user.id)
            or (getattr(trip, "booking", None) and trip.booking.owner_id == request.user.id)
        )
        is_admin = request.user.is_staff or getattr(request.user, "role", None) == "admin"

        if not (is_customer or is_admin or is_owner):
            return Response({"detail": "You do not have permission to confirm this trip."}, status=status.HTTP_403_FORBIDDEN)

        note = request.data.get("note", "Delivery inspected and confirmed by customer. Trip successfully completed.")
        location = request.data.get("location", trip.destination or trip.current_location)

        trip.current_status = Trip.Status.TRIP_COMPLETED
        trip.current_location = location
        trip.completed_at = timezone.now()
        trip.save(update_fields=["current_status", "current_location", "completed_at", "updated_at"])

        # 1. Release driver to available
        if trip.driver:
            trip.driver.status = Driver.DriverStatus.AVAILABLE
            trip.driver.save(update_fields=["status", "updated_at"])

        # 2. Release truck to available
        if trip.truck:
            trip.truck.status = Truck.TruckStatus.AVAILABLE
            trip.truck.save(update_fields=["status", "updated_at"])

        # 3. Mark booking as completed
        if trip.booking:
            trip.booking.status = "completed"
            trip.booking.save(update_fields=["status"])

        # 4. Mark load as completed
        if trip.load:
            trip.load.status = "completed"
            trip.load.save(update_fields=["status", "updated_at"])

        # 5. Automatically create/ensure payment record exists for settlement
        booking = trip.booking
        agreed_price = (
            getattr(booking, "final_price", None)
            or getattr(booking, "agreed_price", None)
            or getattr(getattr(booking, "offer", None), "offered_price", None)
            or Decimal("15000.00")
        )
        payment, created = Payment.objects.get_or_create(
            trip=trip,
            defaults={
                "agreed_amount": agreed_price,
                "total_paid": Decimal("0.00"),
                "remaining_amount": agreed_price,
                "payment_status": Payment.STATUS_UNPAID,
            }
        )
        if not payment.agreed_amount:
            payment.agreed_amount = agreed_price

        actual_paid = sum(
            (tx.amount for tx in payment.transactions.filter(status=PaymentTransaction.STATUS_COMPLETED)),
            Decimal("0.00"),
        )
        payment.total_paid = actual_paid
        payment.remaining_amount = max(payment.agreed_amount - actual_paid, Decimal("0.00"))
        if actual_paid >= payment.agreed_amount and payment.agreed_amount > Decimal("0.00"):
            payment.payment_status = Payment.STATUS_FULLY_PAID
        elif actual_paid > Decimal("0.00"):
            payment.payment_status = Payment.STATUS_PARTIALLY_PAID
        else:
            payment.payment_status = Payment.STATUS_UNPAID

        payment.save(update_fields=["agreed_amount", "total_paid", "remaining_amount", "payment_status", "updated_at"])

        # 6. Save tracking location update
        TripLocationUpdate.objects.create(
            trip=trip,
            status=Trip.Status.TRIP_COMPLETED,
            location=location,
            note=note,
            updated_by=request.user,
        )

        # 7. Notify both parties
        if trip.booking:
            if trip.booking.owner:
                create_notification(
                    recipient=trip.booking.owner,
                    notification_type="delivery_completed",
                    title="Trip Confirmed & Completed!",
                    message=(
                        f"Customer has confirmed delivery for Trip #{trip.trip_id}. "
                        f"Trip is officially completed. Truck and Driver are now available. Payment ledger has been finalized."
                    ),
                    trip=trip,
                )
            if trip.booking.customer and is_owner:
                create_notification(
                    recipient=trip.booking.customer,
                    notification_type="delivery_completed",
                    title="Trip Completed",
                    message=f"Trip #{trip.trip_id} from {trip.pickup_location} to {trip.destination} is marked completed.",
                    trip=trip,
                )

        return Response(
            {
                "message": "Trip confirmed and completed successfully! Truck and driver are now available and payment is recorded.",
                "data": TripSerializer(trip).data,
            },
            status=status.HTTP_200_OK,
        )


class CompleteTripView(ConfirmDeliveryView):
    """
    Alias / backwards-compatible endpoint for completing trip.
    """
    pass   