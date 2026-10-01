from rest_framework import serializers

from .models import Truck, TruckDocument


class TruckSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.full_name",
        read_only=True,
    )

    owner_email = serializers.EmailField(
        source="owner.email",
        read_only=True,
    )

    class Meta:
        model = Truck
        fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "registration_number",
            "truck_type",
            "capacity_kg",
            "manufacturer",
            "model",
            "year",
            "fuel_type",
            "truck_photo",
            "base_location",
            "current_location",
            "current_location_updated_at",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "current_location_updated_at",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_capacity_kg(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Truck capacity must be greater than 0 KG."
            )

        return value

    def validate_year(self, value):
        if value < 1950:
            raise serializers.ValidationError(
                "Please enter a valid truck manufacturing year."
            )

        return value

    def validate_registration_number(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Registration number is required."
            )

        return value


class TruckDocumentSerializer(serializers.ModelSerializer):
    truck_registration_number = serializers.CharField(
        source="truck.registration_number",
        read_only=True,
    )

    verification_status_display = serializers.CharField(
        source="get_verification_status_display",
        read_only=True,
    )

    document_type_display = serializers.CharField(
        source="get_document_type_display",
        read_only=True,
    )

    verified_by_name = serializers.CharField(
        source="verified_by.full_name",
        read_only=True,
    )

    class Meta:
        model = TruckDocument
        fields = [
            "id",
            "truck",
            "truck_registration_number",
            "document_type",
            "document_type_display",
            "document_number",
            "file",
            "expiry_date",
            "verification_status",
            "verification_status_display",
            "verified_by",
            "verified_by_name",
            "verified_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "truck_registration_number",
            "document_type_display",
            "verification_status",
            "verification_status_display",
            "verified_by",
            "verified_by_name",
            "verified_at",
            "created_at",
            "updated_at",
        ]

    def validate_file(self, value):
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size cannot exceed 5 MB."
            )

        allowed_extensions = [
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
        ]

        file_name = value.name.lower()

        if not any(
            file_name.endswith(extension)
            for extension in allowed_extensions
        ):
            raise serializers.ValidationError(
                "Only PDF, JPG, JPEG and PNG files are allowed."
            )

        return value