from django.db import models

from bookings.models import Booking
from drivers.models import Driver
from loads.models import Load
from trucks.models import Truck


class Trip(models.Model):
    class Status(models.TextChoices):
        TRIP_CONFIRMED = "trip_confirmed", "Trip Confirmed"
        DRIVER_ASSIGNED = "driver_assigned", "Driver Assigned"
        DRIVER_REACHED_PICKUP = (
            "driver_reached_pickup",
            "Driver Reached Pickup",
        )
        LOADING_COMPLETED = (
            "loading_completed",
            "Loading Completed",
        )
        JOURNEY_STARTED = (
            "journey_started",
            "Journey Started",
        )
        IN_TRANSIT = "in_transit", "In Transit"
        NEAR_DESTINATION = (
            "near_destination",
            "Near Destination",
        )
        ARRIVED = "arrived", "Arrived"
        DELIVERED = "delivered", "Delivered"
        TRIP_COMPLETED = (
            "trip_completed",
            "Trip Completed",
        )
        CANCELLED = "cancelled", "Cancelled"
        ISSUE_REPORTED = (
            "issue_reported",
            "Issue Reported",
        )
        UNDER_REVIEW = (
            "under_review",
            "Under Review",
        )

    booking = models.OneToOneField(
        Booking,
        on_delete=models.PROTECT,
        related_name="trip",
    )

    load = models.ForeignKey(
        Load,
        on_delete=models.PROTECT,
        related_name="trips",
    )

    truck = models.ForeignKey(
        Truck,
        on_delete=models.PROTECT,
        related_name="trips",
    )

    driver = models.ForeignKey(
        Driver,
        on_delete=models.PROTECT,
        related_name="trips",
        null=True,
        blank=True,
    )

    trip_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    start_location = models.CharField(
        max_length=255,
    )

    pickup_location = models.CharField(
        max_length=255,
    )

    destination = models.CharField(
        max_length=255,
    )

    current_location = models.CharField(
        max_length=255,
    )

    current_status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.TRIP_CONFIRMED,
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        super().save(*args, **kwargs)

        if is_new and not self.trip_id:
            self.trip_id = (
                f"TRP-{self.created_at.year}-{self.pk:06d}"
            )

            super().save(
                update_fields=["trip_id"]
            )

    def __str__(self):
        return self.trip_id or f"Trip #{self.pk}"


class TripLocationUpdate(models.Model):
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name="location_updates",
    )

    status = models.CharField(
        max_length=30,
        choices=Trip.Status.choices,
    )

    location = models.CharField(
        max_length=255,
    )

    note = models.TextField(
        blank=True,
    )

    photo = models.ImageField(
        upload_to="trip_updates/",
        blank=True,
        null=True,
    )

    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="trip_location_updates",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.trip.trip_id} - "
            f"{self.location} - "
            f"{self.status}"
        )