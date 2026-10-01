from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.services import create_notification
from payments.models import Payment


class Command(BaseCommand):
    help = "Marks overdue payments and creates overdue notifications."

    def handle(self, *args, **options):
        today = timezone.localdate()

        payments = Payment.objects.filter(
            due_date__lt=today,
            payment_status__in=[
                Payment.STATUS_UNPAID,
                Payment.STATUS_PARTIALLY_PAID,
            ],
        ).select_related(
            "trip",
            "trip__booking",
            "trip__booking__customer",
        )

        overdue_count = 0

        for payment in payments:
            Payment.objects.filter(
                id=payment.id
            ).update(
                payment_status=Payment.STATUS_OVERDUE,
                updated_at=timezone.now(),
            )

            customer = payment.trip.booking.customer

            create_notification(
                recipient=customer,
                notification_type="payment_overdue",
                title="Payment Overdue",
                message=(
                    f"Payment of {payment.remaining_amount} is overdue "
                    f"for trip {payment.trip.trip_id}. "
                    f"Payment due date was {payment.due_date}."
                ),
            )

            overdue_count += 1

            self.stdout.write(
                self.style.WARNING(
                    f"Payment {payment.id} marked as overdue."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Overdue payment check completed. "
                f"{overdue_count} payment(s) marked as overdue."
            )
        )