"""TanitJobs.com Tunisian job board scraper."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class TanitJobsScraper(BaseScraper):
    name = "tanitjobs"
    base_delay = 1.5
    max_results = 25
    BASE_URL = "https://www.tanitjobs.com"
    verify_ssl = False

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        params = {"keywords": keyword}
        if location and location.lower() not in ("tunisie", "tunisia", ""):
            params["location"] = location

        url = f"{self.BASE_URL}/search/?" + urllib.parse.urlencode(params)
        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")

            job_cards = soup.select(
                "div.job-listing, div.job-item, article.job, "
                "div[class*='job'], div[class*='offre'], li[class*='job'], "
                "div.listing-item, div.result-item"
            )

            if not job_cards:
                job_cards = soup.select(
                    "a[href*='/offre/'], a[href*='/job/'], a[href*='/emploi/']"
                )

            for card in job_cards[: self.max_results]:
                try:
                    title_el = card.select_one(
                        "h2, h3, h4, a[class*='title'], span[class*='title'], "
                        "div[class*='title'], a.job-title"
                    )
                    if not title_el:
                        if card.name == "a":
                            title_el = card
                        else:
                            continue

                    title = clean_html_text(title_el.get_text())
                    if not title or len(title) < 4:
                        continue

                    link_el = card.select_one("a[href]") if card.name != "a" else card
                    href = ""
                    if link_el and link_el.get("href"):
                        href = link_el["href"]
                        if href.startswith("/"):
                            href = f"{self.BASE_URL}{href}"

                    company_el = card.select_one(
                        "span[class*='company'], div[class*='company'], "
                        "span[class*='societe'], span.employer"
                    )
                    company = clean_html_text(company_el.get_text()) if company_el else ""

                    loc_el = card.select_one(".location, .lieu, span[class*='location'], i.fa-map-marker + span, .listing-location")
                    loc = clean_html_text(loc_el.get_text()) if loc_el else ""
                    
                    date_el = card.select_one(".date, time, span[class*='date'], i.fa-calendar + span, .listing-date")
                    date_text = clean_html_text(date_el.get_text()) if date_el else ""

                    desc_el = card.select_one(".job-description, .description, p, div[class*='desc']")
                    desc = clean_html_text(desc_el.get_text()) if desc_el else ""

                    offers.append(make_offer_dict(
                        titre=title,
                        societe=company or "Confidential",
                        localisation=loc or location or "Tunis, TN",
                        date=date_text,
                        description=desc,
                        url=href,
                        source="tanitjobs",
                    ))

                except Exception:
                    continue

            logger.info("TanitJobs scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("TanitJobs scraper failed for keyword=%s: %s", keyword, e)

        return offers
