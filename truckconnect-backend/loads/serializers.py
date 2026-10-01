from rest_framework import serializers

from .models import Load


class LoadSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.full_name",
        read_only=True,
    )

    customer_email = serializers.EmailField(
        source="customer.email",
        read_only=True,
    )

    class Meta:
        model = Load
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "goods_type",
            "weight_kg",
            "pickup_location",
            "destination",
            "pickup_date",
            "pickup_time",
            "special_requirements",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_weight_kg(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Weight must be greater than 0 KG."
            )

        return value

    def validate(self, attrs):
        pickup_date = attrs.get("pickup_date")
        pickup_time = attrs.get("pickup_time")

        if pickup_date is None:
            raise serializers.ValidationError(
                {
                    "pickup_date": "Pickup date is required."
                }
            )

        if pickup_time is None:
            raise serializers.ValidationError(
                {
                    "pickup_time": "Pickup time is required."
                }
            )

        return attrs