from django.urls import path

from .views import (
    AdminDashboardView,
    AdminUserListView,
    AdminUserDetailView,
    AdminVerificationListView,
    AdminVerificationUpdateView,
    AdminFleetListView,
    AdminFleetDetailView,
    AdminLoadListView,
    AdminLoadDetailView,
    AdminOfferListView,
    AdminOfferDetailView,
    AdminBookingListView,
    AdminBookingDetailView,
    AdminTripListView,
    AdminTripDetailView,
    AdminPaymentListView,
    AdminPaymentDetailView,
    AdminReportListView,
    AdminReportDetailView,
    AdminReportEscalateDisputeView,
    AdminDisputeListView,
    AdminDisputeDetailView,
    AdminDisputeCreateSettlementView,
    AdminNotificationListView,
    AdminNotificationDetailView,
    AdminSettlementListView,
    AdminSettlementDetailView,
)

from .notification_views import AdminSendNotificationView
from .driver_verification import (
    AdminDriverListView,
    AdminDriverVerificationUpdateView,
)


urlpatterns = [
    path(
        "dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),

    path(
        "drivers/",
        AdminDriverListView.as_view(),
        name="admin-driver-list",
    ),

    path(
        "drivers/<int:driver_id>/verification/",
        AdminDriverVerificationUpdateView.as_view(),
        name="admin-driver-verification-update",
    ),

    path(
        "users/",
        AdminUserListView.as_view(),
        name="admin-users",
    ),

    path(
        "users/<int:user_id>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),

    path(
        "verification/",
        AdminVerificationListView.as_view(),
        name="admin-verification-list",
    ),

    path(
        "verification/<int:user_id>/",
        AdminVerificationUpdateView.as_view(),
        name="admin-verification-update",
    ),

    path(
        "fleet/",
        AdminFleetListView.as_view(),
        name="admin-fleet-list",
    ),

    path(
        "fleet/<int:truck_id>/",
        AdminFleetDetailView.as_view(),
        name="admin-fleet-detail",
    ),

    path(
        "loads/",
        AdminLoadListView.as_view(),
        name="admin-load-list",
    ),

    path(
        "loads/<int:load_id>/",
        AdminLoadDetailView.as_view(),
        name="admin-load-detail",
    ),

    path(
        "offers/",
        AdminOfferListView.as_view(),
        name="admin-offer-list",
    ),

    path(
        "offers/<int:offer_id>/",
        AdminOfferDetailView.as_view(),
        name="admin-offer-detail",
    ),

    path(
        "bookings/",
        AdminBookingListView.as_view(),
        name="admin-booking-list",
    ),

    path(
        "bookings/<int:booking_id>/",
        AdminBookingDetailView.as_view(),
        name="admin-booking-detail",
    ),

    path(
        "trips/",
        AdminTripListView.as_view(),
        name="admin-trip-list",
    ),

    path(
        "trips/<int:trip_id>/",
        AdminTripDetailView.as_view(),
        name="admin-trip-detail",
    ),

    path(
        "payments/",
        AdminPaymentListView.as_view(),
        name="admin-payment-list",
    ),

    path(
        "payments/<int:payment_id>/",
        AdminPaymentDetailView.as_view(),
        name="admin-payment-detail",
    ),

    path(
        "reports/",
        AdminReportListView.as_view(),
        name="admin-report-list",
    ),

    path(
        "reports/<int:report_id>/",
        AdminReportDetailView.as_view(),
        name="admin-report-detail",
    ),

    path(
        "reports/<int:report_id>/escalate-dispute/",
        AdminReportEscalateDisputeView.as_view(),
        name="admin-report-escalate-dispute",
    ),

    path(
        "disputes/",
        AdminDisputeListView.as_view(),
        name="admin-dispute-list",
    ),

    path(
        "disputes/<int:dispute_id>/",
        AdminDisputeDetailView.as_view(),
        name="admin-dispute-detail",
    ),

    path(
        "disputes/<int:dispute_id>/create-settlement/",
        AdminDisputeCreateSettlementView.as_view(),
        name="admin-dispute-create-settlement",
    ),

    path(
        "notifications/",
        AdminNotificationListView.as_view(),
        name="admin-notification-list",
    ),

    path(
        "notifications/<int:notification_id>/",
        AdminNotificationDetailView.as_view(),
        name="admin-notification-detail",
    ),

    path(
        "notifications/send/",
        AdminSendNotificationView.as_view(),
        name="admin-send-notification",
    ),

    path(
        "settlements/",
        AdminSettlementListView.as_view(),
        name="admin-settlement-list",
    ),

    path(
        "settlements/<int:settlement_id>/",
        AdminSettlementDetailView.as_view(),
        name="admin-settlement-detail",
    ),
]