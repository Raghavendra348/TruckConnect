from django.urls import path

from .views import (
    AssignDriverView,
    CompleteTripView,
    DeliverTripView,
    ConfirmDeliveryView,
    StartTripView,
    TripListView,
    TripLocationUpdateListCreateView,
)


urlpatterns = [
    path(
        "trips/",
        TripListView.as_view(),
        name="trip-list",
    ),
    path(
        "trips/<int:trip_id>/assign-driver/",
        AssignDriverView.as_view(),
        name="assign-driver",
    ),
    path(
        "trips/<int:trip_id>/start/",
        StartTripView.as_view(),
        name="start-trip",
    ),
    path(
        "trips/<int:trip_id>/deliver/",
        DeliverTripView.as_view(),
        name="deliver-trip",
    ),
    path(
        "trips/<int:trip_id>/confirm-delivery/",
        ConfirmDeliveryView.as_view(),
        name="confirm-delivery",
    ),
    path(
        "trips/<int:trip_id>/complete/",
        CompleteTripView.as_view(),
        name="complete-trip",
    ),
    path(
        "trips/<int:trip_id>/location-updates/",
        TripLocationUpdateListCreateView.as_view(),
        name="trip-location-updates",
    ),
]