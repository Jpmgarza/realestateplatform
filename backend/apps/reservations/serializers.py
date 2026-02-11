from rest_framework import serializers
from .models import Reservation, Availability, BlockedDate


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = [
            'id', 'linked_property', 'start_date', 'end_date',
            'price_per_night', 'min_nights', 'max_nights', 'is_active',
        ]
        read_only_fields = ['id']


class BlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedDate
        fields = ['id', 'linked_property', 'date', 'reason']
        read_only_fields = ['id']


class ReservationSerializer(serializers.ModelSerializer):
    guest_username = serializers.CharField(source='guest.username', read_only=True)
    host_username = serializers.CharField(source='host.username', read_only=True)
    property_title = serializers.CharField(source='linked_property.title', read_only=True)
    property_city = serializers.CharField(source='linked_property.city', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'linked_property', 'property_title', 'property_city',
            'guest', 'guest_username', 'host', 'host_username',
            'check_in', 'check_out', 'nights', 'guests_count',
            'price_per_night', 'total_price', 'service_fee',
            'status', 'status_display', 'message',
            'stripe_payment_intent', 'stripe_session_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'guest', 'host', 'total_price', 'service_fee',
            'stripe_payment_intent', 'stripe_session_id', 'created_at', 'updated_at',
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['linked_property', 'check_in', 'check_out', 'guests_count', 'message']

    def validate(self, data):
        if data['check_in'] >= data['check_out']:
            raise serializers.ValidationError("Le check-out doit être après le check-in")

        prop = data['linked_property']
        check_in = data['check_in']
        check_out = data['check_out']

        # Vérifier qu'il n'y a pas de réservation existante qui chevauche
        overlapping = Reservation.objects.filter(
            linked_property=prop,
            status__in=['pending', 'confirmed', 'paid'],
            check_in__lt=check_out,
            check_out__gt=check_in,
        )
        if overlapping.exists():
            raise serializers.ValidationError("Ces dates ne sont pas disponibles")

        # Vérifier les dates bloquées
        blocked = BlockedDate.objects.filter(
            linked_property=prop,
            date__gte=check_in,
            date__lt=check_out,
        )
        if blocked.exists():
            raise serializers.ValidationError("Certaines dates sont bloquées par le propriétaire")

        return data
