from django.db.models import Sum, Q
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Referral, Commission
from .serializers import (
    ReferralSerializer, ReferralCreateSerializer,
    CommissionSerializer, ReferralStatsSerializer,
)


class ReferralListView(generics.ListAPIView):
    """Liste des referrals envoyés et reçus."""
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        direction = self.request.query_params.get('direction', 'all')
        qs = Referral.objects.select_related('referrer', 'referred_to', 'commission')

        if direction == 'sent':
            return qs.filter(referrer=user)
        elif direction == 'received':
            return qs.filter(referred_to=user)
        return qs.filter(Q(referrer=user) | Q(referred_to=user))


class ReferralCreateView(generics.CreateAPIView):
    serializer_class = ReferralCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        referral = serializer.save()
        return Response(
            ReferralSerializer(referral).data,
            status=status.HTTP_201_CREATED,
        )


class ReferralDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Referral.objects.filter(Q(referrer=user) | Q(referred_to=user))

    def update(self, request, *args, **kwargs):
        referral = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            if referral.referred_to != request.user and new_status in ['contacted', 'in_progress', 'completed']:
                return Response({'error': 'Seul le destinataire peut mettre à jour le statut'}, status=403)
            referral.status = new_status
            referral.save()
        return Response(ReferralSerializer(referral).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_commission(request, referral_id):
    try:
        referral = Referral.objects.get(pk=referral_id)
    except Referral.DoesNotExist:
        return Response({'error': 'Referral introuvable'}, status=404)

    if referral.referred_to != request.user:
        return Response({'error': 'Non autorisé'}, status=403)

    if hasattr(referral, 'commission'):
        return Response({'error': 'Commission déjà créée'}, status=400)

    transaction_amount = request.data.get('transaction_amount')
    if not transaction_amount:
        return Response({'error': 'Montant de transaction requis'}, status=400)

    amount = float(transaction_amount) * float(referral.commission_rate) / 100
    commission = Commission.objects.create(
        referral=referral,
        amount=amount,
        transaction_amount=transaction_amount,
    )
    referral.status = 'completed'
    referral.save()

    return Response(CommissionSerializer(commission).data, status=201)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def referral_stats(request):
    user = request.user
    sent = Referral.objects.filter(referrer=user)
    received = Referral.objects.filter(referred_to=user)

    earned = Commission.objects.filter(
        referral__referrer=user, status='paid'
    ).aggregate(total=Sum('amount'))['total'] or 0

    paid = Commission.objects.filter(
        referral__referred_to=user, status='paid'
    ).aggregate(total=Sum('amount'))['total'] or 0

    data = {
        'total_sent': sent.count(),
        'total_received': received.count(),
        'pending': sent.filter(status='pending').count() + received.filter(status='pending').count(),
        'completed': sent.filter(status='completed').count() + received.filter(status='completed').count(),
        'total_commissions_earned': earned,
        'total_commissions_paid': paid,
    }
    return Response(ReferralStatsSerializer(data).data)
