from django.urls import path

from .views import (
    DriverDetailView,
    DriverListCreateView,
)


urlpatterns = [
    path(
        "",
        DriverListCreateView.as_view(),
        name="driver-list-create",
    ),
    path(
        "<int:pk>/",
        DriverDetailView.as_view(),
        name="driver-detail",
    ),
]