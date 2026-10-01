from rest_framework import generics, permissions

from .models import DeliveryProof
from .serializers import DeliveryProofSerializer


class DeliveryProofListCreateView(generics.ListCreateAPIView):
    serializer_class = DeliveryProofSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return DeliveryProof.objects.filter(
            trip__booking__owner=user
        ).select_related(
            "trip",
            "trip__booking",
            "uploaded_by",
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user
        )


class DeliveryProofDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DeliveryProofSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return DeliveryProof.objects.filter(
            trip__booking__owner=user
        ).select_related(
            "trip",
            "trip__booking",
            "uploaded_by",
        )