from django.urls import path

from .views import LoadDetailView, LoadListCreateView


urlpatterns = [
    path(
        "",
        LoadListCreateView.as_view(),
        name="load-list-create",
    ),
    path(
        "<int:pk>/",
        LoadDetailView.as_view(),
        name="load-detail",
    ),
]