from django.urls import path
from . import views

urlpatterns = [
    # Disponibilités
    path('properties/<uuid:property_id>/availability/', views.AvailabilityListCreateView.as_view(), name='availability-list'),
    path('availability/<int:pk>/', views.AvailabilityDeleteView.as_view(), name='availability-delete'),

    # Dates bloquées
    path('properties/<uuid:property_id>/blocked/', views.BlockedDateListCreateView.as_view(), name='blocked-dates'),

    # Calendrier
    path('properties/<uuid:property_id>/calendar/', views.property_calendar, name='property-calendar'),

    # Réservations
    path('create/', views.ReservationCreateView.as_view(), name='reservation-create'),
    path('mine/', views.MyReservationsView.as_view(), name='my-reservations'),
    path('hosting/', views.HostReservationsView.as_view(), name='host-reservations'),
    path('<uuid:pk>/', views.ReservationDetailView.as_view(), name='reservation-detail'),
    path('<uuid:reservation_id>/confirm/', views.confirm_reservation, name='confirm-reservation'),
    path('<uuid:reservation_id>/cancel/', views.cancel_reservation, name='cancel-reservation'),

    # Stripe
    path('<uuid:reservation_id>/checkout/', views.create_checkout_session, name='checkout-session'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe-webhook'),
]
