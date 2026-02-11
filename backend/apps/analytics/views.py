from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from .models import PropertyView, ProfileView, SearchLog


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0]
    return request.META.get('REMOTE_ADDR')


@api_view(['POST'])
def track_property_view(request, property_id):
    """Enregistre une vue sur une propriété."""
    PropertyView.objects.create(
        viewed_property_id=property_id,
        viewer=request.user if request.user.is_authenticated else None,
        ip_address=get_client_ip(request),
    )
    return Response({'tracked': True})


@api_view(['POST'])
def track_profile_view(request, user_id):
    """Enregistre une vue sur un profil."""
    ProfileView.objects.create(
        profile_user_id=user_id,
        viewer=request.user if request.user.is_authenticated else None,
    )
    return Response({'tracked': True})


@api_view(['POST'])
def track_search(request):
    """Enregistre une recherche."""
    SearchLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        query=request.data.get('query', ''),
        filters=request.data.get('filters', {}),
        results_count=request.data.get('results_count', 0),
    )
    return Response({'tracked': True})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Statistiques globales du tableau de bord."""
    user = request.user
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    user_properties = user.properties.all()
    property_ids = user_properties.values_list('id', flat=True)

    total_views = PropertyView.objects.filter(viewed_property_id__in=property_ids).count()
    views_this_month = PropertyView.objects.filter(
        viewed_property_id__in=property_ids, viewed_at__gte=month_start
    ).count()
    views_last_month = PropertyView.objects.filter(
        viewed_property_id__in=property_ids,
        viewed_at__gte=last_month_start,
        viewed_at__lt=month_start,
    ).count()

    views_trend = 0
    if views_last_month > 0:
        views_trend = round(((views_this_month - views_last_month) / views_last_month) * 100, 1)

    top_properties = list(
        PropertyView.objects.filter(viewed_property_id__in=property_ids)
        .values('viewed_property_id', 'viewed_property__title')
        .annotate(view_count=Count('id'))
        .order_by('-view_count')[:5]
    )

    from apps.favorites.models import Favorite
    from apps.social.models import Follow

    data = {
        'total_properties': user_properties.filter(is_published=True).count(),
        'total_views': total_views,
        'total_favorites': Favorite.objects.filter(property_id__in=property_ids).count(),
        'total_followers': Follow.objects.filter(following=user).count(),
        'views_this_month': views_this_month,
        'views_last_month': views_last_month,
        'views_trend': views_trend,
        'top_properties': [
            {
                'id': str(p['viewed_property_id']),
                'title': p['viewed_property__title'],
                'views': p['view_count'],
            }
            for p in top_properties
        ],
        'recent_searches': [],
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def property_analytics(request, property_id):
    """Statistiques détaillées d'une propriété."""
    user = request.user

    if not user.properties.filter(id=property_id).exists():
        return Response({'error': 'Non autorisé'}, status=403)

    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    views = PropertyView.objects.filter(viewed_property_id=property_id)
    recent_views = views.filter(viewed_at__gte=thirty_days_ago)

    views_by_day = list(
        recent_views
        .annotate(date=TruncDate('viewed_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )

    from apps.favorites.models import Favorite
    prop = user.properties.get(id=property_id)

    data = {
        'property_id': str(property_id),
        'title': prop.title,
        'total_views': views.count(),
        'unique_viewers': views.values('ip_address').distinct().count(),
        'favorites_count': Favorite.objects.filter(property_id=property_id).count(),
        'views_by_day': [
            {'date': v['date'].isoformat(), 'count': v['count']}
            for v in views_by_day
        ],
    }
    return Response(data)
