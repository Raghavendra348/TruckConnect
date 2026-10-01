from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import IsTruckOwner

from .models import Driver
from .serializers import DriverSerializer


class DriverListCreateView(generics.ListCreateAPIView):
    serializer_class = DriverSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        from trips.models import Trip
        drivers = Driver.objects.filter(
            owner=self.request.user
        ).order_by("-created_at")
        for driver in drivers:
            has_active = Trip.objects.filter(
                driver=driver,
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
            if not has_active and driver.status == Driver.DriverStatus.ON_TRIP:
                driver.status = Driver.DriverStatus.AVAILABLE
                driver.save(update_fields=["status", "updated_at"])
            elif has_active and driver.status == Driver.DriverStatus.AVAILABLE:
                driver.status = Driver.DriverStatus.ON_TRIP
                driver.save(update_fields=["status", "updated_at"])
        return drivers

    def perform_create(self, serializer):
        serializer.save(
            owner=self.request.user
        )


class DriverDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DriverSerializer
    permission_classes = [IsTruckOwner]

    def get_queryset(self):
        return Driver.objects.filter(
            owner=self.request.user
        )

    def perform_update(self, serializer):
        driver = self.get_object()

        if driver.status == Driver.DriverStatus.ON_TRIP:
            raise PermissionDenied(
                "A driver currently assigned to a trip cannot be modified."
            )

        # If only the operational status is being changed,
        # keep the existing verification status.
        update_fields = set(serializer.validated_data.keys())

        status_only_update = update_fields.issubset({"status"})

        if status_only_update:
            serializer.save()
        else:
            # Any profile/document-related modification requires
            # the driver to be verified again.
            serializer.save(
                verification_status=Driver.VerificationStatus.PENDING,
            )

    def perform_destroy(self, instance):
        if instance.status == Driver.DriverStatus.ON_TRIP:
            raise PermissionDenied(
                "A driver currently assigned to a trip cannot be deleted."
            )

        instance.status = Driver.DriverStatus.UNAVAILABLE

        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )