from django.conf import settings
from django.db import models


class Load(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        OFFER_RECEIVED = "offer_received", "Offer Received"
        BOOKED = "booked", "Booked"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loads",
        limit_choices_to={"role": "customer"},
    )

    goods_type = models.CharField(
        max_length=150,
    )

    weight_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    pickup_location = models.CharField(
        max_length=255,
    )

    destination = models.CharField(
        max_length=255,
    )

    pickup_date = models.DateField()

    pickup_time = models.TimeField()

    special_requirements = models.TextField(
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"Load #{self.id} - "
            f"{self.pickup_location} to {self.destination}"
        )