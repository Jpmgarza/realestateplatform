from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    total_properties = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_favorites = serializers.IntegerField()
    total_followers = serializers.IntegerField()
    views_this_month = serializers.IntegerField()
    views_last_month = serializers.IntegerField()
    views_trend = serializers.FloatField()
    top_properties = serializers.ListField()
    recent_searches = serializers.ListField()


class PropertyAnalyticsSerializer(serializers.Serializer):
    property_id = serializers.UUIDField()
    title = serializers.CharField()
    total_views = serializers.IntegerField()
    unique_viewers = serializers.IntegerField()
    favorites_count = serializers.IntegerField()
    views_by_day = serializers.ListField()
