from django.utils import timezone
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification

        fields = [
            "id",
            "notification_id",
            "recipient",
            "notification_type",
            "trip",
            "title",
            "message",
            "priority",
            "is_read",
            "created_at",
            "read_at",
        ]

        read_only_fields = [
            "id",
            "notification_id",
            "created_at",
            "read_at",
        ]

    def update(self, instance, validated_data):

        if validated_data.get("is_read") is True:
            instance.read_at = timezone.now()

        elif validated_data.get("is_read") is False:
            instance.read_at = None

        return super().update(
            instance,
            validated_data
        )