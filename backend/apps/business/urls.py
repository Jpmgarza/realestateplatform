from django.urls import path
from . import views

urlpatterns = [
    path('', views.BusinessListView.as_view(), name='business-list'),
    path('create/', views.BusinessCreateView.as_view(), name='business-create'),
    path('mine/', views.MyBusinessesView.as_view(), name='my-businesses'),
    path('<uuid:pk>/', views.BusinessDetailView.as_view(), name='business-detail'),
    path('<uuid:business_id>/team/', views.add_team_member, name='add-team-member'),
    path('<uuid:business_id>/team/<int:member_id>/', views.remove_team_member, name='remove-team-member'),
    path('<uuid:business_id>/reviews/', views.BusinessReviewListCreateView.as_view(), name='business-reviews'),
]
