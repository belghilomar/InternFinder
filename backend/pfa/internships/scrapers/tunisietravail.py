"""TunisieTravail.net — Major Tunisian job board scraper (WordPress-based)."""

import re
import urllib.parse
from bs4 import BeautifulSoup
from .base import BaseScraper, clean_html_text, logger, make_offer_dict


class TunisieTravailScraper(BaseScraper):
    name = "tunisietravail"
    base_delay = 0.5
    max_results = 25
    BASE_URL = "https://www.tunisietravail.net"

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        url = f"{self.BASE_URL}/?s={urllib.parse.quote(keyword)}"
        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")

            headings = soup.select("h2")
            
            tasks = []
            for h2 in headings[:15]:
                link_el = h2.select_one("a[href]")
                if not link_el:
                    continue
                
                title = clean_html_text(link_el.get_text())
                href = link_el.get("href", "")
                
                if not title or len(title) < 6:
                    continue
                if "recrute" not in title.lower() and "offre" not in title.lower() and "stage" not in title.lower():
                    continue

                company = ""
                title_lower = title.lower()
                for sep in [" recrute ", " offre ", " lance ", " recrute : ", " recrute des "]:
                    if sep in title_lower:
                        idx = title_lower.index(sep)
                        company = title[:idx].strip()
                        break
                
                article = h2.find_parent("article") or h2.find_parent("div", class_="post")
                desc = ""
                loc = location
                date_text = ""
                
                if article:
                    desc_el = article.select_one(".entry-content, .entry-summary")
                    desc = clean_html_text(desc_el.get_text()) if desc_el else ""
                    
                    for city in ["Ariana", "Sousse", "Sfax", "Nabeul", "Bizerte", "Ben Arous", "Manouba", "Monastir", "Gafsa", "Tunis"]:
                        if city in desc:
                            loc = city
                            break
                            
                    date_el = article.select_one("time, .entry-date")
                    date_text = clean_html_text(date_el.get_text()) if date_el else ""

                offer = make_offer_dict(
                    titre=title,
                    societe=company,
                    localisation=loc,
                    date=date_text,
                    description=desc[:500] if desc else "",
                    url=href,
                    source="tunisietravail",
                )
                offers.append(offer)

            logger.info("TunisieTravail scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("TunisieTravail scraper failed for keyword=%s: %s", keyword, e)

        return offers
