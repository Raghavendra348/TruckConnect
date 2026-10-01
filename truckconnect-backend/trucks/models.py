from django.conf import settings
from django.db import models


class Truck(models.Model):
    class TruckStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        ON_TRIP = "on_trip", "On Trip"
        MAINTENANCE = "maintenance", "Maintenance"
        UNAVAILABLE = "unavailable", "Unavailable"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trucks",
        limit_choices_to={"role": "truck_owner"},
    )

    registration_number = models.CharField(
        max_length=50,
        unique=True,
    )

    truck_type = models.CharField(
        max_length=100,
    )

    capacity_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    manufacturer = models.CharField(
        max_length=100,
    )

    model = models.CharField(
        max_length=100,
    )

    year = models.PositiveIntegerField()

    fuel_type = models.CharField(
        max_length=50,
    )

    truck_photo = models.ImageField(
        upload_to="trucks/",
        blank=True,
        null=True,
    )

    base_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    current_location = models.CharField(
        max_length=255,
    )

    current_location_updated_at = models.DateTimeField(
        auto_now=True,
    )

    status = models.CharField(
        max_length=20,
        choices=TruckStatus.choices,
        default=TruckStatus.AVAILABLE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"{self.registration_number} - "
            f"{self.truck_type}"
        )


class TruckDocument(models.Model):
    class DocumentType(models.TextChoices):
        RC = "rc", "RC"
        PUC = "puc", "PUC / Pollution Certificate"
        INSURANCE = "insurance", "Insurance"
        FITNESS = "fitness", "Fitness Certificate"
        PERMIT = "permit", "Permit"
        OTHER = "other", "Other Document"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    truck = models.ForeignKey(
        Truck,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
    )

    document_number = models.CharField(
        max_length=100,
    )

    file = models.FileField(
        upload_to="truck_documents/",
    )

    expiry_date = models.DateField()

    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="verified_truck_documents",
        blank=True,
        null=True,
        limit_choices_to={"role": "admin"},
    )

    verified_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"{self.truck.registration_number} - "
            f"{self.get_document_type_display()}"
        )