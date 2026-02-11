import uuid
from django.db import models
from django.contrib.auth.models import User


class Business(models.Model):
    TYPE_CHOICES = [
        ('agency', 'Agence immobilière'),
        ('developer', 'Promoteur'),
        ('notary', 'Notaire'),
        ('architect', 'Architecte'),
        ('contractor', 'Entrepreneur'),
        ('other', 'Autre'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='businesses')
    name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(max_length=2000, blank=True)
    logo = models.ImageField(upload_to='businesses/logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='businesses/covers/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='France')
    siret = models.CharField(max_length=14, blank=True, help_text="Numéro SIRET")
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'businesses'

    def __str__(self):
        return f"{self.name} ({self.get_business_type_display()})"


class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Propriétaire'),
        ('manager', 'Manager'),
        ('agent', 'Agent'),
        ('assistant', 'Assistant'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='team_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent')
    title = models.CharField(max_length=100, blank=True, help_text="Titre du poste")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.business.name} ({self.get_role_display()})"


class BusinessReview(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='business_reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business', 'author')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} - {self.business.name}: {self.rating}/5"
