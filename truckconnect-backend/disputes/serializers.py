from rest_framework import serializers
from reports.models import Report
from trips.models import Trip
from .models import Dispute


class DisputeSerializer(serializers.ModelSerializer):
    report_reference = serializers.CharField(
        source="report.report_id",
        read_only=True,
    )

    trip_reference = serializers.CharField(
        source="trip.trip_id",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True,
    )

    report_details = serializers.SerializerMethodField()
    trip_details = serializers.SerializerMethodField()
    settlements = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = [
            "id",
            "dispute_id",
            "report",
            "report_reference",
            "report_details",
            "trip",
            "trip_reference",
            "trip_details",
            "created_by",
            "created_by_name",
            "reason",
            "evidence",
            "respondent_response",
            "respondent_evidence",
            "status",
            "admin_notes",
            "resolution",
            "settlements",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "dispute_id",
            "report_reference",
            "report_details",
            "trip_reference",
            "trip_details",
            "created_by",
            "created_by_name",
            "status",
            "admin_notes",
            "resolution",
            "settlements",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "report": {"required": False, "allow_null": True},
            "trip": {"required": False, "allow_null": True},
        }

    def get_report_details(self, obj):
        if not obj.report:
            return None
        r = obj.report
        return {
            "id": r.id,
            "report_id": r.report_id,
            "report_type": r.report_type,
            "report_type_display": r.get_report_type_display(),
            "description": r.description,
            "expected_information": r.expected_information,
            "actual_information": r.actual_information,
            "status": r.status,
            "reported_by": {
                "id": r.reported_by.id,
                "full_name": r.reported_by.full_name,
                "role": r.reported_by.role,
            } if r.reported_by else None,
            "reported_against": {
                "id": r.reported_against.id,
                "full_name": r.reported_against.full_name,
                "role": r.reported_against.role,
            } if r.reported_against else None,
        }

    def get_trip_details(self, obj):
        if not obj.trip:
            return None
        t = obj.trip
        customer = getattr(getattr(t, "booking", None), "customer", None)
        owner = getattr(getattr(t, "booking", None), "owner", None)
        agreed_price = getattr(getattr(t, "booking", None), "agreed_price", 0)
        return {
            "id": t.id,
            "trip_id": t.trip_id,
            "pickup_location": t.pickup_location,
            "destination": t.destination,
            "current_status": t.current_status,
            "customer": {
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
            } if customer else None,
            "owner": {
                "id": owner.id,
                "full_name": owner.full_name,
                "email": owner.email,
            } if owner else None,
            "agreed_price": agreed_price,
        }

    def get_settlements(self, obj):
        return [
            {
                "id": s.id,
                "settlement_id": s.settlement_id,
                "settlement_type": s.settlement_type,
                "original_amount": s.original_amount,
                "adjustment_amount": s.adjustment_amount,
                "final_settlement_amount": s.final_settlement_amount,
                "status": s.status,
            }
            for s in obj.settlements.all()
        ]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)

        if "report_id" in mutable_data and "report" not in mutable_data:
            mutable_data["report"] = mutable_data.get("report_id")

        if "trip_id" in mutable_data and "trip" not in mutable_data:
            mutable_data["trip"] = mutable_data.get("trip_id")

        report_val = mutable_data.get("report")
        if report_val and ("trip" not in mutable_data or not mutable_data.get("trip")):
            try:
                report_obj = Report.objects.select_related("trip").get(id=report_val)
                if report_obj.trip:
                    mutable_data["trip"] = report_obj.trip.id
            except (Report.DoesNotExist, ValueError):
                pass

        return super().to_internal_value(mutable_data)