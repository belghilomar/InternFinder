"""Glassdoor job search scraper."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class GlassdoorScraper(BaseScraper):
    name = "glassdoor"
    base_delay = 2.5
    max_results = 20

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        location_part = f' "{location}"' if location else ""
        query = f'site:glassdoor.com "{keyword}"{location_part} internship OR stage job'
        params = {"q": query, "num": "15", "hl": "en"}
        url = "https://www.google.com/search?" + urllib.parse.urlencode(params)

        offers = []

        try:
            html_text = await self._fetch_text(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
            )
            soup = BeautifulSoup(html_text, "lxml")
            results = soup.select("div.g, div[data-hveid]")

            for result in results[: self.max_results]:
                try:
                    link_el = result.select_one("a[href*='glassdoor.com']")
                    if not link_el:
                        continue

                    href = link_el.get("href", "")
                    if "glassdoor.com" not in href:
                        continue
                    if "/job-listing/" not in href and "/job/" not in href and "/Jobs/" not in href:
                        continue

                    title_el = result.select_one("h3")
                    raw_title = clean_html_text(title_el.get_text()) if title_el else ""
                    if not raw_title or len(raw_title) < 5:
                        continue

                    title = re.sub(r"\s*[\|–-]\s*Glassdoor.*$", "", raw_title).strip()
                    parts = re.split(r"\s*[\|–-]\s*", title, maxsplit=1)
                    job_title = parts[0].strip() if parts else title
                    company = parts[1].strip() if len(parts) > 1 else ""

                    snippet_el = result.select_one("div.VwiC3b, span.aCOpRe")
                    snippet = clean_html_text(snippet_el.get_text()) if snippet_el else ""

                    offers.append(make_offer_dict(
                        titre=job_title,
                        societe=company,
                        localisation=location,
                        date="",
                        description=snippet,
                        url=href,
                        source="glassdoor",
                    ))

                except Exception:
                    continue

            logger.info("Glassdoor scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("Glassdoor scraper failed for keyword=%s: %s", keyword, e)

        return offers
