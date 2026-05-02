from django.db import models
from django.utils import timezone

class InternshipOffer(models.Model):
    title = models.CharField(max_length=500, verbose_name="Titre", db_index=True)
    company = models.CharField(max_length=300, blank=True, null=True, verbose_name="Société")
    location = models.CharField(max_length=200, blank=True, null=True, verbose_name="Localisation")
    date_posted = models.CharField(max_length=100, blank=True, null=True, verbose_name="Date de publication")
    url = models.URLField(max_length=1000, verbose_name="URL")
    search_keyword = models.CharField(max_length=200, verbose_name="Mot-clé recherché", db_index=True)
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    domain = models.CharField(max_length=100, blank=True, null=True, verbose_name="Domaine")
    type = models.CharField(max_length=50, blank=True, null=True, verbose_name="Type (Remote/On-site/Hybrid)")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Date de découverte")
    
    class Meta:
        verbose_name = "Offre de stage"
        verbose_name_plural = "Offres de stage"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['search_keyword', '-created_at']),
        ]
    
    def __str__(self):
        return self.title

class SearchHistory(models.Model):
    keyword = models.CharField(max_length=200)
    location = models.CharField(max_length=200, default="Tunisie")
    results_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-searched_at']
    
    def __str__(self):
        return f"{self.keyword} - {self.searched_at.strftime('%Y-%m-%d %H:%M')}"
