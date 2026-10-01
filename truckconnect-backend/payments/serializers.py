from rest_framework import serializers

from .models import Payment, PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    trip_id = serializers.CharField(
        source="payment.trip.trip_id",
        read_only=True,
    )

    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "payment",
            "trip_id",
            "amount",
            "payment_type",
            "payment_reference",
            "payment_date",
            "status",
            "proof",
            "created_by",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "trip_id",
            "payment",
            "payment_date",
            "created_by",
            "created_at",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    trip_id = serializers.CharField(
        source="trip.trip_id",
        read_only=True,
    )

    transactions = PaymentTransactionSerializer(
        many=True,
        read_only=True,
    )

    settlement_details = serializers.SerializerMethodField()

    class Meta:
        model = Payment

        fields = [
            "id",
            "trip",
            "trip_id",
            "agreed_amount",
            "due_date",
            "total_paid",
            "remaining_amount",
            "payment_status",
            "transactions",
            "settlement_details",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "trip_id",
            "total_paid",
            "remaining_amount",
            "payment_status",
            "transactions",
            "settlement_details",
            "created_at",
            "updated_at",
        ]

    def get_settlement_details(self, obj):
        if not obj.trip:
            return None
        st = obj.trip.settlements.exclude(status__in=["cancelled", "rejected"]).order_by("-created_date").first()
        if st:
            return {
                "id": st.id,
                "settlement_id": st.settlement_id,
                "settlement_type": st.settlement_type,
                "settlement_type_display": st.get_settlement_type_display(),
                "original_amount": st.original_amount,
                "adjustment_amount": st.adjustment_amount,
                "final_settlement_amount": st.final_settlement_amount,
                "status": st.status,
            }
        return None