from django.urls import path
from . import views

urlpatterns = [
    path('', views.PropertyListCreateView.as_view(), name='property-list'),
    path('<uuid:pk>/', views.PropertyDetailView.as_view(), name='property-detail'),
    path('<uuid:pk>/images/', views.upload_property_image, name='property-images'),
]
