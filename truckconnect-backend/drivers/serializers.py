from rest_framework import serializers

from .models import Driver


class DriverSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.full_name",
        read_only=True,
    )

    owner_email = serializers.EmailField(
        source="owner.email",
        read_only=True,
    )

    verification_status_display = serializers.CharField(
        source="get_verification_status_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Driver
        fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "full_name",
            "photo",
            "mobile_number",
            "driving_licence",
            "licence_number",
            "licence_expiry",
            "experience_years",
            "address",
            "emergency_contact",
            "verification_status",
            "verification_status_display",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "verification_status",
            "verification_status_display",
            "status_display",
            "created_at",
            "updated_at",
        ]

    def validate_experience_years(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Experience cannot be negative."
            )
        return value

    def validate_licence_number(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Licence number is required."
            )

        return value

    def validate_photo(self, value):
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Photo size cannot exceed 5 MB."
            )

        return value

    def validate_driving_licence(self, value):
        max_size = 5 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "Driving licence file cannot exceed 5 MB."
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
                "Driving licence must be PDF, JPG, JPEG or PNG."
            )

        return value