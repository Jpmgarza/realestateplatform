from django.urls import path
from . import views

urlpatterns = [
    path('track/property/<uuid:property_id>/', views.track_property_view, name='track-property-view'),
    path('track/profile/<int:user_id>/', views.track_profile_view, name='track-profile-view'),
    path('track/search/', views.track_search, name='track-search'),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('property/<uuid:property_id>/', views.property_analytics, name='property-analytics'),
]
