from rest_framework import generics, permissions
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return Expense.objects.filter(
            trip__booking__owner=user
        ).select_related(
            "trip",
            "trip__booking",
        ).order_by("-expense_date", "-id")

    def perform_create(self, serializer):
        serializer.save()


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return Expense.objects.filter(
            trip__booking__owner=user
        ).select_related(
            "trip",
            "trip__booking",
        )