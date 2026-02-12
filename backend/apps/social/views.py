from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Post, PostImage, Like, Comment, Follow
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentSerializer,
    FollowSerializer, UserProfileSocialSerializer,
)


def _annotate_posts(qs):
    return qs.annotate(
        likes_count=Count('likes', distinct=True),
        comments_count=Count('comments', distinct=True),
    ).select_related('author__profile').prefetch_related('images', 'comments__user')


# ─── FEED ───────────────────────────────────────────────

class FeedView(generics.ListAPIView):
    """Feed des utilisateurs suivis + ses propres posts (publiés uniquement)."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        following_ids = user.following.values_list('following_id', flat=True)
        return _annotate_posts(
            Post.objects.filter(
                author_id__in=[*following_ids, user.id],
                status='published',
            )
        )


class GlobalFeedView(generics.ListAPIView):
    """Feed global (tous les posts publiés) pour découverte."""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return _annotate_posts(Post.objects.filter(status='published'))


# ─── POSTS ──────────────────────────────────────────────

class PostCreateView(generics.CreateAPIView):
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Upload video
        video_file = request.FILES.get('video')
        if video_file:
            post.video = video_file
            post.media_type = 'video'
            post.save()

        # Upload images
        images = request.FILES.getlist('images')
        for i, img in enumerate(images):
            PostImage.objects.create(post=post, image=img, order=i)

        # Auto-detect media_type if not video
        if not video_file and images:
            post.media_type = 'carousel' if len(images) > 1 else 'image'
            post.save()

        return Response(
            PostSerializer(post, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class PostDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return _annotate_posts(Post.objects.all())

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        return super().destroy(request, *args, **kwargs)


class PostUpdateView(generics.UpdateAPIView):
    """Modifier un post (brouillon ou programmé)."""
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user:
            return Response({'error': 'Non autorisé'}, status=403)

        serializer = self.get_serializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Handle new video
        video_file = request.FILES.get('video')
        if video_file:
            post.video = video_file
            post.media_type = 'video'
            post.save()

        # Handle new images (replace existing)
        images = request.FILES.getlist('images')
        if images:
            post.images.all().delete()
            for i, img in enumerate(images):
                PostImage.objects.create(post=post, image=img, order=i)
            if not video_file:
                post.media_type = 'carousel' if len(images) > 1 else 'image'
                post.save()

        return Response(
            PostSerializer(post, context={'request': request}).data,
        )


class UserPostsView(generics.ListAPIView):
    """Posts publiés d'un utilisateur spécifique."""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return _annotate_posts(
            Post.objects.filter(author_id=self.kwargs['user_id'], status='published')
        )


# ─── DRAFTS ─────────────────────────────────────────────

class DraftListView(generics.ListAPIView):
    """Liste des brouillons de l'utilisateur connecté."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _annotate_posts(
            Post.objects.filter(author=self.request.user, status='draft')
        )


class DraftDeleteView(generics.DestroyAPIView):
    """Supprimer un brouillon."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user, status='draft')


# ─── SCHEDULED ──────────────────────────────────────────

class ScheduledListView(generics.ListAPIView):
    """Liste des posts programmés de l'utilisateur connecté."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _annotate_posts(
            Post.objects.filter(author=self.request.user, status='scheduled')
                .order_by('scheduled_at')
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def publish_post(request, post_id):
    """Publier un brouillon ou un post programmé immédiatement."""
    try:
        post = Post.objects.get(pk=post_id, author=request.user)
    except Post.DoesNotExist:
        return Response({'error': 'Post introuvable'}, status=404)

    if post.status == 'published':
        return Response({'error': 'Déjà publié'}, status=400)

    post.status = 'published'
    post.scheduled_at = None
    post.save()
    return Response(PostSerializer(post, context={'request': request}).data)


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
