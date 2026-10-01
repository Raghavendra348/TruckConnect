from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from notifications.services import create_notification

from .models import Settlement
from .serializers import SettlementSerializer


class SettlementListCreateView(generics.ListCreateAPIView):
    serializer_class = SettlementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Settlement.objects.all()
        return Settlement.objects.filter(
            trip__booking__customer=user
        ) | Settlement.objects.filter(
            trip__booking__owner=user
        )

    def perform_create(self, serializer):
        trip = serializer.validated_data["trip"]

        is_customer = trip.booking.customer == self.request.user
        is_owner = trip.booking.owner == self.request.user

        if not (is_customer or is_owner):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You do not have permission to create a settlement for this trip."
            )

        settlement = serializer.save()

        self._create_settlement_notification(
            settlement=settlement,
            acting_user=self.request.user,
        )

    def _create_settlement_notification(self, settlement, acting_user):
        customer = settlement.trip.booking.customer
        owner = settlement.trip.booking.owner

        # Notify the other party
        if acting_user == customer:
            recipient = owner
        else:
            recipient = customer

        create_notification(
            recipient=recipient,
            notification_type="settlement_completed",
            title="Settlement Completed",
            message=(
                f"Settlement for trip {settlement.trip.trip_id} "
                f"has been completed."
            ),
        )


class SettlementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SettlementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Settlement.objects.all()
        return Settlement.objects.filter(
            trip__booking__customer=user
        ) | Settlement.objects.filter(
            trip__booking__owner=user
        )

    def perform_update(self, serializer):
        settlement = serializer.save()

        customer = settlement.trip.booking.customer
        owner = settlement.trip.booking.owner

        if self.request.user == customer:
            recipient = owner
        else:
            recipient = customer

        create_notification(
            recipient=recipient,
            notification_type="settlement_completed",
            title="Settlement Completed",
            message=(
                f"Settlement for trip {settlement.trip.trip_id} "
                f"has been completed."
            ),
        )