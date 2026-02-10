from rest_framework import serializers
from .models import Property, PropertyImage
from apps.users.serializers import UserSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_cover', 'order', 'uploaded_at']


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'owner', 'title', 'description', 'property_type',
            'transaction_type', 'price', 'currency', 'address', 'city',
            'country', 'postal_code', 'latitude', 'longitude',
            'bedrooms', 'bathrooms', 'surface_area', 'is_published',
            'images', 'is_favorited', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            'title', 'description', 'property_type', 'transaction_type',
            'price', 'currency', 'address', 'city', 'country', 'postal_code',
            'latitude', 'longitude', 'bedrooms', 'bathrooms', 'surface_area', 'is_published',
        ]

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
