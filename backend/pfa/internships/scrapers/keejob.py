"""Keejob.com Tunisian/North African job board scraper."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class KeejobScraper(BaseScraper):
    name = "keejob"
    base_delay = 1.5
    max_results = 25
    BASE_URL = "https://www.keejob.com"

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        search_keyword = keyword.replace(" ", "+")
        url = f"{self.BASE_URL}/offres-emploi/?keywords={search_keyword}"
        if location and location.lower() not in ("tunisie", "tunisia", ""):
            url += f"&location={urllib.parse.quote(location)}"

        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")

            job_cards = soup.select(
                "div.block_white_a, div.job-listing, div.offre-emploi, "
                "div[class*='job'], div[class*='offre'], article, "
                "tr.offre, div.result"
            )

            if not job_cards:
                job_cards = soup.select(
                    "a[href*='/offre-emploi/'], a[href*='/job/'], "
                    "a[href*='/offres/']"
                )

            tasks = []
            for card in job_cards[:12]:
                try:
                    title_el = card.select_one(
                        "h2, h3, h4, a[class*='title'], span[class*='title'], "
                        "div.title, a.job-title, td.title"
                    )
                    if not title_el:
                        if card.name == "a":
                            title_el = card
                        else:
                            continue
                    title = clean_html_text(title_el.get_text())
                    
                    links = card.find_all("a", href=True)
                    href = ""
                    for l in links:
                        link_href = l["href"]
                        if "/offres-emploi/" in link_href and "/companies/" not in link_href and any(char.isdigit() for char in link_href):
                            href = link_href
                            break
                    if not href and links:
                        href = links[0]["href"]
                    if href and href.startswith("/"):
                        href = f"{self.BASE_URL}{href}"

                    if not href:
                        continue

                    company_el = card.select_one("a[href*='/companies/'], h4.company, .employer, .span_titre")
                    company = clean_html_text(company_el.get_text()) if company_el else ""

                    location_el = card.select_one(".location, .lieu, span[class*='location'], i.fa-map-marker + span")
                    loc = clean_html_text(location_el.get_text()) if location_el else location

                    date_el = card.select_one(".date, time, .posted, i.fa-calendar + span")
                    date_text = clean_html_text(date_el.get_text()) if date_el else ""

                    desc_el = card.select_one(".description, .excerpt, p, .block_white_a")
                    description = clean_html_text(desc_el.get_text()) if desc_el else ""

                    offer = make_offer_dict(
                        titre=title,
                        societe=company,
                        localisation=loc,
                        date=date_text,
                        description=description[:500] if description else "",
                        url=href,
                        source="keejob",
                    )
                    offers.append(offer)

                except Exception:
                    continue

            logger.info("Keejob scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("Keejob scraper failed for keyword=%s: %s", keyword, e)

        return offers
