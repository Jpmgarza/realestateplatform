from django.db import models
from django.contrib.auth.models import User


class PropertyView(models.Model):
    viewed_property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='views'
    )
    viewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='property_views'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']


class ProfileView(models.Model):
    profile_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='profile_views_received'
    )
    viewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='profile_views_made'
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-viewed_at']


class SearchLog(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='search_logs'
    )
    query = models.CharField(max_length=300)
    filters = models.JSONField(default=dict, blank=True)
    results_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-searched_at']
