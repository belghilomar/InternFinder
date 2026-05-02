from django.urls import path
from . import views

urlpatterns = [
    path('api/offers/', views.InternshipListAPIView.as_view(), name='api_offers'),
    path('api/offers/<int:pk>/', views.InternshipDetailAPIView.as_view(), name='api_detail'),
    path('api/status/', views.ScrapingStatusAPIView.as_view(), name='api_status'),
    path('api/matching/', views.MatchingAPIView.as_view(), name='api_matching'),
    path('api/resources/', views.ResourcesAPIView.as_view(), name='api_resources'),
    path('api/ai/chat/', views.AIChatAPIView.as_view(), name='api_ai_chat'),
    path('api/ai/analyze-cv/', views.CVAnalysisAPIView.as_view(), name='api_ai_cv'),
    path('api/ai/branding/', views.AIBrandingAPIView.as_view(), name='api_ai_branding'),
    path('api/ai/cover-letter/', views.AICoverLetterAPIView.as_view(), name='api_ai_letter'),
    
    path('', views.index, name='index'),
    path('search/', views.search, name='search'),
    path('saved/', views.saved_offers, name='saved_offers'),
    path('results/<str:keyword>/<str:location>/', views.results, name='results'),
    path('offer/<int:offer_id>/', views.offer_detail, name='offer_detail'),
    path('export-csv/<str:keyword>/', views.export_csv, name='export_csv'),
]
