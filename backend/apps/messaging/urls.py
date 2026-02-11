from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', views.start_conversation, name='start-conversation'),
    path('conversations/<uuid:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('conversations/<uuid:conversation_id>/send/', views.send_message, name='send-message'),
    path('unread/', views.unread_count, name='unread-count'),
]
