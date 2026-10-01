from decimal import Decimal

from django.conf import settings
from django.db import models


class Payment(models.Model):
    STATUS_UNPAID = "unpaid"
    STATUS_PARTIALLY_PAID = "partially_paid"
    STATUS_FULLY_PAID = "fully_paid"
    STATUS_OVERDUE = "overdue"

    PAYMENT_STATUS_CHOICES = [
        (STATUS_UNPAID, "Unpaid"),
        (STATUS_PARTIALLY_PAID, "Partially Paid"),
        (STATUS_FULLY_PAID, "Fully Paid"),
        (STATUS_OVERDUE, "Overdue"),
    ]

    trip = models.OneToOneField(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="payment",
    )

    agreed_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    remaining_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    payment_status = models.CharField(
        max_length=30,
        choices=PAYMENT_STATUS_CHOICES,
        default=STATUS_UNPAID,
    )

    due_date = models.DateField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_payment_status(self):
        if self.total_paid <= Decimal("0.00"):
            self.payment_status = self.STATUS_UNPAID

        elif self.total_paid < self.agreed_amount:
            self.payment_status = self.STATUS_PARTIALLY_PAID

        else:
            self.total_paid = self.agreed_amount
            self.payment_status = self.STATUS_FULLY_PAID

        self.remaining_amount = max(
            self.agreed_amount - self.total_paid,
            Decimal("0.00"),
        )

    def save(self, *args, **kwargs):
        self.update_payment_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment for {self.trip.trip_id}"


class PaymentTransaction(models.Model):
    PAYMENT_TYPE_ADVANCE = "advance"
    PAYMENT_TYPE_TRIP = "trip_payment"
    PAYMENT_TYPE_FINAL = "final_payment"

    PAYMENT_TYPE_CHOICES = [
        (PAYMENT_TYPE_ADVANCE, "Advance"),
        (PAYMENT_TYPE_TRIP, "Trip Payment"),
        (PAYMENT_TYPE_FINAL, "Final Payment"),
    ]

    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    TRANSACTION_STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="transactions",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_type = models.CharField(
        max_length=30,
        choices=PAYMENT_TYPE_CHOICES,
    )

    payment_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )

    payment_date = models.DateTimeField(
        auto_now_add=True,
    )

    status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default=STATUS_COMPLETED,
    )

    proof = models.FileField(
        upload_to="payment_proofs/",
        blank=True,
        null=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_payment_transactions",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.payment.trip.trip_id} - "
            f"{self.payment_type} - "
            f"{self.amount}"
        )