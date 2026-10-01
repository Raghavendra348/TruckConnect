from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/trucks/", include("trucks.urls")),
    path("api/drivers/", include("drivers.urls")),
    path("api/loads/", include("loads.urls")),
    path("api/offers/", include("offers.urls")),
    path("api/bookings/", include("bookings.urls")),
    path("api/trips/", include("trips.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/expenses/", include("expenses.urls")),
    path("api/deliveries/", include("deliveries.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/disputes/", include("disputes.urls")),
    path("api/settlements/", include("settlements.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/conversations/", include("conversations.urls")),
    path("api/admin/", include("admin_panel.urls")),
]