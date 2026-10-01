from django.db import models
from django.conf import settings


class Dispute(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("under_review", "Under Review"),
        ("waiting_for_customer", "Waiting for Customer"),
        ("waiting_for_owner", "Waiting for Owner"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
        ("closed", "Closed"),
    ]

    dispute_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    report = models.OneToOneField(
        "reports.Report",
        on_delete=models.CASCADE,
        related_name="dispute",
        null=True,
        blank=True,
    )

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="disputes",
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="disputes_created",
    )

    reason = models.TextField(
        blank=True,
        default="",
    )

    evidence = models.TextField(
        blank=True,
        default="",
    )

    respondent_response = models.TextField(
        blank=True,
        default="",
    )

    respondent_evidence = models.TextField(
        blank=True,
        default="",
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="open",
    )

    admin_notes = models.TextField(
        blank=True,
        null=True,
    )

    resolution = models.TextField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def save(self, *args, **kwargs):
        if not self.dispute_id:
            year = self.created_at.year if self.created_at else 2026

            last_dispute = (
                Dispute.objects
                .filter(
                    dispute_id__startswith=f"DSP-{year}-"
                )
                .order_by("-id")
                .first()
            )

            if last_dispute:
                try:
                    last_number = int(
                        last_dispute.dispute_id.split("-")[-1]
                    )
                except (ValueError, IndexError):
                    last_number = 0
            else:
                last_number = 0

            self.dispute_id = (
                f"DSP-{year}-{last_number + 1:06d}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.dispute_id