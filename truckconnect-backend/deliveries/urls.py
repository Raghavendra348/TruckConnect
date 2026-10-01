from django.urls import path
from .views import (
    DeliveryProofListCreateView,
    DeliveryProofDetailView,
)


urlpatterns = [
    path(
        "",
        DeliveryProofListCreateView.as_view(),
        name="delivery-proof-list-create",
    ),
    path(
        "<int:pk>/",
        DeliveryProofDetailView.as_view(),
        name="delivery-proof-detail",
    ),
]