"""M-Stage (m-stage.tn) Tunisian job board scraper."""

import re
import urllib.parse
from bs4 import BeautifulSoup
from .base import BaseScraper, clean_html_text, logger, make_offer_dict

class MStageScraper(BaseScraper):
    name = "mstage"
    base_delay = 2.0
    BASE_URL = "https://m-stage.tn"

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        params = {"s": keyword}
        url = f"{self.BASE_URL}/?" + urllib.parse.urlencode(params)
        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")
            
            cards = soup.select("article, div.post, div.job-item")
            
            for card in cards[:15]:
                title_el = card.select_one("h2, h3, .entry-title")
                if not title_el: continue
                
                title = clean_html_text(title_el.get_text())
                link_el = title_el.select_one("a") or card.select_one("a")
                href = link_el.get("href", "") if link_el else ""
                
                if not title or not href: continue
                
                offers.append(make_offer_dict(
                    titre=title,
                    societe="M-Stage",
                    localisation=location or "Tunisie",
                    date="",
                    description="",
                    url=href,
                    source="mstage"
                ))
            
            logger.info("M-Stage scraper found %d results for '%s'", len(offers), keyword)
        except Exception as e:
            logger.warning("M-Stage scraper failed: %s", e)
            
        return offers
