from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from drivers.models import Driver
from notifications.models import Notification
from trucks.models import TruckDocument


class Command(BaseCommand):
    help = "Create automatic notifications for documents expiring in 15 days."

    EXPIRY_NOTIFICATION_DAYS = 15

    def handle(self, *args, **options):
        today = timezone.localdate()
        target_expiry_date = today + timedelta(
            days=self.EXPIRY_NOTIFICATION_DAYS
        )

        truck_document_count = 0
        driver_licence_count = 0
        notification_count = 0

        # ============================================================
        # TRUCK DOCUMENTS
        # ============================================================

        truck_documents = (
            TruckDocument.objects
            .select_related("truck", "truck__owner")
            .filter(expiry_date=target_expiry_date)
        )

        for document in truck_documents:
            owner = document.truck.owner

            if not owner:
                continue

            reference_key = (
                f"truck-document:"
                f"{document.id}:"
                f"{document.expiry_date}"
            )

            notification_exists = Notification.objects.filter(
                reference_key=reference_key
            ).exists()

            if notification_exists:
                continue

            Notification.objects.create(
                reference_key=reference_key,
                recipient=owner,
                notification_type="document_expiring",
                title="Document Expiring",
                message=(
                    f"Your {document.get_document_type_display()} "
                    f"for truck {document.truck.registration_number} "
                    f"will expire on {document.expiry_date}. "
                    f"Please renew the document before the expiry date."
                ),
                priority="important",
            )

            notification_count += 1
            truck_document_count += 1

        # ============================================================
        # DRIVER LICENCES
        # ============================================================

        drivers = (
            Driver.objects
            .select_related("owner")
            .filter(licence_expiry=target_expiry_date)
        )

        for driver in drivers:
            owner = driver.owner

            if not owner:
                continue

            reference_key = (
                f"driver-license:"
                f"{driver.id}:"
                f"{driver.licence_expiry}"
            )

            notification_exists = Notification.objects.filter(
                reference_key=reference_key
            ).exists()

            if notification_exists:
                continue

            Notification.objects.create(
                reference_key=reference_key,
                recipient=owner,
                notification_type="document_expiring",
                title="Driver Licence Expiring",
                message=(
                    f"Driver licence for {driver.full_name} "
                    f"will expire on {driver.licence_expiry}. "
                    f"Please renew the licence before the expiry date."
                ),
                priority="important",
            )

            notification_count += 1
            driver_licence_count += 1

        # ============================================================
        # RESULT
        # ============================================================

        self.stdout.write(
            self.style.SUCCESS(
                f"Expiry date checked: {target_expiry_date}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Truck document notifications created: "
                f"{truck_document_count}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Driver licence notifications created: "
                f"{driver_licence_count}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Total document expiry notifications created: "
                f"{notification_count}"
            )
        )