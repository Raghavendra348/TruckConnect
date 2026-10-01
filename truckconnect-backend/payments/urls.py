from django.urls import path

from .views import (
    PaymentDetailView,
    PaymentListCreateView,
    PaymentTransactionCreateView,
    PaymentTransactionListView,
)


urlpatterns = [
    path(
        "",
        PaymentListCreateView.as_view(),
        name="payment-list-create",
    ),
    path(
        "<int:payment_id>/",
        PaymentDetailView.as_view(),
        name="payment-detail",
    ),
    path(
        "<int:payment_id>/transactions/",
        PaymentTransactionListView.as_view(),
        name="payment-transactions",
    ),
    path(
        "<int:payment_id>/transactions/create/",
        PaymentTransactionCreateView.as_view(),
        name="payment-transaction-create",
    ),
]