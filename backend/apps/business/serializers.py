from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Business, TeamMember, BusinessReview


class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'username', 'full_name', 'role', 'role_display', 'title', 'joined_at']
        read_only_fields = ['id', 'joined_at']

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class BusinessReviewSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = BusinessReview
        fields = ['id', 'author', 'author_username', 'rating', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class BusinessSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    type_display = serializers.CharField(source='get_business_type_display', read_only=True)
    team_members = TeamMemberSerializer(many=True, read_only=True)
    reviews_count = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    properties_count = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id', 'owner', 'owner_username', 'name', 'business_type', 'type_display',
            'description', 'logo', 'cover_image', 'phone', 'email', 'website',
            'address', 'city', 'country', 'siret', 'is_verified', 'is_active',
            'team_members', 'reviews_count', 'avg_rating', 'properties_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'is_verified', 'created_at', 'updated_at']

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_properties_count(self, obj):
        return obj.owner.properties.filter(is_published=True).count()


class BusinessCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            'name', 'business_type', 'description', 'logo', 'cover_image',
            'phone', 'email', 'website', 'address', 'city', 'country', 'siret',
        ]

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        business = super().create(validated_data)
        TeamMember.objects.create(business=business, user=business.owner, role='owner')
        return business
