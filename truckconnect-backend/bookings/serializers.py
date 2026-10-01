from rest_framework import serializers

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.full_name",
        read_only=True,
    )

    owner_name = serializers.CharField(
        source="owner.full_name",
        read_only=True,
    )

    truck_registration_number = serializers.CharField(
        source="truck.registration_number",
        read_only=True,
    )

    class Meta:
        model = Booking

        fields = [
            "id",
            "customer",
            "customer_name",
            "owner",
            "owner_name",
            "load",
            "offer",
            "truck",
            "truck_registration_number",
            "final_price",
            "status",
            "confirmed_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "owner",
            "owner_name",
            "truck_registration_number",
            "final_price",
            "status",
            "confirmed_at",
        ]