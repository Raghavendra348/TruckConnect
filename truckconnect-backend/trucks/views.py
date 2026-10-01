from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import IsTruckOwner

from .models import Truck, TruckDocument
from .serializers import TruckDocumentSerializer, TruckSerializer


class TruckListCreateView(generics.ListCreateAPIView):
    serializer_class = TruckSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        from trips.models import Trip
        trucks = Truck.objects.filter(
            owner=self.request.user
        ).order_by("-created_at")
        for truck in trucks:
            has_active = Trip.objects.filter(
                truck=truck,
                current_status__in=[
                    Trip.Status.TRIP_CONFIRMED,
                    Trip.Status.DRIVER_ASSIGNED,
                    Trip.Status.DRIVER_REACHED_PICKUP,
                    Trip.Status.LOADING_COMPLETED,
                    Trip.Status.JOURNEY_STARTED,
                    Trip.Status.IN_TRANSIT,
                    Trip.Status.NEAR_DESTINATION,
                    Trip.Status.ARRIVED,
                    Trip.Status.DELIVERED,
                ]
            ).exists()
            if not has_active and truck.status == Truck.TruckStatus.ON_TRIP:
                truck.status = Truck.TruckStatus.AVAILABLE
                truck.save(update_fields=["status", "updated_at"])
            elif has_active and truck.status == Truck.TruckStatus.AVAILABLE:
                truck.status = Truck.TruckStatus.ON_TRIP
                truck.save(update_fields=["status", "updated_at"])
        return trucks

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user
        )


class TruckDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TruckSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return Truck.objects.filter(
            owner=self.request.user
        )

    def perform_update(self, serializer):
        truck = self.get_object()

        if truck.status == Truck.TruckStatus.ON_TRIP:
            raise PermissionDenied(
                "A truck that is currently on a trip cannot be modified."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.status == Truck.TruckStatus.ON_TRIP:
            raise PermissionDenied(
                "A truck that is currently on a trip cannot be deleted."
            )

        instance.status = Truck.TruckStatus.UNAVAILABLE

        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


class TruckDocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = TruckDocumentSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return TruckDocument.objects.filter(
            truck__owner=self.request.user
        ).select_related(
            "truck",
            "verified_by",
        ).order_by("-created_at")

    def perform_create(self, serializer):
        truck_id = self.request.data.get("truck")

        try:
            truck = Truck.objects.get(
                id=truck_id,
                owner=self.request.user,
            )
        except Truck.DoesNotExist:
            raise PermissionDenied(
                "You can only upload documents for your own trucks."
            )

        serializer.save(
            truck=truck
        )


class TruckDocumentDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = TruckDocumentSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return TruckDocument.objects.filter(
            truck__owner=self.request.user
        ).select_related(
            "truck",
            "verified_by",
        )

    def perform_update(self, serializer):
        document = self.get_object()

        if document.verification_status == (
            TruckDocument.VerificationStatus.VERIFIED
        ):
            raise PermissionDenied(
                "A verified document cannot be modified."
            )

        serializer.save(
            verification_status=(
                TruckDocument.VerificationStatus.PENDING
            ),
            verified_by=None,
            verified_at=None,
        )

    def perform_destroy(self, instance):
        if instance.verification_status == (
            TruckDocument.VerificationStatus.VERIFIED
        ):
            raise PermissionDenied(
                "A verified document cannot be deleted."
            )

        instance.delete()