"""Base scraper class with shared utilities for all source scrapers."""

import asyncio
import logging
import random
import re
import unicodedata
from abc import ABC, abstractmethod

import httpx

logger = logging.getLogger("internships.scrapers")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
]

DEFAULT_TIMEOUT = 10
MAX_RETRIES = 1
RETRY_BACKOFF_BASE = 1.0


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text.lower()).strip()


def clean_html_text(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"</(div|p|li|h\d)>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    import html
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n\s*", "\n", value)
    return value.strip(" \n-")


def compact_spaces(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def detect_domain(title: str, description: str = "") -> str:
    """Infer the professional domain from text keywords with high accuracy."""
    text = (title + " " + description).lower()
    
    if any(k in text for k in ["maintenance", "mécanique", "industriel", "électrique", "automat", "procédé", "génie", "électron", "mécatronique", "civil", "chimie", "production"]):
        return "Engineering"
    
    if any(k in text for k in ["finance", "comptab", "gestion", "audit", "banque", "fiscal", "comptable", "economie", "trésorerie", "bourse"]):
        return "Finance"
    
    if any(k in text for k in ["marketing", "vente", "digital", "social media", "pub", "commerce", "communication", "community", "seo", "e-commerce", "commercial"]):
        return "Marketing"
    
    if any(k in text for k in ["design", "graphique", "ui", "ux", "créa", "adobe", "photoshop", "illustrator", "infograph", "vidéo", "montage"]):
        return "Design"
    
    if any(k in text for k in ["rh", "humaines", "recrutement", "talent", "paie", "management", "ressources", "formation", "coaching"]):
        return "HR"
    
    if any(k in text for k in ["dev", "soft", "web", "data", "cloud", "réseau", "it ", "info", "python", "js", "java", "logiciel", "système", "cyber", "network", "fullstack", "frontend", "backend"]):
        return "IT"
    
    return "Other"


def make_offer_dict(
    titre: str,
    societe: str = "",
    localisation: str = "",
    date: str = "",
    description: str = "",
    url: str = "",
    source: str = "unknown",
) -> dict:
    """Create a standardized offer dictionary matching the legacy format."""
    domain = detect_domain(titre, description)
    return {
        "titre": compact_spaces(titre),
        "societe": compact_spaces(societe),
        "localisation": compact_spaces(localisation),
        "date": compact_spaces(date),
        "description": compact_spaces(description),
        "url": (url or "").strip(),
        "source": source,
        "domaine": domain,
    }


class BaseScraper(ABC):
    """Abstract base scraper with built-in rate limiting, retries, and user-agent rotation."""

    name: str = "base"
    base_delay: float = 1.0    # seconds between requests
    max_results: int = 25
    verify_ssl: bool = True   # toggle SSL verification

    def __init__(self):
        self._last_request_time: float = 0
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {
                "User-Agent": random.choice(USER_AGENTS),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
                "Connection": "keep-alive",
            }
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(DEFAULT_TIMEOUT),
                follow_redirects=True,
                verify=self.verify_ssl,
                headers=headers,
            )
        return self._client

    async def _rate_limit(self):
        now = asyncio.get_event_loop().time()
        elapsed = now - self._last_request_time
        jitter = random.uniform(0.3, 1.0)
        wait_time = max(0, self.base_delay + jitter - elapsed)
        if wait_time > 0:
            await asyncio.sleep(wait_time)
        self._last_request_time = asyncio.get_event_loop().time()

    async def _fetch(self, url: str, **kwargs) -> httpx.Response:
        """Fetch a URL with rate limiting and retries."""
        client = await self._get_client()
        last_error = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                await self._rate_limit()
                response = await client.get(url, **kwargs)
                if response.status_code == 429:
                    wait = RETRY_BACKOFF_BASE ** (attempt + 2)
                    logger.warning(
                        "Rate limited by %s, waiting %.1fs (attempt %d)",
                        self.name, wait, attempt + 1,
                    )
                    await asyncio.sleep(wait)
                    continue
                response.raise_for_status()
                return response
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_error = e
                if attempt < MAX_RETRIES:
                    wait = RETRY_BACKOFF_BASE ** (attempt + 1) + random.uniform(0, 1)
                    logger.warning(
                        "Scraper %s fetch error for %s (attempt %d): %s — retrying in %.1fs",
                        self.name, url, attempt + 1, e, wait,
                    )
                    await asyncio.sleep(wait)

        raise last_error or RuntimeError(f"Failed to fetch {url}")

    async def _fetch_text(self, url: str, **kwargs) -> str:
        """Fetch HTML text."""
        response = await self._fetch(url, **kwargs)
        return response.text

    @abstractmethod
    async def search(self, keyword: str, location: str = "") -> list[dict]:
        """Search for offers. Returns list of offer dicts in legacy format."""
        ...

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
