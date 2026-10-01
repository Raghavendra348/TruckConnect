from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification

from .permissions import IsAdminUser


User = get_user_model()


class AdminSendNotificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    ADMIN_NOTIFICATION_TYPES = {
        "payment_reminder",
        "payment_overdue",
        "settlement_update",
        "report_update",
        "dispute_update",
        "document_verification",
        "trip_issue",
        "cancellation",
        "important_announcement",
        "account_warning",
        "other",
    }

    def post(self, request):
        recipient_type = request.data.get("recipient_type")
        user_id = request.data.get("user_id")
        trip_id = request.data.get("trip_id")
        notification_type = request.data.get("notification_type")
        title = request.data.get("title")
        message = request.data.get("message")
        priority = request.data.get("priority", "normal")

        # ============================================================
        # VALIDATION
        # ============================================================

        if not recipient_type:
            return Response(
                {
                    "recipient_type": "This field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if recipient_type not in {"customer", "truck_owner", "both"}:
            return Response(
                {
                    "recipient_type": (
                        "Choose customer, truck_owner, or both."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not notification_type:
            return Response(
                {
                    "notification_type": "This field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if notification_type not in self.ADMIN_NOTIFICATION_TYPES:
            return Response(
                {
                    "notification_type": (
                        "This notification type is not available "
                        "for admin-sent notifications."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not title:
            return Response(
                {
                    "title": "This field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not message:
            return Response(
                {
                    "message": "This field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if priority not in {"normal", "important", "urgent"}:
            return Response(
                {
                    "priority": (
                        "Choose normal, important, or urgent."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ============================================================
        # RECIPIENTS
        # ============================================================

        recipients = []

        if recipient_type in {"customer", "truck_owner"}:
            if not user_id:
                return Response(
                    {
                        "user_id": (
                            "This field is required when "
                            "recipient_type is customer or truck_owner."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {
                        "user_id": "User not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            expected_role = (
                "customer"
                if recipient_type == "customer"
                else "truck_owner"
            )

            if user.role != expected_role:
                return Response(
                    {
                        "user_id": (
                            f"Selected user is not a {expected_role}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            recipients.append(user)

        elif recipient_type == "both":
            if not trip_id:
                return Response(
                    {
                        "trip_id": (
                            "Trip ID is required when "
                            "recipient_type is both."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                from trips.models import Trip

                trip = (
                    Trip.objects
                    .select_related(
                        "booking",
                        "booking__customer",
                        "booking__owner",
                    )
                    .get(id=trip_id)
                )
            except Trip.DoesNotExist:
                return Response(
                    {
                        "trip_id": "Trip not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            if trip.booking.customer:
                recipients.append(trip.booking.customer)

            if trip.booking.owner:
                recipients.append(trip.booking.owner)

        # ============================================================
        # CREATE NOTIFICATIONS
        # ============================================================

        created_notifications = []

        for recipient in recipients:
            notification = Notification.objects.create(
                recipient=recipient,
                notification_type=notification_type,
                trip_id=trip_id if trip_id else None,
                title=title,
                message=message,
                priority=priority,
            )

            created_notifications.append(
                {
                    "id": notification.id,
                    "notification_id": notification.notification_id,
                    "recipient": recipient.id,
                    "recipient_email": recipient.email,
                    "recipient_name": recipient.full_name,
                    "notification_type": notification.notification_type,
                    "trip": notification.trip_id,
                    "title": notification.title,
                    "message": notification.message,
                    "priority": notification.priority,
                    "created_at": notification.created_at,
                }
            )

        return Response(
            {
                "message": (
                    "Notification sent successfully."
                    if len(created_notifications) == 1
                    else "Notifications sent successfully."
                ),
                "count": len(created_notifications),
                "data": created_notifications,
            },
            status=status.HTTP_201_CREATED,
        )