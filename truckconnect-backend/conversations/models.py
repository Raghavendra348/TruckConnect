from django.conf import settings
from django.db import models

from loads.models import Load
from offers.models import Offer


class Conversation(models.Model):
    load = models.ForeignKey(
        Load,
        on_delete=models.CASCADE,
        related_name="conversations",
    )

    offer = models.OneToOneField(
        Offer,
        on_delete=models.CASCADE,
        related_name="conversation",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation #{self.id} - Offer #{self.offer_id}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message #{self.id} - Conversation #{self.conversation_id}"