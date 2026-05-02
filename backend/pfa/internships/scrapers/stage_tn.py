"""Stage.tn — Tunisian internship/stage platform scraper."""

import urllib.parse
from bs4 import BeautifulSoup
from .base import BaseScraper, clean_html_text, logger, make_offer_dict


class StageTnScraper(BaseScraper):
    name = "stage_tn"
    base_delay = 2.0
    max_results = 25
    BASE_URL = "https://www.stage.tn"

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        params = {"q": keyword}
        if location and location.lower() not in ("tunisie", "tunisia", ""):
            params["location"] = location
        url = f"{self.BASE_URL}/offres-de-stage?" + urllib.parse.urlencode(params)
        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")

            cards = soup.select(
                "div.job-listing, div.stage-card, div.offre-card, "
                "article, div.card, div[class*='offre'], div[class*='stage'], "
                "div.listing-item, li.listing-item"
            )

            if not cards:
                cards = soup.select("a[href*='/offre'], a[href*='/stage']")

            for card in cards[:self.max_results]:
                try:
                    title_el = card.select_one(
                        "h2, h3, h4, .title, a[class*='title'], "
                        "div[class*='title'], span[class*='title']"
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
                        "span[class*='entreprise'], div[class*='entreprise']"
                    )
                    company = clean_html_text(company_el.get_text()) if company_el else ""

                    loc_el = card.select_one(
                        "span[class*='location'], span[class*='lieu'], "
                        "div[class*='location'], div[class*='lieu']"
                    )
                    loc = clean_html_text(loc_el.get_text()) if loc_el else ""

                    date_el = card.select_one(
                        "span[class*='date'], time, div[class*='date']"
                    )
                    date_text = clean_html_text(date_el.get_text()) if date_el else ""

                    offers.append(make_offer_dict(
                        titre=title,
                        societe=company or "Stage.tn",
                        localisation=loc or location or "Tunisie",
                        date=date_text,
                        description="",
                        url=href,
                        source="stage_tn",
                    ))

                except Exception:
                    continue

            logger.info("Stage.tn scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("Stage.tn scraper failed for keyword=%s: %s", keyword, e)

        return offers
