import uuid
from django.db import models
from django.contrib.auth.models import User


class Referral(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('contacted', 'Contacté'),
        ('in_progress', 'En cours'),
        ('completed', 'Complété'),
        ('cancelled', 'Annulé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='referrals_sent',
        help_text="L'apporteur d'affaires"
    )
    referred_to = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='referrals_received',
        help_text="Le professionnel qui reçoit le client"
    )
    client_name = models.CharField(max_length=200)
    client_email = models.EmailField(blank=True)
    client_phone = models.CharField(max_length=20, blank=True)
    linked_property = models.ForeignKey(
        'properties.Property', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='referrals'
    )
    description = models.TextField(
        max_length=1000, blank=True,
        help_text="Description du besoin du client"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.00,
        help_text="Pourcentage de commission"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.referrer.username} -> {self.referred_to.username}: {self.client_name}"


class Commission(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('paid', 'Payée'),
        ('disputed', 'Contestée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral = models.OneToOneField(Referral, on_delete=models.CASCADE, related_name='commission')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Montant total de la transaction"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Commission {self.amount}€ - {self.referral.client_name}"
