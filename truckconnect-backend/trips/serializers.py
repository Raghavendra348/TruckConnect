from rest_framework import serializers

from .models import Trip, TripLocationUpdate


class TripSerializer(serializers.ModelSerializer):
    trip_id = serializers.CharField(read_only=True)

    driver_name = serializers.CharField(
        source="driver.full_name",
        read_only=True,
    )

    driver_mobile_number = serializers.CharField(
        source="driver.mobile_number",
        read_only=True,
    )

    driver_license = serializers.CharField(
        source="driver.license_number",
        read_only=True,
    )

    driver_verification_status = serializers.CharField(
        source="driver.verification_status",
        read_only=True,
    )

    driver_status = serializers.CharField(
        source="driver.status",
        read_only=True,
    )

    driver_photo = serializers.ImageField(
        source="driver.photo",
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

    owner_name = serializers.CharField(
        source="booking.owner.full_name",
        read_only=True,
    )

    owner_company = serializers.CharField(
        source="booking.owner.company_name",
        read_only=True,
    )

    owner_mobile = serializers.CharField(
        source="booking.owner.mobile_number",
        read_only=True,
    )

    customer_name = serializers.CharField(
        source="booking.customer.full_name",
        read_only=True,
    )

    customer_company = serializers.CharField(
        source="booking.customer.company_name",
        read_only=True,
    )

    customer_mobile = serializers.CharField(
        source="booking.customer.mobile_number",
        read_only=True,
    )

    customer_email = serializers.CharField(
        source="booking.customer.email",
        read_only=True,
    )

    load_goods_type = serializers.CharField(
        source="load.goods_type",
        read_only=True,
    )

    load_weight_kg = serializers.DecimalField(
        source="load.weight_kg",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    load_pickup_date = serializers.DateField(
        source="load.pickup_date",
        read_only=True,
    )

    load_special_requirements = serializers.CharField(
        source="load.special_requirements",
        read_only=True,
    )

    agreed_price = serializers.DecimalField(
        source="booking.agreed_price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    delivery_proofs = serializers.SerializerMethodField()
    latest_delivery_proof = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "trip_id",
            "booking",
            "load",
            "load_goods_type",
            "load_weight_kg",
            "load_pickup_date",
            "load_special_requirements",
            "agreed_price",
            "truck",
            "truck_registration_number",
            "truck_type",
            "owner_name",
            "owner_company",
            "owner_mobile",
            "customer_name",
            "customer_company",
            "customer_mobile",
            "customer_email",
            "driver",
            "driver_name",
            "driver_mobile_number",
            "driver_license",
            "driver_verification_status",
            "driver_status",
            "driver_photo",
            "start_location",
            "pickup_location",
            "destination",
            "current_location",
            "current_status",
            "delivery_proofs",
            "latest_delivery_proof",
            "payment_status",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "trip_id",
            "driver_name",
            "driver_mobile_number",
            "driver_license",
            "driver_verification_status",
            "driver_status",
            "driver_photo",
            "customer_name",
            "customer_company",
            "customer_mobile",
            "customer_email",
            "load_goods_type",
            "load_weight_kg",
            "load_pickup_date",
            "load_special_requirements",
            "agreed_price",
            "delivery_proofs",
            "latest_delivery_proof",
            "payment_status",
            "created_at",
            "updated_at",
        ]

    def get_delivery_proofs(self, obj):
        if not hasattr(obj, "delivery_proofs"):
            return []
        return [
            {
                "id": dp.id,
                "proof_type": dp.proof_type,
                "notes": dp.notes,
                "file": dp.file.url if dp.file else None,
                "created_at": dp.created_at,
            }
            for dp in obj.delivery_proofs.all().order_by("-created_at")
        ]

    def get_latest_delivery_proof(self, obj):
        if hasattr(obj, "delivery_proofs"):
            latest = obj.delivery_proofs.all().order_by("-created_at").first()
            if latest:
                return {
                    "id": latest.id,
                    "proof_type": latest.proof_type,
                    "notes": latest.notes,
                    "file": latest.file.url if latest.file else None,
                    "created_at": latest.created_at,
                }
        return None

    def get_payment_status(self, obj):
        if hasattr(obj, "payment") and obj.payment:
            return obj.payment.payment_status
        return "unpaid"


class TripLocationUpdateSerializer(serializers.ModelSerializer):
    trip_id = serializers.CharField(
        source="trip.trip_id",
        read_only=True,
    )

    updated_by_name = serializers.CharField(
        source="updated_by.full_name",
        read_only=True,
    )

    class Meta:
        model = TripLocationUpdate

        fields = [
            "id",
            "trip",
            "trip_id",
            "status",
            "location",
            "note",
            "photo",
            "updated_by",
            "updated_by_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "trip",
            "trip_id",
            "updated_by",
            "updated_by_name",
            "created_at",
        ]