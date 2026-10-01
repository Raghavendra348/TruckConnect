from django.conf import settings
from django.db import models

from loads.models import Load
from trucks.models import Truck


class Offer(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        NEGOTIATING = "negotiating", "Negotiating"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    load = models.ForeignKey(
        Load,
        on_delete=models.CASCADE,
        related_name="offers",
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="offers",
        limit_choices_to={"role": "truck_owner"},
    )

    truck = models.ForeignKey(
        Truck,
        on_delete=models.PROTECT,
        related_name="offers",
    )

    offered_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    owner_message = models.TextField(
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"Offer #{self.id} - "
            f"{self.truck.registration_number} - "
            f"{self.offered_price}"
        )