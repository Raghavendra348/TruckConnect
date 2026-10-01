from django.urls import path
from . import views


urlpatterns = [
    path("", views.ExpenseListCreateView.as_view(), name="expense-list-create"),
    path("<int:pk>/", views.ExpenseDetailView.as_view(), name="expense-detail"),
]