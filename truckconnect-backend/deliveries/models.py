from django.db import models
from django.conf import settings


class DeliveryProof(models.Model):
    PROOF_TYPES = [
        ("delivery_receipt", "Delivery Receipt / POD"),
        ("customer_signature", "Customer Signature"),
        ("photo", "Photo"),
        ("document", "Document"),
    ]

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="delivery_proofs",
    )

    proof_type = models.CharField(
        max_length=30,
        choices=PROOF_TYPES,
    )

    file = models.FileField(
        upload_to="delivery_proofs/",
    )

    notes = models.TextField(
        blank=True,
        null=True,
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_delivery_proofs",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.trip.trip_id} - {self.proof_type}"