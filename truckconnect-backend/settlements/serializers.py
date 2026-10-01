from rest_framework import serializers

from .models import Settlement


class SettlementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Settlement

        fields = [
            "id",
            "settlement_id",
            "trip",
            "report",
            "dispute",
            "original_amount",
            "amount_already_paid",
            "adjustment_amount",
            "final_settlement_amount",
            "payer",
            "receiver",
            "settlement_type",
            "reason",
            "evidence",
            "admin_notes",
            "status",
            "created_date",
            "resolved_date",
            "resolved_by",
        ]

        read_only_fields = [
            "id",
            "settlement_id",
            "final_settlement_amount",
            "created_date",
            "resolved_date",
            "resolved_by",
        ]