from django.db import models
from django.conf import settings


class Report(models.Model):
    REPORT_TYPES = [
        ("cargo_damaged", "Cargo Damaged"),
        ("cargo_missing", "Cargo Missing"),
        ("wrong_weight_quantity", "Wrong Weight/Quantity"),
        ("truck_capacity_issue", "Truck Capacity Issue"),
        ("driver_misbehavior", "Driver Misbehavior"),
        ("truck_condition_problem", "Truck Condition Problem"),
        ("delivery_delay", "Delivery Delay"),
        ("delivery_not_completed", "Delivery Not Completed"),
        ("owner_misbehavior", "Owner Misbehavior"),
        ("payment_issue", "Payment Issue"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("under_review", "Under Review"),
        ("waiting_for_customer", "Waiting for Customer"),
        ("waiting_for_owner", "Waiting for Owner"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
        ("rejected", "Rejected"),
    ]

    report_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="reports",
        null=True,
        blank=True,
    )

    load = models.ForeignKey(
        "loads.Load",
        on_delete=models.CASCADE,
        related_name="reports",
        null=True,
        blank=True,
    )

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_created",
    )

    reported_against = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_against",
    )

    report_type = models.CharField(
        max_length=50,
        choices=REPORT_TYPES,
    )

    description = models.TextField()

    expected_information = models.TextField(
        blank=True,
        null=True,
    )

    actual_information = models.TextField(
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="open",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def save(self, *args, **kwargs):
        if not self.report_id:
            year = self.created_at.year if self.created_at else 2026

            last_report = (
                Report.objects
                .filter(report_id__startswith=f"RPT-{year}-")
                .order_by("-id")
                .first()
            )

            if last_report:
                try:
                    last_number = int(last_report.report_id.split("-")[-1])
                except (ValueError, IndexError):
                    last_number = 0
            else:
                last_number = 0

            self.report_id = f"RPT-{year}-{last_number + 1:06d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.report_id