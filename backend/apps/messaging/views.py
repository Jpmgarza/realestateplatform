from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListView(generics.ListAPIView):
    """Liste des conversations de l'utilisateur."""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related('participants__profile', 'messages')
            .distinct()
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_conversation(request):
    """Démarre ou retrouve une conversation existante."""
    other_user_id = request.data.get('user_id')
    property_id = request.data.get('property_id')
    reservation_id = request.data.get('reservation_id')
    initial_message = request.data.get('message', '')

    if not other_user_id:
        return Response({'error': 'user_id requis'}, status=400)

    try:
        other_user = User.objects.get(pk=other_user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)

    if other_user == request.user:
        return Response({'error': 'Impossible de démarrer une conversation avec soi-même'}, status=400)

    # Chercher une conversation existante entre les 2 utilisateurs
    existing = Conversation.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user
    )

    if property_id:
        existing = existing.filter(linked_property_id=property_id)

    conversation = existing.first()

    if not conversation:
        conversation = Conversation.objects.create(
            linked_property_id=property_id,
            linked_reservation_id=reservation_id,
        )
        conversation.participants.add(request.user, other_user)

    # Envoyer le message initial
    if initial_message:
        Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=initial_message,
        )

    return Response(
        ConversationSerializer(conversation, context={'request': request}).data,
        status=status.HTTP_201_CREATED if not existing.exists() else 200,
    )


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)


class MessageListView(generics.ListAPIView):
    """Messages d'une conversation."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        # Vérifier que l'utilisateur participe à la conversation
        if not Conversation.objects.filter(
            pk=conversation_id, participants=self.request.user
        ).exists():
            return Message.objects.none()

        # Marquer comme lus
        Message.objects.filter(
            conversation_id=conversation_id, is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)

        return Message.objects.filter(conversation_id=conversation_id)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_message(request, conversation_id):
    """Envoie un message dans une conversation."""
    if not Conversation.objects.filter(
        pk=conversation_id, participants=request.user
    ).exists():
        return Response({'error': 'Conversation introuvable'}, status=404)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message vide'}, status=400)

    message = Message.objects.create(
        conversation_id=conversation_id,
        sender=request.user,
        content=content,
    )

    # Mettre à jour le timestamp de la conversation
    Conversation.objects.filter(pk=conversation_id).update(updated_at=message.created_at)

    return Response(MessageSerializer(message).data, status=201)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    """Nombre total de messages non lus."""
    count = Message.objects.filter(
        conversation__participants=request.user,
        is_read=False,
    ).exclude(sender=request.user).count()
    return Response({'unread_count': count})
