from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(
        source="sender.full_name",
        read_only=True,
    )

    sender_email = serializers.CharField(
        source="sender.email",
        read_only=True,
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "sender_email",
            "message",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "sender_email",
            "is_read",
            "created_at",
        ]

    def validate_message(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Message cannot be empty."
            )

        return value


class ConversationSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    load_details = serializers.SerializerMethodField()
    offer_details = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = [
            "id",
            "load",
            "offer",
            "customer",
            "owner",
            "load_details",
            "offer_details",
            "last_message",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "load",
            "offer",
            "customer",
            "owner",
            "load_details",
            "offer_details",
            "last_message",
            "created_at",
            "updated_at",
        ]

    def get_customer(self, obj):
        customer = obj.load.customer

        if not customer:
            return None

        return {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "mobile_number": customer.mobile_number,
        }

    def get_owner(self, obj):
        owner = obj.offer.owner

        if not owner:
            return None

        return {
            "id": owner.id,
            "full_name": owner.full_name,
            "email": owner.email,
            "mobile_number": owner.mobile_number,
        }

    def get_load_details(self, obj):
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

    def get_offer_details(self, obj):
        offer = obj.offer

        return {
            "id": offer.id,
            "offered_price": offer.offered_price,
            "owner_message": offer.owner_message,
            "status": offer.status,
            "truck": offer.truck.id,
            "truck_registration_number": (
                offer.truck.registration_number
            ),
        }

    def get_last_message(self, obj):
        message = (
            obj.messages
            .select_related("sender")
            .order_by("-created_at")
            .first()
        )

        if not message:
            return None

        return {
            "id": message.id,
            "sender": message.sender.id,
            "sender_name": message.sender.full_name,
            "message": message.message,
            "is_read": message.is_read,
            "created_at": message.created_at,
        }