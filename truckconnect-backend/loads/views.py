from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Load
from .serializers import LoadSerializer


class LoadListCreateView(generics.ListCreateAPIView):
    serializer_class = LoadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") == "truck_owner":
            return Load.objects.filter(
                status__in=[Load.Status.ACTIVE, Load.Status.OFFER_RECEIVED]
            ).order_by("-created_at")

        return Load.objects.filter(
            customer=user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        if getattr(self.request.user, "role", "") != "customer":
            raise PermissionDenied("Only customers can create loads.")

        serializer.save(
            customer=self.request.user
        )


class LoadDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LoadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") == "truck_owner":
            return Load.objects.all()

        return Load.objects.filter(
            customer=user
        )

    def perform_update(self, serializer):
        load = self.get_object()

        if load.status not in [Load.Status.ACTIVE, Load.Status.OFFER_RECEIVED]:
            raise PermissionDenied(
                "Only unbooked loads can be modified."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.status not in [Load.Status.ACTIVE, Load.Status.OFFER_RECEIVED]:
            raise PermissionDenied(
                "Only unbooked loads can be cancelled."
            )

        instance.status = Load.Status.CANCELLED
        instance.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        from offers.models import Offer
        from notifications.services import create_notification

        pending_offers = instance.offers.filter(
            status__in=[Offer.Status.PENDING, Offer.Status.NEGOTIATING]
        )
        for off in pending_offers:
            off.status = Offer.Status.REJECTED
            off.save(update_fields=["status", "updated_at"])
            try:
                create_notification(
                    recipient=off.owner,
                    notification_type="cancellation",
                    title="Load Cancelled by Customer",
                    message=(
                        f"Load #{instance.id} ({instance.pickup_location} ➔ {instance.destination}) "
                        f"has been cancelled by the customer. Your bid was closed."
                    ),
                )
            except Exception:
                pass