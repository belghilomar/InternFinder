from .scrapers.orchestrator import MultiSourceScraper
import asyncio

class ScraperAdapter:
    """Adapter to use the advanced MultiSourceScraper with Django"""
    
    def __init__(self, headless=True):
        self.orchestrator = MultiSourceScraper()
    
    def search(self, keyword, location="Tunisie"):
        """Perform search using all available sources via the orchestrator"""
        try:
            return self.orchestrator.search_sync(keyword, location)
        except Exception as e:
            print(f"Error in ScraperAdapter: {e}")
            return []
