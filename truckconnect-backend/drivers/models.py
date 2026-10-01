from django.conf import settings
from django.db import models


class Driver(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    class DriverStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        ON_TRIP = "on_trip", "On Trip"
        UNAVAILABLE = "unavailable", "Unavailable"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="drivers",
        limit_choices_to={"role": "truck_owner"},
    )

    full_name = models.CharField(
        max_length=150,
    )

    photo = models.ImageField(
        upload_to="drivers/",
        blank=True,
        null=True,
    )

    mobile_number = models.CharField(
        max_length=20,
    )

    driving_licence = models.FileField(
        upload_to="driver_documents/",
        blank=True,
        null=True,
    )

    licence_number = models.CharField(
        max_length=100,
        unique=True,
    )

    licence_expiry = models.DateField()

    experience_years = models.PositiveIntegerField(
        default=0,
    )

    address = models.TextField()

    emergency_contact = models.CharField(
        max_length=20,
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    status = models.CharField(
        max_length=20,
        choices=DriverStatus.choices,
        default=DriverStatus.AVAILABLE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.full_name