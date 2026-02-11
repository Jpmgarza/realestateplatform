import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Availability(models.Model):
    """Plages de disponibilité définies par le propriétaire."""
    linked_property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='availabilities'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    min_nights = models.IntegerField(default=1)
    max_nights = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['start_date']
        verbose_name_plural = 'availabilities'

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("La date de fin doit être après la date de début")

    def __str__(self):
        return f"{self.linked_property.title}: {self.start_date} - {self.end_date}"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('paid', 'Payée'),
        ('cancelled', 'Annulée'),
        ('completed', 'Terminée'),
        ('refunded', 'Remboursée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    linked_property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='reservations'
    )
    guest = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reservations_as_guest'
    )
    host = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reservations_as_host'
    )
    check_in = models.DateField()
    check_out = models.DateField()
    guests_count = models.IntegerField(default=1)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(max_length=500, blank=True, help_text="Message au propriétaire")
    stripe_payment_intent = models.CharField(max_length=255, blank=True)
    stripe_session_id = models.CharField(max_length=255, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def clean(self):
        if self.check_in and self.check_out and self.check_in >= self.check_out:
            raise ValidationError("Le check-out doit être après le check-in")

    @property
    def nights(self):
        if self.check_in and self.check_out:
            return (self.check_out - self.check_in).days
        return 0

    def __str__(self):
        return f"{self.guest.username} @ {self.linked_property.title} ({self.check_in} - {self.check_out})"


class BlockedDate(models.Model):
    """Dates bloquées manuellement par le propriétaire."""
    linked_property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name='blocked_dates'
    )
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ('linked_property', 'date')
        ordering = ['date']
