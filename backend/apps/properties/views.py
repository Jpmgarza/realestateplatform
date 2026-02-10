from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Property, PropertyImage
from .serializers import PropertySerializer, PropertyCreateSerializer, PropertyImageSerializer


class PropertyListCreateView(generics.ListCreateAPIView):
    queryset = Property.objects.filter(is_published=True).prefetch_related('images', 'owner__profile')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['property_type', 'transaction_type', 'city', 'country']
    search_fields = ['title', 'description', 'city', 'address']
    ordering_fields = ['price', 'created_at', 'surface_area']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateSerializer
        return PropertySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        bedrooms_min = self.request.query_params.get('bedrooms_min')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if bedrooms_min:
            qs = qs.filter(bedrooms__gte=bedrooms_min)
        return qs


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Property.objects.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PropertyCreateSerializer
        return PropertySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner != request.user:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_property_image(request, pk):
    try:
        property_obj = Property.objects.get(pk=pk, owner=request.user)
    except Property.DoesNotExist:
        return Response({'error': 'Bien introuvable'}, status=404)

    images = request.FILES.getlist('images')
    if not images:
        return Response({'error': 'Aucune image fournie'}, status=400)

    created = []
    for i, img in enumerate(images):
        is_cover = (i == 0 and not property_obj.images.filter(is_cover=True).exists())
        pi = PropertyImage.objects.create(property=property_obj, image=img, is_cover=is_cover, order=i)
        created.append(PropertyImageSerializer(pi).data)

    return Response(created, status=status.HTTP_201_CREATED)
