from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1
    path('api/', include('apps.users.urls')),
    path('api/properties/', include('apps.properties.urls')),
    path('api/favorites/', include('apps.favorites.urls')),

    # Documentation API (accessible sur /api/docs/)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
