from rest_framework import serializers
from trips.models import Trip
from .models import Report


REPORT_TYPE_MAPPINGS = {
    "delay": "delivery_delay",
    "delivery_delay": "delivery_delay",
    "cargo_damage": "cargo_damaged",
    "cargo_damaged": "cargo_damaged",
    "cargo_missing": "cargo_missing",
    "wrong_weight_quantity": "wrong_weight_quantity",
    "truck_capacity_issue": "truck_capacity_issue",
    "unprofessional_conduct": "driver_misbehavior",
    "driver_misbehavior": "driver_misbehavior",
    "truck_condition_problem": "truck_condition_problem",
    "delivery_not_completed": "delivery_not_completed",
    "owner_misbehavior": "owner_misbehavior",
    "overcharge": "payment_issue",
    "payment_issue": "payment_issue",
    "route_deviation": "other",
    "other": "other",
}


class ReportSerializer(serializers.ModelSerializer):
    trip_reference = serializers.CharField(
        source="trip.trip_id",
        read_only=True,
    )

    load_id = serializers.IntegerField(
        source="load.id",
        read_only=True,
    )

    reported_by_name = serializers.CharField(
        source="reported_by.full_name",
        read_only=True,
    )

    reported_against_name = serializers.CharField(
        source="reported_against.full_name",
        read_only=True,
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "report_id",
            "trip",
            "trip_reference",
            "load",
            "load_id",
            "reported_by",
            "reported_by_name",
            "reported_against",
            "reported_against_name",
            "report_type",
            "description",
            "expected_information",
            "actual_information",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "report_id",
            "reported_by",
            "reported_by_name",
            "reported_against_name",
            "status",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "load": {"required": False},
            "trip": {"required": False, "allow_null": True},
            "reported_against": {"required": False, "allow_null": True},
        }

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)

        # Support trip_id alias from frontend
        if "trip_id" in mutable_data and "trip" not in mutable_data:
            mutable_data["trip"] = mutable_data.get("trip_id")

        # Map frontend report types to backend choice values
        raw_type = mutable_data.get("report_type")
        if raw_type in REPORT_TYPE_MAPPINGS:
            mutable_data["report_type"] = REPORT_TYPE_MAPPINGS[raw_type]

        # Auto-infer load and counterparty from trip
        trip_val = mutable_data.get("trip")
        if trip_val:
            try:
                trip_obj = Trip.objects.select_related("load", "booking__customer", "booking__owner").get(id=trip_val)
                if "load" not in mutable_data or not mutable_data.get("load"):
                    mutable_data["load"] = trip_obj.load_id
                
                if "reported_against" not in mutable_data or not mutable_data.get("reported_against"):
                    request = self.context.get("request")
                    if request and hasattr(request, "user"):
                        user = request.user
                        if trip_obj.booking.customer_id == user.id:
                            mutable_data["reported_against"] = trip_obj.booking.owner_id
                        else:
                            mutable_data["reported_against"] = trip_obj.booking.customer_id
            except (Trip.DoesNotExist, ValueError):
                pass

        return super().to_internal_value(mutable_data)

    def validate_description(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Description cannot be empty."
            )

        return value