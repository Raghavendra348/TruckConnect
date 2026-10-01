from django.contrib.auth import get_user_model

from rest_framework import serializers

from bookings.models import Booking
from disputes.models import Dispute
from drivers.models import Driver
from loads.models import Load
from offers.models import Offer
from payments.models import Payment, PaymentTransaction
from reports.models import Report
from trucks.models import Truck, TruckDocument
from trips.models import Trip
from notifications.models import Notification
from settlements.models import Settlement


User = get_user_model()


# ============================================================
# ADMIN DASHBOARD
# ============================================================

class AdminDashboardSerializer(serializers.Serializer):
    customers = serializers.IntegerField()
    truck_owners = serializers.IntegerField()
    trucks = serializers.IntegerField()
    drivers = serializers.IntegerField()
    loads = serializers.IntegerField()
    offers = serializers.IntegerField()
    bookings = serializers.IntegerField()
    trips = serializers.IntegerField()
    payments = serializers.IntegerField()
    reports = serializers.IntegerField()
    disputes = serializers.IntegerField()
    settlements = serializers.IntegerField()
    notifications = serializers.IntegerField()


# ============================================================
# ADMIN USERS
# ============================================================

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "mobile_number",
            "role",
            "is_active",
            "verification_status",
            "date_joined",
        ]


# ============================================================
# ADMIN VERIFICATION
# ============================================================

class AdminVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "mobile_number",
            "role",
            "verification_status",
        ]


# ============================================================
# ADMIN FLEET
# ============================================================

class AdminTruckDocumentSerializer(serializers.ModelSerializer):
    verified_by = serializers.SerializerMethodField()

    class Meta:
        model = TruckDocument
        fields = [
            "id",
            "document_type",
            "document_number",
            "file",
            "expiry_date",
            "verification_status",
            "verified_by",
            "verified_at",
            "created_at",
            "updated_at",
        ]

    def get_verified_by(self, obj):
        if not obj.verified_by:
            return None

        user = obj.verified_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }


class AdminTruckSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    documents = AdminTruckDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Truck
        fields = [
            "id",
            "owner",
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
            "documents",
            "created_at",
            "updated_at",
        ]

    def get_owner(self, obj):
        if not obj.owner:
            return None

        owner = obj.owner

        return {
            "id": owner.id,
            "email": owner.email,
            "full_name": owner.full_name,
            "mobile_number": owner.mobile_number,
            "role": owner.role,
        }


# ============================================================
# ADMIN LOADS
# ============================================================

class AdminLoadSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()

    class Meta:
        model = Load
        fields = [
            "id",
            "customer",
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

    def get_customer(self, obj):
        if not obj.customer:
            return None

        customer = obj.customer

        return {
            "id": customer.id,
            "email": customer.email,
            "full_name": customer.full_name,
            "mobile_number": customer.mobile_number,
            "role": customer.role,
        }


# ============================================================
# ADMIN OFFERS
# ============================================================

class AdminOfferSerializer(serializers.ModelSerializer):
    load = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    truck = serializers.SerializerMethodField()
    message = serializers.CharField(source="owner_message", read_only=True, required=False, allow_null=True)

    class Meta:
        model = Offer
        fields = [
            "id",
            "load",
            "owner",
            "truck",
            "offered_price",
            "message",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_load(self, obj):
        if not obj.load:
            return None

        load = obj.load

        return {
            "id": load.id,
            "goods_type": load.goods_type,
            "weight_kg": load.weight_kg,
            "pickup_location": load.pickup_location,
            "destination": load.destination,
            "pickup_date": load.pickup_date,
            "pickup_time": load.pickup_time,
            "status": load.status,
        }

    def get_owner(self, obj):
        if not obj.owner:
            return None

        owner = obj.owner

        return {
            "id": owner.id,
            "email": owner.email,
            "full_name": owner.full_name,
            "mobile_number": owner.mobile_number,
            "role": owner.role,
        }

    def get_truck(self, obj):
        if not obj.truck:
            return None

        truck = obj.truck

        return {
            "id": truck.id,
            "registration_number": truck.registration_number,
            "truck_type": truck.truck_type,
            "capacity_kg": truck.capacity_kg,
            "current_location": truck.current_location,
            "status": truck.status,
        }


# ============================================================
# ADMIN BOOKINGS
# ============================================================

class AdminBookingSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    load = serializers.SerializerMethodField()
    offer = serializers.SerializerMethodField()
    truck = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "owner",
            "load",
            "offer",
            "truck",
            "final_price",
            "status",
            "confirmed_at",
        ]

    def get_customer(self, obj):
        if not obj.customer:
            return None

        customer = obj.customer

        return {
            "id": customer.id,
            "email": customer.email,
            "full_name": customer.full_name,
            "mobile_number": customer.mobile_number,
            "role": customer.role,
        }

    def get_owner(self, obj):
        if not obj.owner:
            return None

        owner = obj.owner

        return {
            "id": owner.id,
            "email": owner.email,
            "full_name": owner.full_name,
            "mobile_number": owner.mobile_number,
            "role": owner.role,
        }

    def get_load(self, obj):
        if not obj.load:
            return None

        load = obj.load

        return {
            "id": load.id,
            "goods_type": load.goods_type,
            "weight_kg": load.weight_kg,
            "pickup_location": load.pickup_location,
            "destination": load.destination,
            "pickup_date": load.pickup_date,
            "pickup_time": load.pickup_time,
            "status": load.status,
        }

    def get_offer(self, obj):
        if not obj.offer:
            return None

        offer = obj.offer

        return {
            "id": offer.id,
            "offered_price": offer.offered_price,
            "status": offer.status,
            "created_at": offer.created_at,
            "updated_at": offer.updated_at,
        }

    def get_truck(self, obj):
        if not obj.truck:
            return None

        truck = obj.truck

        return {
            "id": truck.id,
            "registration_number": truck.registration_number,
            "truck_type": truck.truck_type,
            "capacity_kg": truck.capacity_kg,
            "current_location": truck.current_location,
            "status": truck.status,
        }


# ============================================================
# ADMIN TRIPS
# ============================================================

class AdminTripLocationUpdateSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.CharField()
    location = serializers.CharField()
    note = serializers.CharField(allow_blank=True, allow_null=True)
    photo = serializers.ImageField(allow_null=True, required=False)
    updated_by = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()

    def get_updated_by(self, obj):
        if not obj.updated_by:
            return None

        user = obj.updated_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }


class AdminTripSerializer(serializers.ModelSerializer):
    booking = serializers.SerializerMethodField()
    load = serializers.SerializerMethodField()
    truck = serializers.SerializerMethodField()
    driver = serializers.SerializerMethodField()
    location_updates = AdminTripLocationUpdateSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Trip
        fields = [
            "id",
            "trip_id",
            "booking",
            "load",
            "truck",
            "driver",
            "start_location",
            "pickup_location",
            "destination",
            "current_location",
            "current_status",
            "started_at",
            "completed_at",
            "location_updates",
            "created_at",
            "updated_at",
        ]

    def get_booking(self, obj):
        if not obj.booking:
            return None

        booking = obj.booking

        return {
            "id": booking.id,
            "final_price": booking.final_price,
            "status": booking.status,
            "confirmed_at": booking.confirmed_at,
        }

    def get_load(self, obj):
        if not obj.load:
            return None

        load = obj.load

        return {
            "id": load.id,
            "goods_type": load.goods_type,
            "weight_kg": load.weight_kg,
            "pickup_location": load.pickup_location,
            "destination": load.destination,
            "pickup_date": load.pickup_date,
            "pickup_time": load.pickup_time,
            "status": load.status,
            "customer": {
                "id": load.customer.id,
                "email": load.customer.email,
                "full_name": load.customer.full_name,
                "role": load.customer.role,
            } if load.customer else None,
        }

    def get_truck(self, obj):
        if not obj.truck:
            return None

        truck = obj.truck

        return {
            "id": truck.id,
            "registration_number": truck.registration_number,
            "truck_type": truck.truck_type,
            "capacity_kg": truck.capacity_kg,
            "manufacturer": truck.manufacturer,
            "model": truck.model,
            "year": truck.year,
            "fuel_type": truck.fuel_type,
            "current_location": truck.current_location,
            "status": truck.status,
            "owner": {
                "id": truck.owner.id,
                "email": truck.owner.email,
                "full_name": truck.owner.full_name,
                "role": truck.owner.role,
            } if truck.owner else None,
        }

    def get_driver(self, obj):
        if not obj.driver:
            return None

        driver = obj.driver

        return {
            "id": driver.id,
            "display_name": str(driver),
        }


# ============================================================
# ADMIN PAYMENTS
# ============================================================

class AdminPaymentTransactionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "amount",
            "payment_type",
            "payment_reference",
            "payment_date",
            "status",
            "proof",
            "created_by",
            "created_at",
        ]

    def get_created_by(self, obj):
        if not obj.created_by:
            return None

        user = obj.created_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }


class AdminPaymentSerializer(serializers.ModelSerializer):
    trip = serializers.SerializerMethodField()
    transactions = AdminPaymentTransactionSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "trip",
            "agreed_amount",
            "total_paid",
            "remaining_amount",
            "payment_status",
            "transactions",
            "created_at",
            "updated_at",
        ]

    def get_trip(self, obj):
        if not obj.trip:
            return None

        trip = obj.trip

        return {
            "id": trip.id,
            "trip_id": trip.trip_id,
            "start_location": trip.start_location,
            "pickup_location": trip.pickup_location,
            "destination": trip.destination,
            "current_location": trip.current_location,
            "current_status": trip.current_status,
        }


# ============================================================
# ADMIN REPORTS
# ============================================================

class AdminReportSerializer(serializers.ModelSerializer):
    trip = serializers.SerializerMethodField()
    load = serializers.SerializerMethodField()
    reported_by = serializers.SerializerMethodField()
    reported_against = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "report_id",
            "trip",
            "load",
            "reported_by",
            "reported_against",
            "report_type",
            "description",
            "expected_information",
            "actual_information",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_trip(self, obj):
        if not obj.trip:
            return None

        trip = obj.trip

        return {
            "id": trip.id,
            "trip_id": trip.trip_id,
            "pickup_location": trip.pickup_location,
            "destination": trip.destination,
            "current_location": trip.current_location,
            "current_status": trip.current_status,
        }

    def get_load(self, obj):
        if not obj.load:
            return None

        load = obj.load

        return {
            "id": load.id,
            "goods_type": load.goods_type,
            "weight_kg": load.weight_kg,
            "pickup_location": load.pickup_location,
            "destination": load.destination,
            "pickup_date": load.pickup_date,
            "pickup_time": load.pickup_time,
            "status": load.status,
        }

    def get_reported_by(self, obj):
        if not obj.reported_by:
            return None

        user = obj.reported_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }

    def get_reported_against(self, obj):
        if not obj.reported_against:
            return None

        user = obj.reported_against

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }


# ============================================================
# ADMIN DISPUTES
# ============================================================

class AdminDisputeSerializer(serializers.ModelSerializer):
    report = serializers.SerializerMethodField()
    trip = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    settlements = serializers.SerializerMethodField()

    class Meta:
        model = Dispute
        fields = [
            "id",
            "dispute_id",
            "report",
            "trip",
            "created_by",
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

    def get_report(self, obj):
        if not obj.report:
            return None

        report = obj.report

        return {
            "id": report.id,
            "report_id": report.report_id,
            "report_type": report.report_type,
            "report_type_display": report.get_report_type_display(),
            "description": report.description,
            "expected_information": report.expected_information,
            "actual_information": report.actual_information,
            "status": report.status,
            "reported_by": {
                "id": report.reported_by.id,
                "email": report.reported_by.email,
                "full_name": report.reported_by.full_name,
                "role": report.reported_by.role,
            } if report.reported_by else None,
            "reported_against": {
                "id": report.reported_against.id,
                "email": report.reported_against.email,
                "full_name": report.reported_against.full_name,
                "role": report.reported_against.role,
            } if report.reported_against else None,
            "created_at": report.created_at,
            "updated_at": report.updated_at,
        }

    def get_trip(self, obj):
        if not obj.trip:
            return None

        trip = obj.trip
        customer = getattr(getattr(trip, "booking", None), "customer", None)
        owner = getattr(getattr(trip, "booking", None), "owner", None)
        agreed_price = getattr(getattr(trip, "booking", None), "agreed_price", 0)

        return {
            "id": trip.id,
            "trip_id": trip.trip_id,
            "pickup_location": trip.pickup_location,
            "destination": trip.destination,
            "current_location": trip.current_location,
            "current_status": trip.current_status,
            "customer": {
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "role": customer.role,
            } if customer else None,
            "owner": {
                "id": owner.id,
                "full_name": owner.full_name,
                "email": owner.email,
                "role": owner.role,
            } if owner else None,
            "agreed_price": agreed_price,
        }

    def get_created_by(self, obj):
        if not obj.created_by:
            return None

        user = obj.created_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,
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
class AdminNotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "notification_type",
            "title",
            "message",
            "is_read",
            "created_at",
        ]

    def get_recipient(self, obj):
        if not obj.recipient:
            return None

        user = obj.recipient

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,
        }        
class AdminSettlementSerializer(serializers.ModelSerializer):
    trip = serializers.SerializerMethodField()
    report = serializers.SerializerMethodField()
    dispute = serializers.SerializerMethodField()
    payer = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    resolved_by = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = [
            "id",
            "settlement_id",
            "trip",
            "report",
            "dispute",
            "original_amount",
            "amount_already_paid",
            "adjustment_amount",
            "final_settlement_amount",
            "payer",
            "receiver",
            "settlement_type",
            "reason",
            "evidence",
            "admin_notes",
            "status",
            "created_date",
            "resolved_date",
            "resolved_by",
        ]

    def get_trip(self, obj):
        if not obj.trip:
            return None

        trip = obj.trip

        return {
            "id": trip.id,
            "trip_id": trip.trip_id,
            "pickup_location": trip.pickup_location,
            "destination": trip.destination,
            "current_location": trip.current_location,
            "current_status": trip.current_status,
        }

    def get_report(self, obj):
        if not obj.report:
            return None

        report = obj.report

        return {
            "id": report.id,
            "report_id": report.report_id,
            "report_type": report.report_type,
            "description": report.description,
            "status": report.status,
        }

    def get_dispute(self, obj):
        if not obj.dispute:
            return None

        dispute = obj.dispute

        return {
            "id": dispute.id,
            "dispute_id": dispute.dispute_id,
            "status": dispute.status,
            "admin_notes": dispute.admin_notes,
            "resolution": dispute.resolution,
        }

    def get_payer(self, obj):
        if not obj.payer:
            return None

        user = obj.payer

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,
        }

    def get_receiver(self, obj):
        if not obj.receiver:
            return None

        user = obj.receiver

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,
        }

    def get_resolved_by(self, obj):
        if not obj.resolved_by:
            return None

        user = obj.resolved_by

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }