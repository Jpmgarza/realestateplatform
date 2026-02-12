from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.social.models import Post


class Command(BaseCommand):
    help = 'Publie automatiquement les posts programmés dont la date est passée'

    def handle(self, *args, **options):
        now = timezone.now()
        posts = Post.objects.filter(status='scheduled', scheduled_at__lte=now)
        count = posts.count()
        posts.update(status='published', scheduled_at=None)
        self.stdout.write(self.style.SUCCESS(f'{count} post(s) publié(s)'))
