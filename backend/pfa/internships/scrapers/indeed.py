"""Indeed job search scraper using httpx + BeautifulSoup."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class IndeedScraper(BaseScraper):
    name = "indeed"
    base_delay = 2.0
    max_results = 25

    COUNTRY_DOMAINS = {
        "tunisie": "tn.indeed.com",
        "tunisia": "tn.indeed.com",
        "france": "fr.indeed.com",
        "maroc": "ma.indeed.com",
        "morocco": "ma.indeed.com",
        "canada": "ca.indeed.com",
        "usa": "www.indeed.com",
        "uk": "uk.indeed.com",
        "germany": "de.indeed.com",
        "": "www.indeed.com",
    }

    def _get_domain(self, location: str) -> str:
        normalized = (location or "").strip().lower()
        for key, domain in self.COUNTRY_DOMAINS.items():
            if key and key in normalized:
                return domain
        return "www.indeed.com"

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        domain = self._get_domain(location)
        params = {
            "q": keyword,
            "l": location or "",
            "sort": "date",
            "limit": "25",
        }

        url = f"https://{domain}/jobs?" + urllib.parse.urlencode(params)
        offers = []

        try:
            html_text = await self._fetch_text(url)
            soup = BeautifulSoup(html_text, "lxml")

            job_cards = soup.select(
                "div.job_seen_beacon, div.jobsearch-ResultsList > div, "
                "div[data-jk], li.css-5lfssm, div.resultContent, "
                "td.resultContent, div.slider_container"
            )

            if not job_cards:
                job_cards = soup.select("a[data-jk]")

            for card in job_cards[: self.max_results]:
                try:
                    title_el = card.select_one(
                        "h2.jobTitle a, h2.jobTitle span, a.jcs-JobTitle, "
                        "span[id^='jobTitle'], a[data-jk] span"
                    )
                    title = clean_html_text(title_el.get_text()) if title_el else ""
                    if not title or len(title) < 4:
                        continue

                    link_el = card.select_one(
                        "h2.jobTitle a, a.jcs-JobTitle, a[data-jk]"
                    )
                    href = ""
                    if link_el and link_el.get("href"):
                        href = link_el["href"]
                        if href.startswith("/"):
                            href = f"https://{domain}{href}"

                    company_el = card.select_one(
                        "span.companyName, span[data-testid='company-name'], "
                        "span.css-63koeb, div.company_location span.css-1h7lukg"
                    )
                    company = clean_html_text(company_el.get_text()) if company_el else ""

                    location_el = card.select_one(
                        "div.companyLocation, div[data-testid='text-location'], "
                        "span.css-1p0sjhy"
                    )
                    loc = clean_html_text(location_el.get_text()) if location_el else ""

                    date_el = card.select_one(
                        "span.date, span[data-testid='myJobsStateDate'], "
                        "span.css-qvloho"
                    )
                    date = clean_html_text(date_el.get_text()) if date_el else ""

                    snippet_el = card.select_one(
                        "div.job-snippet, div[class*='job-snippet'], "
                        "td.job-snippet, ul.css-kyg8or"
                    )
                    description = clean_html_text(snippet_el.get_text()) if snippet_el else ""

                    offers.append(make_offer_dict(
                        titre=title,
                        societe=company,
                        localisation=loc or location,
                        date=date,
                        description=description,
                        url=href,
                        source="indeed",
                    ))

                except Exception:
                    continue

            logger.info("Indeed scraper found %d offers for keyword=%s location=%s", len(offers), keyword, location)

        except Exception as e:
            logger.warning("Indeed scraper failed for keyword=%s location=%s: %s", keyword, location, e)

        return offers
