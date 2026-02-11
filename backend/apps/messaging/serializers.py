from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'sender_avatar', 'content', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']

    def get_sender_avatar(self, obj):
        if hasattr(obj.sender, 'profile') and obj.sender.profile.avatar:
            return obj.sender.profile.avatar.url
        return None


class ConversationSerializer(serializers.ModelSerializer):
    participants_info = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    property_title = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants_info', 'linked_property', 'property_title',
            'linked_reservation', 'last_message', 'unread_count',
            'created_at', 'updated_at',
        ]

    def get_participants_info(self, obj):
        request = self.context.get('request')
        return [
            {
                'id': u.id,
                'username': u.username,
                'full_name': f"{u.first_name} {u.last_name}".strip() or u.username,
                'avatar': u.profile.avatar.url if hasattr(u, 'profile') and u.profile.avatar else None,
            }
            for u in obj.participants.all()
            if not request or u != request.user
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {
                'content': msg.content[:100],
                'sender_username': msg.sender.username,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_property_title(self, obj):
        if obj.linked_property:
            return obj.linked_property.title
        return None
