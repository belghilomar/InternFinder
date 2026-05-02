from django.contrib import admin
from .models import InternshipOffer, SearchHistory

@admin.register(InternshipOffer)
class InternshipOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'date_posted', 'search_keyword', 'created_at')
    list_filter = ('location', 'search_keyword', 'created_at')
    search_fields = ('title', 'company')

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('keyword', 'location', 'results_count', 'searched_at')
    list_filter = ('location', 'searched_at')
    search_fields = ('keyword',)
