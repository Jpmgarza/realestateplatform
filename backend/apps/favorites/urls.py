from django.urls import path
from . import views

urlpatterns = [
    path('', views.FavoriteListCreateView.as_view(), name='favorite-list'),
    path('<int:pk>/', views.FavoriteDeleteView.as_view(), name='favorite-delete'),
]
