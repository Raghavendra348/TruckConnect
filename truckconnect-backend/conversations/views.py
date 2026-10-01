from django.db import transaction

from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from offers.models import Offer

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


def get_user_conversations(user):
    if user.role == "customer":
        offers = Offer.objects.filter(
            load__customer=user
        )

    elif user.role == "truck_owner":
        offers = Offer.objects.filter(
            owner=user
        )

    else:
        offers = Offer.objects.none()

    for offer in offers:
        Conversation.objects.get_or_create(
            offer=offer,
            defaults={
                "load": offer.load,
            },
        )

    return (
        Conversation.objects
        .filter(
            offer__in=offers
        )
        .select_related(
            "load",
            "load__customer",
            "offer",
            "offer__owner",
            "offer__truck",
        )
        .order_by("-updated_at")
    )


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_conversations(
            self.request.user
        )


class ConversationMessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs["conversation_id"]

        try:
            conversation = (
                Conversation.objects
                .select_related(
                    "load",
                    "load__customer",
                    "offer",
                    "offer__owner",
                )
                .get(id=conversation_id)
            )
        except Conversation.DoesNotExist:
            return Message.objects.none()

        user = self.request.user

        if (
            conversation.load.customer != user
            and conversation.offer.owner != user
        ):
            raise PermissionDenied(
                "You do not have access to this conversation."
            )

        return (
            Message.objects
            .filter(
                conversation=conversation
            )
            .select_related("sender")
            .order_by("created_at")
        )


class ConversationMessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        conversation_id = self.kwargs["conversation_id"]

        try:
            conversation = (
                Conversation.objects
                .select_related(
                    "load",
                    "load__customer",
                    "offer",
                    "offer__owner",
                )
                .get(id=conversation_id)
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "message": "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user

        if (
            conversation.load.customer != user
            and conversation.offer.owner != user
        ):
            raise PermissionDenied(
                "You do not have access to this conversation."
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        message = serializer.save(
            conversation=conversation,
            sender=user,
        )

        conversation.save(
            update_fields=["updated_at"]
        )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationMarkMessagesReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        try:
            conversation = (
                Conversation.objects
                .select_related(
                    "load",
                    "load__customer",
                    "offer",
                    "offer__owner",
                )
                .get(id=conversation_id)
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "message": "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user

        if (
            conversation.load.customer != user
            and conversation.offer.owner != user
        ):
            raise PermissionDenied(
                "You do not have access to this conversation."
            )

        updated_count = (
            Message.objects
            .filter(
                conversation=conversation,
                is_read=False,
            )
            .exclude(sender=user)
            .update(is_read=True)
        )

        return Response(
            {
                "message": "Messages marked as read.",
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK,
        )