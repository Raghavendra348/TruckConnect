from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.services import create_notification
from disputes.models import Dispute
from bookings.models import Booking
from drivers.models import Driver
from loads.models import Load
from notifications.models import Notification
from offers.models import Offer
from payments.models import Payment
from reports.models import Report
from settlements.models import Settlement
from trucks.models import Truck
from trips.models import Trip

from .permissions import IsAdminUser
from .serializers import (
    AdminDashboardSerializer,
    AdminUserSerializer,
    AdminVerificationSerializer,
    AdminTruckSerializer,
    AdminLoadSerializer,
    AdminOfferSerializer,
    AdminBookingSerializer,
    AdminTripSerializer,
    AdminPaymentSerializer,
    AdminReportSerializer,
    AdminDisputeSerializer,
    AdminNotificationSerializer,
    AdminSettlementSerializer,
)


User = get_user_model()


# ============================================================
# ADMIN DASHBOARD
# ============================================================

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        data = {
            "customers": User.objects.filter(role="customer").count(),
            "truck_owners": User.objects.filter(role="truck_owner").count(),
            "trucks": Truck.objects.count(),
            "drivers": Driver.objects.count(),
            "loads": Load.objects.count(),
            "offers": Offer.objects.count(),
            "bookings": Booking.objects.count(),
            "trips": Trip.objects.count(),
            "payments": Payment.objects.count(),
            "reports": Report.objects.count(),
            "disputes": Dispute.objects.count(),
            "settlements": Settlement.objects.count(),
            "notifications": Notification.objects.count(),
        }

        serializer = AdminDashboardSerializer(data)

        return Response(
            {
                "message": "Admin dashboard data retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN USERS
# ============================================================

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        serializer = AdminUserSerializer(users, many=True)

        return Response(
            {
                "message": "User records retrieved successfully.",
                "count": users.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"message": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminUserSerializer(user)

        return Response(
            {
                "message": "User details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN VERIFICATION
# ============================================================

class AdminVerificationListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = (
            User.objects
            .filter(role__in=["customer", "truck_owner"])
            .order_by("verification_status", "-date_joined")
        )

        serializer = AdminVerificationSerializer(users, many=True)

        return Response(
            {
                "message": "Verification records retrieved successfully.",
                "count": users.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminVerificationUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(
                id=user_id,
                role__in=["customer", "truck_owner"],
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Customer or truck owner not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminVerificationSerializer(
            user,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "message": "Verification status updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN FLEET
# ============================================================

class AdminFleetListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        trucks = (
            Truck.objects
            .select_related("owner")
            .prefetch_related("documents__verified_by")
            .all()
            .order_by("-created_at")
        )

        serializer = AdminTruckSerializer(trucks, many=True)

        return Response(
            {
                "message": "Fleet records retrieved successfully.",
                "count": trucks.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminFleetDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, truck_id):
        try:
            truck = (
                Truck.objects
                .select_related("owner")
                .prefetch_related("documents__verified_by")
                .get(id=truck_id)
            )
        except Truck.DoesNotExist:
            return Response(
                {"message": "Truck not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminTruckSerializer(truck)

        return Response(
            {
                "message": "Truck details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN LOADS
# ============================================================

class AdminLoadListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        loads = (
            Load.objects
            .select_related("customer")
            .all()
            .order_by("-created_at")
        )

        serializer = AdminLoadSerializer(loads, many=True)

        return Response(
            {
                "message": "Load records retrieved successfully.",
                "count": loads.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminLoadDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, load_id):
        try:
            load = (
                Load.objects
                .select_related("customer")
                .get(id=load_id)
            )
        except Load.DoesNotExist:
            return Response(
                {"message": "Load not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminLoadSerializer(load)

        return Response(
            {
                "message": "Load details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN OFFERS
# ============================================================

class AdminOfferListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        offers = (
            Offer.objects
            .select_related(
                "load",
                "load__customer",
                "owner",
                "truck",
            )
            .all()
            .order_by("-created_at")
        )

        serializer = AdminOfferSerializer(offers, many=True)

        return Response(
            {
                "message": "Offer records retrieved successfully.",
                "count": offers.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminOfferDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, offer_id):
        try:
            offer = (
                Offer.objects
                .select_related(
                    "load",
                    "load__customer",
                    "owner",
                    "truck",
                )
                .get(id=offer_id)
            )
        except Offer.DoesNotExist:
            return Response(
                {"message": "Offer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminOfferSerializer(offer)

        return Response(
            {
                "message": "Offer details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN BOOKINGS
# ============================================================

class AdminBookingListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        bookings = (
            Booking.objects
            .select_related(
                "customer",
                "owner",
                "load",
                "offer",
                "truck",
            )
            .all()
            .order_by("-confirmed_at")
        )

        serializer = AdminBookingSerializer(bookings, many=True)

        return Response(
            {
                "message": "Booking records retrieved successfully.",
                "count": bookings.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminBookingDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, booking_id):
        try:
            booking = (
                Booking.objects
                .select_related(
                    "customer",
                    "owner",
                    "load",
                    "offer",
                    "truck",
                )
                .get(id=booking_id)
            )
        except Booking.DoesNotExist:
            return Response(
                {"message": "Booking not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminBookingSerializer(booking)

        return Response(
            {
                "message": "Booking details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN TRIPS
# ============================================================

class AdminTripListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        trips = (
            Trip.objects
            .select_related(
                "booking",
                "load",
                "load__customer",
                "truck",
                "truck__owner",
                "driver",
            )
            .prefetch_related(
                "location_updates",
                "location_updates__updated_by",
            )
            .all()
            .order_by("-created_at")
        )

        serializer = AdminTripSerializer(
            trips,
            many=True,
        )

        return Response(
            {
                "message": "Trip records retrieved successfully.",
                "count": trips.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminTripDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, trip_id):
        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "load",
                    "load__customer",
                    "truck",
                    "truck__owner",
                    "driver",
                )
                .prefetch_related(
                    "location_updates",
                    "location_updates__updated_by",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response(
                {"message": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminTripSerializer(trip)

        return Response(
            {
                "message": "Trip details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN PAYMENTS
# ============================================================

class AdminPaymentListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        payments = (
            Payment.objects
            .select_related(
                "trip",
                "trip__booking",
                "trip__load",
                "trip__truck",
            )
            .prefetch_related(
                "transactions",
                "transactions__created_by",
            )
            .all()
            .order_by("-created_at")
        )

        serializer = AdminPaymentSerializer(
            payments,
            many=True,
        )

        return Response(
            {
                "message": "Payment records retrieved successfully.",
                "count": payments.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminPaymentDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, payment_id):
        try:
            payment = (
                Payment.objects
                .select_related(
                    "trip",
                    "trip__booking",
                    "trip__load",
                    "trip__truck",
                )
                .prefetch_related(
                    "transactions",
                    "transactions__created_by",
                )
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            return Response(
                {"message": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminPaymentSerializer(payment)

        return Response(
            {
                "message": "Payment details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN REPORTS
# ============================================================

class AdminReportListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        reports = (
            Report.objects
            .select_related(
                "trip",
                "load",
                "reported_by",
                "reported_against",
            )
            .all()
            .order_by("-created_at")
        )

        serializer = AdminReportSerializer(
            reports,
            many=True,
        )

        return Response(
            {
                "message": "Report records retrieved successfully.",
                "count": reports.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminReportDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, report_id):
        try:
            report = (
                Report.objects
                .select_related(
                    "trip",
                    "load",
                    "reported_by",
                    "reported_against",
                )
                .get(id=report_id)
            )
        except Report.DoesNotExist:
            return Response(
                {"message": "Report not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminReportSerializer(report)

        return Response(
            {
                "message": "Report details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, report_id):
        try:
            report = Report.objects.select_related("reported_by", "reported_against", "trip").get(id=report_id)
        except Report.DoesNotExist:
            return Response(
                {"message": "Report not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")
        admin_notes = request.data.get("admin_notes")

        update_fields = ["updated_at"]
        if new_status:
            report.status = new_status
            update_fields.append("status")

        report.save(update_fields=update_fields)

        if new_status in ["closed", "resolved", "rejected", "under_review"] and report.reported_by:
            status_title = "Incident Report Closed" if new_status in ["closed", "resolved"] else "Incident Report Update"
            create_notification(
                recipient=report.reported_by,
                notification_type="report_status_updated",
                title=status_title,
                message=f"Your incident report {report.report_id} has been marked as {new_status.upper()} by platform administrators.{' Reason: ' + admin_notes if admin_notes else ''}",
                trip=report.trip,
            )

        serializer = AdminReportSerializer(report)
        return Response(
            {
                "message": f"Report status updated to {report.status} successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminReportEscalateDisputeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @transaction.atomic
    def post(self, request, report_id):
        try:
            report = (
                Report.objects
                .select_related("trip", "load", "reported_by", "reported_against")
                .get(id=report_id)
            )
        except Report.DoesNotExist:
            return Response(
                {"message": "Report not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if hasattr(report, "dispute") and report.dispute:
            return Response(
                {
                    "message": "A formal dispute already exists for this report.",
                    "data": AdminDisputeSerializer(report.dispute).data,
                },
                status=status.HTTP_200_OK,
            )

        admin_notes = request.data.get(
            "admin_notes",
            "Escalated from incident report to formal dispute by platform administrator for arbitration."
        )
        reason = request.data.get(
            "reason",
            f"Administrative escalation of {report.get_report_type_display()}: {report.description}"
        )
        evidence = request.data.get("evidence", "")

        dispute = Dispute.objects.create(
            report=report,
            trip=report.trip,
            created_by=request.user,
            reason=reason,
            evidence=evidence,
            admin_notes=admin_notes,
            status="under_review",
        )

        report.status = "under_review"
        report.save(update_fields=["status", "updated_at"])

        # Notify reported_by and reported_against
        if report.reported_by:
            create_notification(
                recipient=report.reported_by,
                notification_type="dispute_created",
                title="Report Escalated to Formal Dispute",
                message=(
                    f"Your incident report {report.report_id} has been escalated "
                    f"to formal arbitration dispute #{dispute.dispute_id} by platform administrators."
                ),
                trip=report.trip,
            )

        if report.reported_against:
            create_notification(
                recipient=report.reported_against,
                notification_type="dispute_created",
                title="Formal Dispute Opened",
                message=(
                    f"Incident report {report.report_id} has been escalated "
                    f"to formal arbitration dispute #{dispute.dispute_id}. Please review and submit your counter-evidence."
                ),
                trip=report.trip,
            )

        return Response(
            {
                "message": "Report successfully escalated to formal arbitration dispute.",
                "dispute": AdminDisputeSerializer(dispute).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN DISPUTES
# ============================================================

class AdminDisputeListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        disputes = (
            Dispute.objects
            .select_related(
                "report",
                "report__reported_by",
                "report__reported_against",
                "trip",
                "created_by",
            )
            .all()
            .order_by("-created_at")
        )

        serializer = AdminDisputeSerializer(
            disputes,
            many=True,
        )

        return Response(
            {
                "message": "Dispute records retrieved successfully.",
                "count": disputes.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminDisputeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, dispute_id):
        try:
            dispute = (
                Dispute.objects
                .select_related(
                    "report",
                    "report__reported_by",
                    "report__reported_against",
                    "trip",
                    "created_by",
                )
                .get(id=dispute_id)
            )
        except Dispute.DoesNotExist:
            return Response(
                {"message": "Dispute not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminDisputeSerializer(dispute)

        return Response(
            {
                "message": "Dispute details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, dispute_id):
        try:
            dispute = Dispute.objects.select_related("report", "trip", "created_by").get(id=dispute_id)
        except Dispute.DoesNotExist:
            return Response(
                {"message": "Dispute not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")
        resolution = request.data.get("resolution")
        admin_notes = request.data.get("admin_notes")

        update_fields = ["updated_at"]
        if new_status:
            dispute.status = new_status
            update_fields.append("status")
        if resolution is not None:
            dispute.resolution = resolution
            update_fields.append("resolution")
        if admin_notes is not None:
            dispute.admin_notes = admin_notes
            update_fields.append("admin_notes")

        dispute.save(update_fields=update_fields)

        # If dispute is resolved or closed/rejected, update linked report
        if dispute.report and new_status in ["resolved", "closed", "rejected"]:
            dispute.report.status = "resolved" if new_status == "resolved" else "closed"
            dispute.report.save(update_fields=["status", "updated_at"])

        # Notify participants
        trip_ref = getattr(dispute.trip, "trip_id", str(dispute.trip_id)) if dispute.trip else "General"
        notify_users = set()
        if dispute.created_by:
            notify_users.add(dispute.created_by)
        if dispute.report:
            if dispute.report.reported_by:
                notify_users.add(dispute.report.reported_by)
            if dispute.report.reported_against:
                notify_users.add(dispute.report.reported_against)
        if dispute.trip and getattr(dispute.trip, "booking", None):
            if dispute.trip.booking.customer:
                notify_users.add(dispute.trip.booking.customer)
            if dispute.trip.booking.owner:
                notify_users.add(dispute.trip.booking.owner)

        for u in notify_users:
            create_notification(
                recipient=u,
                notification_type="dispute_resolved" if new_status in ["resolved", "closed"] else "dispute_updated",
                title=f"Dispute #{dispute.dispute_id} Hearing Decision",
                message=f"Dispute status is now {dispute.status.upper()}. Finding: {dispute.resolution or dispute.admin_notes or 'Case closed.'}",
                trip=dispute.trip,
            )

        serializer = AdminDisputeSerializer(dispute)
        return Response(
            {
                "message": "Dispute updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminDisputeCreateSettlementView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @transaction.atomic
    def post(self, request, dispute_id):
        try:
            dispute = (
                Dispute.objects
                .select_related(
                    "trip",
                    "report",
                    "created_by",
                    "trip__booking",
                    "trip__booking__customer",
                    "trip__booking__owner",
                )
                .get(id=dispute_id)
            )
        except Dispute.DoesNotExist:
            return Response(
                {"message": "Dispute not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        trip = dispute.trip or (dispute.report.trip if dispute.report else None)
        if not trip:
            return Response(
                {"message": "Dispute must have a linked trip to create a financial settlement."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payer_id = request.data.get("payer_id")
        receiver_id = request.data.get("receiver_id")
        settlement_type = request.data.get("settlement_type", "damage_compensation")
        original_amount = request.data.get("original_amount")
        amount_already_paid = request.data.get("amount_already_paid", 0)
        adjustment_amount = request.data.get("adjustment_amount", 0)
        reason = request.data.get("reason", f"Settlement determined for dispute #{dispute.dispute_id}")
        evidence = request.data.get("evidence", dispute.evidence or "")
        admin_notes = request.data.get("admin_notes", "")
        settlement_status = request.data.get("status", "settled")

        if original_amount is None:
            booking = getattr(trip, "booking", None)
            original_amount = (
                getattr(booking, "final_price", None)
                or getattr(booking, "agreed_price", None)
                or getattr(getattr(booking, "offer", None), "offered_price", None)
                or Decimal("0.00")
            )

        payer = User.objects.filter(id=payer_id).first() if payer_id else None
        receiver = User.objects.filter(id=receiver_id).first() if receiver_id else None

        settlement = Settlement.objects.create(
            trip=trip,
            report=dispute.report,
            dispute=dispute,
            original_amount=original_amount,
            amount_already_paid=amount_already_paid,
            adjustment_amount=adjustment_amount,
            payer=payer,
            receiver=receiver,
            settlement_type=settlement_type,
            reason=reason,
            evidence=evidence,
            admin_notes=admin_notes,
            status=settlement_status,
            resolved_by=request.user,
        )

        # Update dispute
        dispute.status = "resolved"
        dispute.resolution = (
            f"Arbitration resolved with Settlement #{settlement.settlement_id} "
            f"({settlement.get_settlement_type_display()}: Final Amount ₹{settlement.final_settlement_amount})."
        )
        if admin_notes:
            dispute.admin_notes = admin_notes
        dispute.save(update_fields=["status", "resolution", "admin_notes", "updated_at"])

        # Update report if linked
        if dispute.report:
            dispute.report.status = "resolved"
            dispute.report.save(update_fields=["status", "updated_at"])

        # Notify payer and receiver
        if payer:
            create_notification(
                recipient=payer,
                notification_type="settlement_completed",
                title="Financial Settlement Determined",
                message=(
                    f"Settlement #{settlement.settlement_id} was generated for Dispute #{dispute.dispute_id} "
                    f"(Trip #{trip.trip_id}). Payout / Adjustment: ₹{settlement.final_settlement_amount}."
                ),
                trip=trip,
            )
        if receiver:
            create_notification(
                recipient=receiver,
                notification_type="settlement_completed",
                title="Financial Settlement Determined",
                message=(
                    f"Settlement #{settlement.settlement_id} was generated for Dispute #{dispute.dispute_id} "
                    f"(Trip #{trip.trip_id}). Payout / Adjustment: ₹{settlement.final_settlement_amount}."
                ),
                trip=trip,
            )

        return Response(
            {
                "message": "Financial settlement created and dispute resolved successfully.",
                "settlement": AdminSettlementSerializer(settlement).data,
                "dispute": AdminDisputeSerializer(dispute).data,
            },
            status=status.HTTP_201_CREATED,
        )
      
class AdminNotificationListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        notifications = (
            Notification.objects
            .select_related("recipient")
            .all()
            .order_by("-created_at")
        )

        serializer = AdminNotificationSerializer(
            notifications,
            many=True,
        )

        return Response(
            {
                "message": "Notification records retrieved successfully.",
                "count": notifications.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminNotificationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, notification_id):
        try:
            notification = (
                Notification.objects
                .select_related("recipient")
                .get(id=notification_id)
            )
        except Notification.DoesNotExist:
            return Response(
                {"message": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminNotificationSerializer(notification)

        return Response(
            {
                "message": "Notification details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )  
class AdminSettlementListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        settlements = (
            Settlement.objects
            .select_related(
                "trip",
                "report",
                "dispute",
                "payer",
                "receiver",
                "resolved_by",
            )
            .all()
            .order_by("-created_date")
        )

        serializer = AdminSettlementSerializer(
            settlements,
            many=True,
        )

        return Response(
            {
                "message": "Settlement records retrieved successfully.",
                "count": settlements.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminSettlementDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, settlement_id):
        try:
            settlement = (
                Settlement.objects
                .select_related(
                    "trip",
                    "report",
                    "dispute",
                    "payer",
                    "receiver",
                    "resolved_by",
                )
                .get(id=settlement_id)
            )
        except Settlement.DoesNotExist:
            return Response(
                {"message": "Settlement not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdminSettlementSerializer(settlement)

        return Response(
            {
                "message": "Settlement details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, settlement_id):
        try:
            settlement = Settlement.objects.select_related("trip", "payer", "receiver").get(id=settlement_id)
        except Settlement.DoesNotExist:
            return Response(
                {"message": "Settlement not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")
        admin_notes = request.data.get("admin_notes")
        adjustment_amount = request.data.get("adjustment_amount")

        if new_status:
            settlement.status = new_status
            if new_status in ["settled", "accepted", "rejected"]:
                from django.utils import timezone
                settlement.resolved_date = timezone.now()
                settlement.resolved_by = request.user
        if admin_notes is not None:
            settlement.admin_notes = admin_notes
        if adjustment_amount is not None:
            settlement.adjustment_amount = adjustment_amount

        settlement.save()

        if new_status in ["settled", "accepted"]:
            trip_ref = getattr(settlement.trip, "trip_id", str(settlement.trip_id))
            if settlement.payer:
                create_notification(
                    recipient=settlement.payer,
                    notification_type="settlement_completed",
                    title="Settlement Finalized",
                    message=f"Settlement {settlement.settlement_id} for trip #{trip_ref} has been marked as {new_status}."
                )
            if settlement.receiver:
                create_notification(
                    recipient=settlement.receiver,
                    notification_type="settlement_completed",
                    title="Settlement Finalized",
                    message=f"Settlement {settlement.settlement_id} for trip #{trip_ref} has been marked as {new_status}."
                )

        serializer = AdminSettlementSerializer(settlement)
        return Response(
            {
                "message": "Settlement updated successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )