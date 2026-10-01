from django.conf import settings
from django.db import models

from loads.models import Load
from offers.models import Offer
from trucks.models import Truck


class Booking(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="customer_bookings",
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owner_bookings",
    )

    load = models.ForeignKey(
        Load,
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    offer = models.OneToOneField(
        Offer,
        on_delete=models.PROTECT,
        related_name="booking",
    )

    truck = models.ForeignKey(
        Truck,
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    final_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED,
    )

    confirmed_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"Booking #{self.id}"