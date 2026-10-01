from django.conf import settings
from django.db import models


class Settlement(models.Model):

    SETTLEMENT_TYPES = [
        ("customer_compensation", "Customer Compensation"),
        ("additional_owner_payment", "Additional Owner Payment"),
        ("fare_reduction", "Fare Reduction"),
        ("cancellation_compensation", "Cancellation Compensation"),
        ("damage_compensation", "Damage Compensation"),
        ("payment_adjustment", "Payment Adjustment"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending_review", "Pending Review"),
        ("under_review", "Under Review"),
        ("settlement_proposed", "Settlement Proposed"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("settled", "Settled"),
        ("cancelled", "Cancelled"),
    ]

    settlement_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True
    )

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="settlements"
    )

    report = models.ForeignKey(
        "reports.Report",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settlements"
    )

    dispute = models.ForeignKey(
        "disputes.Dispute",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settlements"
    )

    original_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    amount_already_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    adjustment_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    final_settlement_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settlements_to_pay"
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settlements_to_receive"
    )

    settlement_type = models.CharField(
        max_length=50,
        choices=SETTLEMENT_TYPES
    )

    reason = models.TextField()

    evidence = models.TextField(
        blank=True,
        default=""
    )

    admin_notes = models.TextField(
        blank=True,
        default=""
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="pending_review"
    )

    created_date = models.DateTimeField(
        auto_now_add=True
    )

    resolved_date = models.DateTimeField(
        null=True,
        blank=True
    )

    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_settlements"
    )

    def save(self, *args, **kwargs):

        if not self.settlement_id:
            year = models.functions.Now()

            from django.utils import timezone

            current_year = timezone.now().year

            prefix = f"SET-{current_year}-"

            last_settlement = (
                Settlement.objects
                .filter(settlement_id__startswith=prefix)
                .order_by("-id")
                .first()
            )

            if last_settlement:
                last_number = int(
                    last_settlement.settlement_id.split("-")[-1]
                )
                next_number = last_number + 1
            else:
                next_number = 1

            self.settlement_id = (
                f"{prefix}{next_number:06d}"
            )

        self.final_settlement_amount = (
            self.original_amount + self.adjustment_amount
        )

        super().save(*args, **kwargs)

        if self.trip_id:
            try:
                self.sync_trip_payment()
            except Exception:
                pass

    def sync_trip_payment(self):
        from decimal import Decimal
        from payments.models import Payment, PaymentTransaction

        trip = self.trip
        if not trip:
            return

        booking = getattr(trip, "booking", None)

        active_settlement = (
            trip.settlements
            .exclude(status__in=["cancelled", "rejected"])
            .order_by("-created_date")
            .first()
        )

        if active_settlement and active_settlement.final_settlement_amount is not None and active_settlement.final_settlement_amount > Decimal("0.00"):
            target_amount = active_settlement.final_settlement_amount
        else:
            target_amount = (
                getattr(booking, "final_price", None)
                or getattr(booking, "agreed_price", None)
                or getattr(getattr(booking, "offer", None), "offered_price", None)
                or Decimal("15000.00")
            )

        payment, _ = Payment.objects.get_or_create(
            trip=trip,
            defaults={
                "agreed_amount": target_amount,
                "total_paid": Decimal("0.00"),
                "remaining_amount": target_amount,
                "payment_status": Payment.STATUS_UNPAID,
            }
        )

        actual_paid = sum(
            (tx.amount for tx in payment.transactions.filter(status=PaymentTransaction.STATUS_COMPLETED)),
            Decimal("0.00"),
        )
        payment.agreed_amount = target_amount
        payment.total_paid = actual_paid
        payment.remaining_amount = max(payment.agreed_amount - actual_paid, Decimal("0.00"))
        if actual_paid >= payment.agreed_amount and payment.agreed_amount > Decimal("0.00"):
            payment.payment_status = Payment.STATUS_FULLY_PAID
        elif actual_paid > Decimal("0.00"):
            payment.payment_status = Payment.STATUS_PARTIALLY_PAID
        else:
            payment.payment_status = Payment.STATUS_UNPAID

        payment.save(update_fields=["agreed_amount", "total_paid", "remaining_amount", "payment_status", "updated_at"])

    def __str__(self):
        return self.settlement_id