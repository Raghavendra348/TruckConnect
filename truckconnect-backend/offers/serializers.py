from rest_framework import serializers

from .models import Offer


class OfferSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.full_name",
        read_only=True,
    )

    owner_company = serializers.CharField(
        source="owner.company_name",
        read_only=True,
    )

    owner_mobile = serializers.CharField(
        source="owner.mobile_number",
        read_only=True,
    )

    truck_registration_number = serializers.CharField(
        source="truck.registration_number",
        read_only=True,
    )

    truck_type = serializers.CharField(
        source="truck.truck_type",
        read_only=True,
    )

    truck_capacity_kg = serializers.DecimalField(
        source="truck.capacity_kg",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Offer

        fields = [
            "id",
            "load",
            "owner",
            "owner_name",
            "owner_company",
            "owner_mobile",
            "truck",
            "truck_registration_number",
            "truck_type",
            "truck_capacity_kg",
            "offered_price",
            "owner_message",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "owner_name",
            "owner_company",
            "truck_registration_number",
            "truck_type",
            "truck_capacity_kg",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]

    def validate_offered_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Offer price must be greater than zero."
            )

        return value