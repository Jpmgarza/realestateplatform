from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReferralListView.as_view(), name='referral-list'),
    path('create/', views.ReferralCreateView.as_view(), name='referral-create'),
    path('<uuid:pk>/', views.ReferralDetailView.as_view(), name='referral-detail'),
    path('<uuid:referral_id>/commission/', views.create_commission, name='create-commission'),
    path('stats/', views.referral_stats, name='referral-stats'),
]
