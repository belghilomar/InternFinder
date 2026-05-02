from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import InternshipOffer, SearchHistory
from .serializers import InternshipOfferSerializer, SearchHistorySerializer
from .scraper_adapter import ScraperAdapter
from .ai_service import ai_assistant
import csv
import threading
import time

active_scrapes = set()

def _trigger_background_scrape(keyword, location, scrape_key):
    if scrape_key in active_scrapes:
        return
        
    def run_scraper_task():
        try:
            active_scrapes.add(scrape_key)
            adapter = ScraperAdapter(headless=True)
            offers_data = adapter.search(keyword, location)
            
            saved_count = 0
            for item in offers_data:
                if not InternshipOffer.objects.filter(url=item.get('url')).exists():
                    title = item.get('titre', 'N/A')
                    desc = item.get('description', '')
                    domain = item.get('domaine', 'Other')
                    
                    work_type = 'On-site'
                    combined_text = (title + desc).lower()
                    if any(k in combined_text for k in ['tÃ©lÃ©travail', 'remote', 'distance', 'hybrid', 'mixte']):
                        work_type = 'Remote' if 'remote' in combined_text else 'Hybrid'

                    InternshipOffer.objects.create(
                        title=title,
                        company=item.get('societe', 'Confidential'),
                        location=item.get('localisation', location),
                        date_posted=item.get('date', ''),
                        url=item.get('url', ''),
                        search_keyword=keyword,
                        description=desc,
                        domain=domain,
                        type=work_type
                    )
                    saved_count += 1
            
            SearchHistory.objects.update_or_create(
                keyword=keyword,
                location=location,
                defaults={'results_count': saved_count, 'searched_at': timezone.now()}
            )
        except Exception:
            pass
        finally:
            active_scrapes.discard(scrape_key)

    thread = threading.Thread(target=run_scraper_task, daemon=True)
    thread.start()

class InternshipListAPIView(APIView):
    def get(self, request):
        keyword = request.query_params.get('keyword', '').strip()
        location = request.query_params.get('location', 'Tunisie').strip()
        
        if not keyword:
            offers = InternshipOffer.objects.all().order_by('-created_at')[:300]
            serializer = InternshipOfferSerializer(offers, many=True)
            return Response(serializer.data)
        
        offers = InternshipOffer.objects.filter(search_keyword__icontains=keyword)
        scrape_key = f"{keyword}-{location}"
        last_search = SearchHistory.objects.filter(keyword=keyword).first()
        is_stale = not last_search or (timezone.now() - last_search.searched_at).total_seconds() > 900
        
        if is_stale or offers.count() == 0:
            _trigger_background_scrape(keyword, location, scrape_key)
        
        serializer = InternshipOfferSerializer(offers, many=True)
        return Response({
            'results': serializer.data,
            'is_scraping': scrape_key in active_scrapes,
            'count': offers.count()
        })

class ScrapingStatusAPIView(APIView):
    def get(self, request):
        keyword = request.query_params.get('keyword', '').strip()
        location = request.query_params.get('location', 'Tunisie').strip()
        scrape_key = f"{keyword}-{location}"
        
        return Response({
            'is_scraping': scrape_key in active_scrapes,
            'count': InternshipOffer.objects.filter(search_keyword__icontains=keyword).count()
        })

class InternshipDetailAPIView(APIView):
    def get(self, request, pk):
        offer = get_object_or_404(InternshipOffer, pk=pk)
        serializer = InternshipOfferSerializer(offer)
        return Response(serializer.data)

class MatchingAPIView(APIView):
    def post(self, request):
        skills = request.data.get('skills', [])
        domains = request.data.get('domains', [])
        
        if not skills and not domains:
            return Response({"error": "Please provide skills or domains"}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db.models import Q
        
        query = Q()
        for domain in domains:
            query |= Q(title__icontains=domain) | Q(description__icontains=domain)
        for skill in skills[:5]:
            query |= Q(title__icontains=skill) | Q(description__icontains=skill)
            
        offers = InternshipOffer.objects.filter(query).distinct()[:100]
        results = []
        
        for offer in offers:
            score = 0
            full_text = (offer.title + (offer.description or '')).lower()
            if any(domain.lower() in full_text for domain in domains):
                score += 50
            skill_matches = sum(1 for skill in skills if skill.lower() in full_text)
            score += (skill_matches * 10)
            if score > 0:
                results.append({
                    'offer': InternshipOfferSerializer(offer).data,
                    'matchScore': min(score, 100)
                })
        
        results.sort(key=lambda x: x['matchScore'], reverse=True)
        return Response(results[:15])

class ResourcesAPIView(APIView):
    def get(self, request):
        resources = [
            {
                'id': 1,
                'title': 'Standard CV Template â€“ Student Guide',
                'description': 'A professional LaTeX guide and template for building high-quality student CVs. Perfect for Overleaf.',
                'category': 'CV',
                'type': 'template',
                'is_premium': False,
                'file_url': '/media/resources/cv_guide.tex'
            },
            {
                'id': 2,
                'title': 'Executive Professional CV',
                'description': 'Advanced multi-page template with deep optimization for tech industries.',
                'category': 'CV',
                'type': 'template',
                'is_premium': True,
                'file_url': '/media/templates/cv_premium.docx'
            },
            {
                'id': 3,
                'title': 'The Perfect Motivation Letter',
                'description': 'Step-by-step guide to writing a letter that gets you interviewed.',
                'category': 'Cover Letter',
                'type': 'guide',
                'is_premium': False
            },
            {
                'id': 4,
                'title': 'Cold Email Templates',
                'description': 'Specific email scripts for reaching out to recruiters on LinkedIn.',
                'category': 'Cover Letter',
                'type': 'template',
                'is_premium': True
            },
            {
                'id': 5,
                'title': 'Top 50 Interview Questions',
                'description': 'The most common internship interview questions and how to answer them.',
                'category': 'Interview',
                'type': 'guide',
                'is_premium': False
            },
            {
                'id': 6,
                'title': 'Technical Coding Interview Prep',
                'description': 'Advanced strategies for solving algorithm and system design questions.',
                'category': 'Interview',
                'type': 'guide',
                'is_premium': True
            }
        ]
        return Response(resources)

def export_csv(request, keyword):
    offers = InternshipOffer.objects.filter(search_keyword__icontains=keyword)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="offres_{keyword}.csv"'
    writer = csv.writer(response)
    writer.writerow(['Titre', 'SociÃ©tÃ©', 'Localisation', 'Date', 'URL'])
    for offer in offers:
        writer.writerow([offer.title, offer.company, offer.location, offer.date_posted, offer.url])
    return response

def index(request):
    recent_searches = SearchHistory.objects.all()
    recent_offers = InternshipOffer.objects.all().order_by('-created_at')
    total_offers = InternshipOffer.objects.count()
    total_searches = SearchHistory.objects.count()
    return render(request, 'internships/index.html', {
        'recent_searches': recent_searches,
        'recent_offers': recent_offers,
        'total_offers': total_offers,
        'total_searches': total_searches,
    })

def saved_offers(request):
    offers = InternshipOffer.objects.all().order_by('-created_at')
    return render(request, 'internships/saved_offers.html', {'offers': offers})

def search(request):
    keyword = request.POST.get('keyword', '').strip()
    location = request.POST.get('location', 'Tunisie').strip()
    if not keyword:
        return render(request, 'internships/index.html')
    
    scrape_key = f"{keyword}-{location}"
    if scrape_key not in active_scrapes:
        _trigger_background_scrape(keyword, location, scrape_key)
    
    from django.shortcuts import redirect
    return redirect('results', keyword=keyword, location=location)

def results(request, keyword, location='Tunisie'):
    offers = InternshipOffer.objects.filter(search_keyword__icontains=keyword).order_by('-created_at')
    scrape_key = f"{keyword}-{location}"
    
    if offers.count() == 0:
        _trigger_background_scrape(keyword, location, scrape_key)
    
    is_scraping = scrape_key in active_scrapes
    return render(request, 'internships/results.html', {
        'offers': offers,
        'keyword': keyword,
        'location': location,
        'count': offers.count(),
        'is_scraping': is_scraping,
    })

def offer_detail(request, offer_id):
    offer = get_object_or_404(InternshipOffer, id=offer_id)
    return render(request, 'internships/offer_detail.html', {'offer': offer})


class AIChatAPIView(APIView):
    def post(self, request):
        message = request.data.get('message', '')
        context = request.data.get('context', {})

        if not isinstance(context, dict):
            context = {}

        try:
            response = ai_assistant.generate_chatbot_response(message, context)
            return Response(response)
        except Exception:
            return Response(
                ai_assistant.responses.fallback_response(message),
                status=status.HTTP_200_OK,
            )

class CVAnalysisAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        cv_text = request.data.get('cv_text', '')
        if not cv_text and 'cv_file' in request.FILES:
            cv_text = "Simulated extracted text from PDF..."
        if not cv_text:
            return Response({"error": "CV text or file is required"}, status=status.HTTP_400_BAD_REQUEST)
        analysis = ai_assistant.analyze_cv(cv_text)
        return Response(analysis)

class AIBrandingAPIView(APIView):
    def post(self, request):
        profile = request.data.get('profile', {})
        if not profile:
            return Response({"error": "Profile data is required"}, status=status.HTTP_400_BAD_REQUEST)
        branding = ai_assistant.generate_personal_branding(profile)
        return Response(branding)

class AICoverLetterAPIView(APIView):
    def post(self, request):
        profile = request.data.get('profile', {})
        job_title = request.data.get('job_title', 'Target Position')
        job_desc = request.data.get('job_desc', '')
        if not profile:
            return Response({"error": "Profile data is required"}, status=status.HTTP_400_BAD_REQUEST)
        letter = ai_assistant.generate_cover_letter(profile, job_title, job_desc)
        return Response({"letter": letter})

