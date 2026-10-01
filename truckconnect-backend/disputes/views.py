from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from notifications.services import create_notification
from .models import Dispute
from .serializers import DisputeSerializer


class DisputeListCreateView(generics.ListCreateAPIView):
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Dispute.objects.all().select_related("report", "trip", "created_by").prefetch_related("settlements").order_by("-created_at")

        return (
            Dispute.objects.filter(report__reported_by=user)
            | Dispute.objects.filter(report__reported_against=user)
            | Dispute.objects.filter(trip__booking__customer=user)
            | Dispute.objects.filter(trip__booking__owner=user)
        ).distinct().select_related("report", "trip", "created_by").prefetch_related("settlements").order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Disputes are only opened after an Incident Report is reviewed and escalated by platform administrators. Please submit an Incident Report first."
            )

        validated_data = serializer.validated_data
        report = validated_data.get("report")
        trip = validated_data.get("trip")
        if report and not trip:
            trip = report.trip

        dispute = serializer.save(
            created_by=user,
            trip=trip,
        )


class DisputeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Dispute.objects.all().select_related("report", "trip", "created_by").prefetch_related("settlements")

        return (
            Dispute.objects.filter(created_by=user)
            | Dispute.objects.filter(report__reported_by=user)
            | Dispute.objects.filter(report__reported_against=user)
            | Dispute.objects.filter(trip__booking__customer=user)
            | Dispute.objects.filter(trip__booking__owner=user)
        ).distinct().select_related("report", "trip", "created_by").prefetch_related("settlements")

    def perform_update(self, serializer):
        dispute = serializer.save()
        return dispute


class DisputeSubmitEvidenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, dispute_id):
        try:
            dispute = Dispute.objects.select_related("report", "trip", "created_by").get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        counter_statement = request.data.get("respondent_response") or request.data.get("statement")
        counter_evidence = request.data.get("respondent_evidence") or request.data.get("evidence")
        initial_evidence = request.data.get("initiator_evidence")

        if initial_evidence and dispute.created_by == user:
            dispute.evidence = initial_evidence

        if counter_statement is not None:
            dispute.respondent_response = counter_statement
        if counter_evidence is not None:
            dispute.respondent_evidence = counter_evidence

        if dispute.status in ["open", "waiting_for_customer", "waiting_for_owner"]:
            dispute.status = "under_review"

        dispute.save()

        # Notify the creator / other party
        trip_ref = getattr(dispute.trip, "trip_id", str(dispute.trip_id)) if dispute.trip else "General"
        other_user = dispute.created_by if dispute.created_by != user else None
        if not other_user and dispute.trip and getattr(dispute.trip, "booking", None):
            customer = dispute.trip.booking.customer
            owner = dispute.trip.booking.owner
            other_user = owner if user == customer else customer

        if other_user and other_user != user:
            create_notification(
                recipient=other_user,
                notification_type="dispute_updated",
                title="Counter-Evidence Submitted on Dispute",
                message=f"Counter-evidence & statement submitted on Dispute #{dispute.dispute_id} (Trip #{trip_ref}).",
                trip=dispute.trip,
            )

        return Response(
            {
                "message": "Evidence and statement submitted successfully for arbitration.",
                "data": DisputeSerializer(dispute).data,
            },
            status=status.HTTP_200_OK,
        )