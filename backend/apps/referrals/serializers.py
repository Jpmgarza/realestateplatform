from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Referral, Commission


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = ['id', 'amount', 'transaction_amount', 'status', 'paid_at', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReferralSerializer(serializers.ModelSerializer):
    referrer_username = serializers.CharField(source='referrer.username', read_only=True)
    referred_to_username = serializers.CharField(source='referred_to.username', read_only=True)
    commission = CommissionSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Referral
        fields = [
            'id', 'referrer', 'referrer_username', 'referred_to', 'referred_to_username',
            'client_name', 'client_email', 'client_phone', 'linked_property',
            'description', 'status', 'status_display', 'commission_rate',
            'commission', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'referrer', 'created_at', 'updated_at']


class ReferralCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = [
            'referred_to', 'client_name', 'client_email', 'client_phone',
            'linked_property', 'description', 'commission_rate',
        ]

    def create(self, validated_data):
        validated_data['referrer'] = self.context['request'].user
        return super().create(validated_data)


class ReferralStatsSerializer(serializers.Serializer):
    total_sent = serializers.IntegerField()
    total_received = serializers.IntegerField()
    pending = serializers.IntegerField()
    completed = serializers.IntegerField()
    total_commissions_earned = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_commissions_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
