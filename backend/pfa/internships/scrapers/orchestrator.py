"""Multi-source scraper orchestrator — runs all scrapers in parallel and deduplicates."""

import asyncio
import logging
import re
import unicodedata

from .base import BaseScraper, normalize_text, compact_spaces
from .google_discovery import GoogleDiscoveryScraper
from .google_jobs import GoogleJobsScraper
from .glassdoor import GlassdoorScraper
from .emploi_tn import EmploiTnScraper
from .keejob import KeejobScraper
from .tanitjobs import TanitJobsScraper
from .tunisietravail import TunisieTravailScraper

logger = logging.getLogger("internships.scrapers")


def _normalize_url(url: str) -> str:
    """Normalize a URL for deduplication purposes."""
    if not url:
        return ""
    url = url.strip().rstrip("/")
    url = re.sub(r"^https?://(?:www\.)?", "", url)
    url = re.sub(r"[?#].*$", "", url)
    return url.lower()


def _dedupe_key(offer: dict) -> str:
    """Build a deduplication key from offer data."""
    url_key = _normalize_url(offer.get("url", ""))
    title_key = normalize_text(offer.get("titre", ""))
    company_key = normalize_text(offer.get("societe", ""))

    if url_key:
        return url_key

    return f"{title_key}||{company_key}"


def _compute_relevance_score(offer: dict, keyword: str, location: str) -> float:
    """Compute a relevance score (0-100) for ranking results."""
    score = 40.0  # base score
    kw = normalize_text(keyword)
    loc = normalize_text(location)
    title = normalize_text(offer.get("titre", ""))
    company = normalize_text(offer.get("societe", ""))
    description = normalize_text(offer.get("description", ""))
    offer_loc = normalize_text(offer.get("localisation", ""))

    if not kw:
        return score

    if kw in title:
        score += 25
    else:
        kw_tokens = kw.split()
        matched = sum(1 for t in kw_tokens if t in title)
        if kw_tokens:
            score += 20 * (matched / len(kw_tokens))

    if kw in description:
        score += 10
    else:
        kw_tokens = kw.split()
        matched = sum(1 for t in kw_tokens if t in description)
        if kw_tokens:
            score += 8 * (matched / len(kw_tokens))

    if loc and loc in offer_loc:
        score += 10
    elif loc:
        loc_tokens = loc.split()
        matched = sum(1 for t in loc_tokens if t in offer_loc)
        if loc_tokens:
            score += 5 * (matched / len(loc_tokens))

    internship_terms = ("stage", "stagiaire", "intern", "internship", "pfe", "trainee")
    haystack = f"{title} {description}"
    if any(term in haystack for term in internship_terms):
        score += 5

    return min(100, max(0, round(score, 1)))


class MultiSourceScraper:
    """Orchestrates multiple scrapers in parallel with deduplication."""

    def __init__(self):
        self.scrapers: list[BaseScraper] = [
            KeejobScraper(),          # ~15 results, 3s
            TunisieTravailScraper(),  # ~14 results, 2s
        ]

    async def search_all(
        self,
        keyword: str,
        location: str = "",
        on_offer=None,
        fast: bool = False,
    ) -> list[dict]:
        """Run all scrapers in parallel, deduplicate, and rank results."""

        if fast:
            active_scrapers = [s for s in self.scrapers if s.base_delay <= 2.0]
        else:
            active_scrapers = self.scrapers

        async def run_scraper(scraper: BaseScraper) -> list[dict]:
            try:
                results = await asyncio.wait_for(
                    scraper.search(keyword, location),
                    timeout=12,
                )
                logger.info(
                    "Scraper %s returned %d results for keyword=%s",
                    scraper.name, len(results), keyword,
                )
                return results
            except asyncio.TimeoutError:
                logger.warning("Scraper %s timed out for keyword=%s", scraper.name, keyword)
                return []
            except Exception as e:
                logger.warning("Scraper %s failed for keyword=%s: %s", scraper.name, keyword, e)
                return []
            finally:
                await scraper.close()

        tasks = [run_scraper(s) for s in active_scrapers]
        all_results = await asyncio.gather(*tasks, return_exceptions=False)

        seen_keys: set[str] = set()
        deduped_offers: list[dict] = []

        for source_results in all_results:
            for offer in source_results:
                key = _dedupe_key(offer)
                if key in seen_keys:
                    continue
                seen_keys.add(key)

                offer["_relevance"] = _compute_relevance_score(offer, keyword, location)
                deduped_offers.append(offer)

                if on_offer:
                    try:
                        on_offer(dict(offer))
                    except Exception:
                        pass

        deduped_offers.sort(
            key=lambda o: (
                o.get("discovered_at", ""), # This should be set in views.py but we handle it here if present
                o.get("_relevance", 0),
                o.get("date", ""),
            ),
            reverse=True
        )

        for offer in deduped_offers:
            offer.pop("_relevance", None)

        logger.info(
            "MultiSourceScraper: %d unique offers from %d sources for keyword=%s location=%s",
            len(deduped_offers),
            len(active_scrapers),
            keyword,
            location,
        )

        return deduped_offers

    def search_sync(
        self,
        keyword: str,
        location: str = "",
        on_offer=None,
        fast: bool = False,
    ) -> list[dict]:
        """Synchronous wrapper for search_all — for use in Django's sync views."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(
                        asyncio.run,
                        self.search_all(keyword, location, on_offer=on_offer, fast=fast),
                    )
                    return future.result(timeout=60)
            else:
                return loop.run_until_complete(
                    self.search_all(keyword, location, on_offer=on_offer, fast=fast)
                )
        except RuntimeError:
            return asyncio.run(
                self.search_all(keyword, location, on_offer=on_offer, fast=fast)
            )
