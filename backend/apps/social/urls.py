from django.urls import path
from . import views

urlpatterns = [
    # Feed
    path('feed/', views.FeedView.as_view(), name='feed'),
    path('feed/global/', views.GlobalFeedView.as_view(), name='global-feed'),

    # Posts CRUD
    path('posts/', views.PostCreateView.as_view(), name='post-create'),
    path('posts/<uuid:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<uuid:pk>/edit/', views.PostUpdateView.as_view(), name='post-update'),
    path('posts/<uuid:post_id>/publish/', views.publish_post, name='post-publish'),
    path('users/<int:user_id>/posts/', views.UserPostsView.as_view(), name='user-posts'),

    # Drafts
    path('drafts/', views.DraftListView.as_view(), name='draft-list'),
    path('drafts/<uuid:pk>/', views.DraftDeleteView.as_view(), name='draft-delete'),

    # Scheduled
    path('scheduled/', views.ScheduledListView.as_view(), name='scheduled-list'),

    # Likes
    path('posts/<uuid:post_id>/like/', views.toggle_like, name='toggle-like'),

    # Comments
    path('posts/<uuid:post_id>/comments/', views.CommentListCreateView.as_view(), name='comments'),
    path('comments/<int:comment_id>/', views.delete_comment, name='delete-comment'),

    # Follow
    path('users/<int:user_id>/follow/', views.toggle_follow, name='toggle-follow'),

    # Profile social
    path('users/<int:pk>/profile/', views.UserSocialProfileView.as_view(), name='social-profile'),
]
