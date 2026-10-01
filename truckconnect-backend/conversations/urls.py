from django.urls import path

from .views import (
    ConversationListView,
    ConversationMarkMessagesReadView,
    ConversationMessageCreateView,
    ConversationMessageListView,
)


urlpatterns = [
    path(
        "",
        ConversationListView.as_view(),
        name="conversation-list",
    ),
    path(
        "<int:conversation_id>/messages/",
        ConversationMessageListView.as_view(),
        name="conversation-messages",
    ),
    path(
        "<int:conversation_id>/messages/send/",
        ConversationMessageCreateView.as_view(),
        name="conversation-message-send",
    ),
    path(
        "<int:conversation_id>/messages/read/",
        ConversationMarkMessagesReadView.as_view(),
        name="conversation-messages-read",
    ),
]