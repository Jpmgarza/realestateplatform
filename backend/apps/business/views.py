from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Business, TeamMember, BusinessReview
from .serializers import (
    BusinessSerializer, BusinessCreateSerializer,
    TeamMemberSerializer, BusinessReviewSerializer,
)


class BusinessListView(generics.ListAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business_type', 'city', 'is_verified']
    search_fields = ['name', 'description', 'city']

    def get_queryset(self):
        return Business.objects.filter(is_active=True).prefetch_related('team_members__user', 'reviews')


class BusinessCreateView(generics.CreateAPIView):
    serializer_class = BusinessCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = serializer.save()
        return Response(
            BusinessSerializer(business).data,
            status=status.HTTP_201_CREATED,
        )


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Business.objects.prefetch_related('team_members__user', 'reviews')

    def update(self, request, *args, **kwargs):
        business = self.get_object()
        if business.owner != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        business = self.get_object()
        if business.owner != request.user:
            return Response({'error': 'Non autorisé'}, status=403)
        return super().destroy(request, *args, **kwargs)


class MyBusinessesView(generics.ListAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Business.objects.filter(owner=self.request.user).prefetch_related('team_members__user', 'reviews')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_team_member(request, business_id):
    try:
        business = Business.objects.get(pk=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business introuvable'}, status=404)

    if business.owner != request.user:
        return Response({'error': 'Non autorisé'}, status=403)

    serializer = TeamMemberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(business=business)
    return Response(serializer.data, status=201)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_team_member(request, business_id, member_id):
    try:
        business = Business.objects.get(pk=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business introuvable'}, status=404)

    if business.owner != request.user:
        return Response({'error': 'Non autorisé'}, status=403)

    try:
        member = TeamMember.objects.get(pk=member_id, business=business)
    except TeamMember.DoesNotExist:
        return Response({'error': 'Membre introuvable'}, status=404)

    if member.role == 'owner':
        return Response({'error': 'Impossible de retirer le propriétaire'}, status=400)

    member.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


class BusinessReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessReviewSerializer

    def get_queryset(self):
        return BusinessReview.objects.filter(business_id=self.kwargs['business_id'])

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, business_id=self.kwargs['business_id'])
