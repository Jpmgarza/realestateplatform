from datetime import date
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Reservation, Availability, BlockedDate
from .serializers import (
    ReservationSerializer, ReservationCreateSerializer,
    AvailabilitySerializer, BlockedDateSerializer,
)


# ─── AVAILABILITY ────────────────────────────────────────

class AvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        property_id = self.kwargs['property_id']
        return Availability.objects.filter(linked_property_id=property_id, is_active=True)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(linked_property_id=self.kwargs['property_id'])


class AvailabilityDeleteView(generics.DestroyAPIView):
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Availability.objects.filter(
            linked_property__owner=self.request.user
        )


# ─── BLOCKED DATES ───────────────────────────────────────

class BlockedDateListCreateView(generics.ListCreateAPIView):
    serializer_class = BlockedDateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BlockedDate.objects.filter(linked_property_id=self.kwargs['property_id'])

    def perform_create(self, serializer):
        serializer.save(linked_property_id=self.kwargs['property_id'])


# ─── CALENDAR (dates disponibles/bloquées) ───────────────

@api_view(['GET'])
def property_calendar(request, property_id):
    """Retourne les disponibilités, dates bloquées et réservations pour le calendrier."""
    availabilities = Availability.objects.filter(
        linked_property_id=property_id, is_active=True,
        end_date__gte=date.today(),
    )
    blocked = BlockedDate.objects.filter(
        linked_property_id=property_id,
        date__gte=date.today(),
    )
    reservations = Reservation.objects.filter(
        linked_property_id=property_id,
        status__in=['confirmed', 'paid'],
        check_out__gte=date.today(),
    )

    return Response({
        'availabilities': AvailabilitySerializer(availabilities, many=True).data,
        'blocked_dates': [bd.date.isoformat() for bd in blocked],
        'reserved_dates': [
            {'check_in': r.check_in.isoformat(), 'check_out': r.check_out.isoformat()}
            for r in reservations
        ],
    })


# ─── RESERVATIONS ────────────────────────────────────────

class ReservationCreateView(generics.CreateAPIView):
    serializer_class = ReservationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        prop = data['linked_property']
        check_in = data['check_in']
        check_out = data['check_out']
        nights = (check_out - check_in).days

        # Trouver le prix par nuit depuis les disponibilités
        availability = Availability.objects.filter(
            linked_property=prop,
            start_date__lte=check_in,
            end_date__gte=check_out,
            is_active=True,
        ).first()

        if availability:
            price_per_night = availability.price_per_night
        else:
            price_per_night = prop.price  # Fallback au prix de la propriété

        total_price = price_per_night * nights
        service_fee = total_price * Decimal('0.05')  # 5% frais de service

        reservation = Reservation.objects.create(
            linked_property=prop,
            guest=request.user,
            host=prop.owner,
            check_in=check_in,
            check_out=check_out,
            guests_count=data.get('guests_count', 1),
            price_per_night=price_per_night,
            total_price=total_price + service_fee,
            service_fee=service_fee,
            message=data.get('message', ''),
        )

        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
        )


class MyReservationsView(generics.ListAPIView):
    """Réservations en tant que guest."""
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(guest=self.request.user).select_related(
            'linked_property', 'host'
        )


class HostReservationsView(generics.ListAPIView):
    """Réservations reçues en tant que host."""
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(host=self.request.user).select_related(
            'linked_property', 'guest'
        )


class ReservationDetailView(generics.RetrieveAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Reservation.objects.filter(Q(guest=user) | Q(host=user))


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_reservation(request, reservation_id):
    """Le host confirme la réservation."""
    try:
        reservation = Reservation.objects.get(pk=reservation_id, host=request.user)
    except Reservation.DoesNotExist:
        return Response({'error': 'Réservation introuvable'}, status=404)

    if reservation.status != 'pending':
        return Response({'error': 'Impossible de confirmer cette réservation'}, status=400)

    reservation.status = 'confirmed'
    reservation.save()
    return Response(ReservationSerializer(reservation).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_reservation(request, reservation_id):
    """Le guest ou le host annule la réservation."""
    try:
        reservation = Reservation.objects.get(
            pk=reservation_id
        )
    except Reservation.DoesNotExist:
        return Response({'error': 'Réservation introuvable'}, status=404)

    if reservation.guest != request.user and reservation.host != request.user:
        return Response({'error': 'Non autorisé'}, status=403)

    if reservation.status in ['cancelled', 'refunded', 'completed']:
        return Response({'error': 'Impossible d\'annuler cette réservation'}, status=400)

    reservation.status = 'cancelled'
    reservation.cancelled_at = timezone.now()
    reservation.cancellation_reason = request.data.get('reason', '')
    reservation.save()
    return Response(ReservationSerializer(reservation).data)


# ─── STRIPE CHECKOUT ─────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_checkout_session(request, reservation_id):
    """Crée une session Stripe Checkout pour payer la réservation."""
    try:
        reservation = Reservation.objects.get(pk=reservation_id, guest=request.user)
    except Reservation.DoesNotExist:
        return Response({'error': 'Réservation introuvable'}, status=404)

    if reservation.status != 'confirmed':
        return Response({'error': 'La réservation doit être confirmée avant le paiement'}, status=400)

    try:
        import stripe
        from django.conf import settings
        stripe.api_key = settings.STRIPE_SECRET_KEY

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Réservation - {reservation.linked_property.title}",
                        'description': f"{reservation.nights} nuit(s) du {reservation.check_in} au {reservation.check_out}",
                    },
                    'unit_amount': int(reservation.total_price * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=request.data.get('success_url', 'http://localhost:5173/reservations?status=success'),
            cancel_url=request.data.get('cancel_url', 'http://localhost:5173/reservations?status=cancelled'),
            metadata={
                'reservation_id': str(reservation.id),
            },
        )

        reservation.stripe_session_id = session.id
        reservation.save()

        return Response({'checkout_url': session.url, 'session_id': session.id})

    except ImportError:
        return Response({'error': 'Stripe non configuré. Installez le package stripe.'}, status=500)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def stripe_webhook(request):
    """Webhook Stripe pour confirmer le paiement."""
    try:
        import stripe
        from django.conf import settings

        stripe.api_key = settings.STRIPE_SECRET_KEY
        endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        if endpoint_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        else:
            import json
            event = json.loads(payload)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            reservation_id = session.get('metadata', {}).get('reservation_id')
            if reservation_id:
                try:
                    reservation = Reservation.objects.get(pk=reservation_id)
                    reservation.status = 'paid'
                    reservation.stripe_payment_intent = session.get('payment_intent', '')
                    reservation.save()
                except Reservation.DoesNotExist:
                    pass

        return Response({'received': True})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
