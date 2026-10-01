from django.conf import settings
from django.db import models


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("offer_received", "Offer Received"),
        ("offer_accepted", "Offer Accepted"),
        ("driver_assigned", "Driver Assigned"),
        ("trip_started", "Trip Started"),
        ("trip_status_changed", "Trip Status Changed"),
        ("payment_received", "Payment Received"),
        ("payment_due", "Payment Due"),
        ("payment_overdue", "Payment Overdue"),
        ("delivery_completed", "Delivery Completed"),
        ("report_created", "Report Created"),
        ("report_updated", "Report Updated"),
        ("settlement_completed", "Settlement Completed"),
        ("document_expiring", "Document Expiring"),
        ("payment_reminder", "Payment Reminder"),
        ("settlement_update", "Settlement Update"),
        ("report_update", "Report Update"),
        ("dispute_update", "Dispute Update"),
        ("document_verification", "Document Verification"),
        ("trip_issue", "Trip Issue"),
        ("cancellation", "Cancellation"),
        ("important_announcement", "Important Announcement"),
        ("account_warning", "Account Warning"),
        ("other", "Other"),
    ]

    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("important", "Important"),
        ("urgent", "Urgent"),
    ]

    notification_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    # Used by automatic notifications to prevent duplicate notifications.
    # Example:
    # truck-document:5:2026-10-13
    # driver-license:3:2026-10-13
    reference_key = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
    )

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    title = models.CharField(max_length=255)

    message = models.TextField()

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="normal",
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        if not self.notification_id:
            from django.utils import timezone

            current_year = timezone.now().year
            prefix = f"NTF-{current_year}-"

            last_notification = (
                Notification.objects
                .filter(notification_id__startswith=prefix)
                .order_by("-id")
                .first()
            )

            if last_notification:
                last_number = int(
                    last_notification.notification_id.split("-")[-1]
                )
                next_number = last_number + 1
            else:
                next_number = 1

            self.notification_id = (
                f"{prefix}{next_number:06d}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.notification_id