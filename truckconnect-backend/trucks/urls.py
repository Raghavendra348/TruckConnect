from django.urls import path

from .views import (
    TruckDetailView,
    TruckDocumentDetailView,
    TruckDocumentListCreateView,
    TruckListCreateView,
)


urlpatterns = [
    path(
        "",
        TruckListCreateView.as_view(),
        name="truck-list-create",
    ),
    path(
        "<int:pk>/",
        TruckDetailView.as_view(),
        name="truck-detail",
    ),
    path(
        "documents/",
        TruckDocumentListCreateView.as_view(),
        name="truck-document-list-create",
    ),
    path(
        "documents/<int:pk>/",
        TruckDocumentDetailView.as_view(),
        name="truck-document-detail",
    ),
]