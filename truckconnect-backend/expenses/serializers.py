from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    trip_id = serializers.IntegerField(source="trip.id", read_only=True)
    trip_reference = serializers.CharField(
        source="trip.trip_id",
        read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "trip",
            "trip_id",
            "trip_reference",
            "expense_type",
            "amount",
            "description",
            "expense_date",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "trip_id",
            "trip_reference",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Expense amount must be greater than 0."
            )

        return value