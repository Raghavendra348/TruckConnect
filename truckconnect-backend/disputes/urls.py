from django.urls import path
from .views import (
    DisputeListCreateView,
    DisputeDetailView,
    DisputeSubmitEvidenceView,
)


urlpatterns = [
    path(
        "",
        DisputeListCreateView.as_view(),
        name="dispute-list-create",
    ),
    path(
        "<int:pk>/",
        DisputeDetailView.as_view(),
        name="dispute-detail",
    ),
    path(
        "<int:dispute_id>/respond/",
        DisputeSubmitEvidenceView.as_view(),
        name="dispute-respond",
    ),
]