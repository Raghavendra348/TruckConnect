from rest_framework import generics, permissions

from notifications.services import create_notification

from .models import Report
from .serializers import ReportSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Report.objects.all().select_related("trip", "load", "reported_by", "reported_against").order_by("-created_at")

        return (
            Report.objects.filter(reported_by=user) | Report.objects.filter(reported_against=user)
        ).select_related(
            "trip",
            "load",
            "reported_by",
            "reported_against",
        ).order_by("-created_at")

    def perform_create(self, serializer):
        report = serializer.save(
            reported_by=self.request.user
        )

        if report.reported_against:
            create_notification(
                recipient=report.reported_against,
                notification_type="report_created",
                title="New Report Created",
                message=(
                    f"A report has been created against you"
                    f"{f' for trip {report.trip.trip_id}' if report.trip else ''}."
                ),
            )


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, "role", None) == "admin":
            return Report.objects.all().select_related("trip", "load", "reported_by", "reported_against")

        return (
            Report.objects.filter(reported_by=user) | Report.objects.filter(reported_against=user)
        ).select_related(
            "trip",
            "load",
            "reported_by",
            "reported_against",
        )

    def perform_update(self, serializer):
        report = serializer.save()

        if report.reported_against:
            create_notification(
                recipient=report.reported_against,
                notification_type="report_updated",
                title="Report Updated",
                message=(
                    f"Report {report.report_id} has been updated."
                    f"{f' Trip: {report.trip.trip_id}.' if report.trip else ''}"
                ),
            )