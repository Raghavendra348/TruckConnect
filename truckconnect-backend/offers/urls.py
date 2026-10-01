from django.urls import path

from .views import (
    AcceptOfferView,
    CustomerOfferDetailView,
    CustomerOfferListView,
    OwnerOfferDetailView,
    OwnerOfferListCreateView,
    RejectOfferView,
)


urlpatterns = [
    path(
        "",
        OwnerOfferListCreateView.as_view(),
        name="owner-offer-list-create",
    ),
    path(
        "<int:pk>/",
        OwnerOfferDetailView.as_view(),
        name="owner-offer-detail",
    ),
    path(
        "received/",
        CustomerOfferListView.as_view(),
        name="customer-offer-list",
    ),
    path(
        "received/<int:pk>/",
        CustomerOfferDetailView.as_view(),
        name="customer-offer-detail",
    ),
    path(
        "received/<int:pk>/accept/",
        AcceptOfferView.as_view(),
        name="accept-offer",
    ),
    path(
        "received/<int:pk>/reject/",
        RejectOfferView.as_view(),
        name="reject-offer",
    ),
]