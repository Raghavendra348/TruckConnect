from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListCreateView(generics.ListCreateAPIView):

    serializer_class = NotificationSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):

        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only authorized admin users can create notifications."
            )

        serializer.save()


class NotificationDetailView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = NotificationSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


class MarkNotificationReadView(
    generics.UpdateAPIView
):

    serializer_class = NotificationSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return Notification.objects.filter(
            recipient=self.request.user
        )

    def update(self, request, *args, **kwargs):

        notification = self.get_object()

        notification.is_read = True
        notification.read_at = timezone.now()

        notification.save(
            update_fields=[
                "is_read",
                "read_at"
            ]
        )

        serializer = self.get_serializer(
            notification
        )

        return Response(
            serializer.data
        )