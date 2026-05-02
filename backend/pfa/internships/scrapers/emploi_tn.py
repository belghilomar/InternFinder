"""Emploi.tn Tunisian job board scraper."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class EmploiTnScraper(BaseScraper):
    name = "emploi_tn"
    base_delay = 1.5
    max_results = 25
    BASE_URL = "https://www.emploi.tn"
    verify_ssl = False

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        search_keyword = keyword.replace(" ", "+")
        seen_urls: set = set()
        all_offers = []

        for page in range(1, 4):  # Fetch 3 pages
            params = {"q": keyword}
            if location and location.lower() not in ("tunisie", "tunisia", ""):
                params["l"] = location
            if page > 1:
                params["p"] = page

            url = f"{self.BASE_URL}/offres-emploi?" + urllib.parse.urlencode(params)
            
            try:
                html_text = await self._fetch_text(url)
                soup = BeautifulSoup(html_text, "lxml")
                job_cards = soup.select("div.job-listing, article.job, div.job-item, div.offre, li.offre-item")
                
                if not job_cards:
                    break
                
                page_count = 0
                for card in job_cards:
                    try:
                        title_el = card.select_one("h2, h3, a[class*='title']")
                        if not title_el: continue
                        title = clean_html_text(title_el.get_text())
                        link_el = card.select_one("a[href]")
                        href = link_el["href"] if link_el else ""
                        if href.startswith("/"): href = f"{self.BASE_URL}{href}"
                        
                        if href in seen_urls: continue
                        seen_urls.add(href)
                        
                        loc_el = card.select_one(".location, .lieu, span[class*='location'], i.fa-map-marker + span")
                        loc = clean_html_text(loc_el.get_text()) if loc_el else ""
                        if not loc or loc.lower() == "tunisie":
                            card_text = card.get_text()
                            for city in ["Ariana", "Sousse", "Sfax", "Nabeul", "Bizerte", "Ben Arous", "Manouba", "Monastir", "Gafsa"]:
                                if city in card_text:
                                    loc = city
                                    break
                            if not loc: loc = location or "Tunis"
                        
                        date_el = card.select_one(".date, time, span[class*='date'], i.fa-calendar + span, .posted")
                        date_val = clean_html_text(date_el.get_text()) if date_el else "Recently"
                        if "aujourd'hui" in card.get_text().lower(): date_val = "Today"

                        all_offers.append(make_offer_dict(
                            titre=title,
                            societe=clean_html_text(card.select_one(".company, .employer").get_text()) if card.select_one(".company, .employer") else "Confidential",
                            localisation=loc,
                            date=date_val,
                            description="",
                            url=href,
                            source="emploi_tn",
                        ))
                        page_count += 1
                    except: continue
                
                if page_count == 0: break
                logger.info("Emploi.tn page %d: found %d offers", page, page_count)

            except Exception as e:
                logger.warning("Emploi.tn page %d failed: %s", page, e)
                break

        return all_offers
