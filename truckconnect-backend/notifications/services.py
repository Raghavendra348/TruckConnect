from notifications.models import Notification


def create_notification(
    recipient,
    notification_type,
    title,
    message,
    trip=None,
    priority="normal",
):
    if not recipient:
        return None

    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        trip=trip,
        title=title,
        message=message,
        priority=priority,
    )

    return notification