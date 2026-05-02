"""LinkedIn job discovery via Google search scraping."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class GoogleDiscoveryScraper(BaseScraper):
    name = "google_discovery"
    base_delay = 3.0
    max_results = 20

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        location_part = f' "{location}"' if location else ""
        queries = [
            f'site:linkedin.com/jobs "{keyword}"{location_part} internship',
            f'"{keyword}" "stage" tunisie site:*.com -site:linkedin.com -site:facebook.com',
            f'"{keyword}" "recrutement" tunisie site:*.tn',
        ]
        
        offers = []
        for query in queries[:2]: # Limit to 2 queries per search to be polite
            params = {"q": query, "num": "15", "hl": "fr"}
            url = "https://www.google.com/search?" + urllib.parse.urlencode(params)
            
            try:
                html_text = await self._fetch_text(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
                soup = BeautifulSoup(html_text, "lxml")
                results = soup.select("div.g, div[data-hveid]")

                for result in results[: self.max_results]:
                    try:
                        link_el = result.select_one("a[href]")
                        if not link_el:
                            continue

                        href = link_el.get("href", "")
                        if "/url?q=" in href:
                            match = re.search(r"/url\?q=([^&]+)", href)
                            if match:
                                href = urllib.parse.unquote(match.group(1))
                        
                        if not href or "google.com" in href or not href.startswith("http"):
                            continue

                        title_el = result.select_one("h3")
                        raw_title = clean_html_text(title_el.get_text()) if title_el else ""
                        if not raw_title or len(raw_title) < 5:
                            continue

                        title = re.sub(r"\s*[\|–-]\s*LinkedIn.*$", "", raw_title).strip()
                        parts = re.split(r"\s*[\|–-]\s*", title, maxsplit=1)
                        job_title = parts[0].strip() if parts else title
                        company = parts[1].strip() if len(parts) > 1 else ""

                        snippet_el = result.select_one(
                            "div.VwiC3b, span.aCOpRe, div[data-sncf]"
                        )
                        snippet = clean_html_text(snippet_el.get_text()) if snippet_el else ""

                        loc = ""
                        loc_match = re.search(
                            r"(?:in|à|location[:\s]+)\s*([A-Z][a-zA-Zéèêë\s,]+?)(?:\s*[-–·]|\s*$)",
                            snippet,
                        )
                        if loc_match:
                            loc = loc_match.group(1).strip()

                        source_name = "linkedin" if "linkedin.com" in href else "discovery"
                        
                        offers.append(make_offer_dict(
                            titre=job_title,
                            societe=company,
                            localisation=loc or location,
                            date="",
                            description=snippet,
                            url=href,
                            source=source_name,
                        ))

                    except Exception:
                        continue

            except Exception as inner_e:
                logger.warning("Discovery query failed for '%s': %s", query, inner_e)
                continue

        logger.info("Google Discovery scraper found %d total offers for keyword=%s", len(offers), keyword)
        return offers
