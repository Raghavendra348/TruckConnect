from rest_framework import serializers
from .models import DeliveryProof


class DeliveryProofSerializer(serializers.ModelSerializer):
    trip_id = serializers.IntegerField(
        source="trip.id",
        read_only=True,
    )

    trip_reference = serializers.CharField(
        source="trip.trip_id",
        read_only=True,
    )

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name",
        read_only=True,
    )

    class Meta:
        model = DeliveryProof
        fields = [
            "id",
            "trip",
            "trip_id",
            "trip_reference",
            "proof_type",
            "file",
            "notes",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "trip_id",
            "trip_reference",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size cannot exceed 10 MB."
            )

        allowed_extensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf",
        ]

        file_name = value.name.lower()

        if not any(
            file_name.endswith(extension)
            for extension in allowed_extensions
        ):
            raise serializers.ValidationError(
                "Only JPG, JPEG, PNG and PDF files are allowed."
            )

        return value