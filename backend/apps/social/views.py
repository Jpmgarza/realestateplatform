from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Post, PostImage, Like, Comment, Follow
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentSerializer,
    FollowSerializer, UserProfileSocialSerializer,
)


# ─── FEED ───────────────────────────────────────────────

class FeedView(generics.ListAPIView):
    """Feed des utilisateurs suivis + ses propres posts."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_ids = user.following.values_list('following_id', flat=True)
        return (
            Post.objects
            .filter(author_id__in=[*following_ids, user.id])
            .annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            .select_related('author__profile')
            .prefetch_related('images', 'comments__user')
        )


class GlobalFeedView(generics.ListAPIView):
    """Feed global (tous les posts) pour découverte."""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Post.objects.all()
            .annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            .select_related('author__profile')
            .prefetch_related('images', 'comments__user')
        )


# ─── POSTS ──────────────────────────────────────────────

class PostCreateView(generics.CreateAPIView):
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        images = request.FILES.getlist('images')
        for i, img in enumerate(images):
            PostImage.objects.create(post=post, image=img, order=i)

        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.annotate(
            likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True)
        )

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        return super().destroy(request, *args, **kwargs)


class UserPostsView(generics.ListAPIView):
    """Posts d'un utilisateur spécifique."""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Post.objects
            .filter(author_id=self.kwargs['user_id'])
            .annotate(likes_count=Count('likes', distinct=True), comments_count=Count('comments', distinct=True))
            .select_related('author__profile')
            .prefetch_related('images', 'comments__user')
        )


# ─── LIKES ──────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post introuvable'}, status=404)

    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
        return Response({'liked': False, 'likes_count': post.likes.count()})
    return Response({'liked': True, 'likes_count': post.likes.count()})


# ─── COMMENTS ───────────────────────────────────────────

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs['post_id'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, post_id=self.kwargs['post_id'])


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Commentaire introuvable'}, status=404)
    if comment.user != request.user:
        return Response({'error': 'Non autorisé'}, status=403)
    comment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ─── FOLLOW ─────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow(request, user_id):
    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)

    if target == request.user:
        return Response({'error': 'Impossible de se suivre soi-même'}, status=400)

    follow, created = Follow.objects.get_or_create(follower=request.user, following=target)
    if not created:
        follow.delete()
        return Response({'following': False, 'followers_count': target.followers.count()})
    return Response({'following': True, 'followers_count': target.followers.count()})


# ─── PROFILE SOCIAL ─────────────────────────────────────

class UserSocialProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSocialSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'
