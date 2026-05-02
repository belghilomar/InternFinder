"""Google Jobs search-based discovery scraper."""

import re
import urllib.parse

from bs4 import BeautifulSoup

from .base import BaseScraper, clean_html_text, compact_spaces, logger, make_offer_dict


class GoogleJobsScraper(BaseScraper):
    name = "google_jobs"
    base_delay = 2.0
    max_results = 20

    async def search(self, keyword: str, location: str = "") -> list[dict]:
        location_part = f" {location}" if location else ""
        query = f"{keyword} internship OR stage{location_part} jobs"
        params = {"q": query, "ibp": "htl;jobs", "hl": "en"}
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

            job_cards = soup.select(
                "li.iFjolb, div.PwjeAc, div[jscontroller] div[data-vid], "
                "div.gws-plugins-horizon-jobs__tl-lif"
            )

            for card in job_cards[: self.max_results]:
                try:
                    title_el = card.select_one(
                        "div.BjJfJf, div[role='heading'], h2, span.HBvzbc"
                    )
                    title = clean_html_text(title_el.get_text()) if title_el else ""
                    if not title or len(title) < 4:
                        continue

                    company_el = card.select_one(
                        "div.vNEEBe, span.vNEEBe, div.nJlDiv"
                    )
                    company = clean_html_text(company_el.get_text()) if company_el else ""

                    location_el = card.select_one(
                        "div.Qk80Jf, span.Qk80Jf, div[class*='location']"
                    )
                    loc = clean_html_text(location_el.get_text()) if location_el else ""

                    link_el = card.select_one("a[href]")
                    href = link_el.get("href", "") if link_el else ""
                    if href.startswith("/"):
                        href = f"https://www.google.com{href}"

                    date_el = card.select_one(
                        "span.LL4CDc, span[class*='date']"
                    )
                    date_text = clean_html_text(date_el.get_text()) if date_el else ""

                    offers.append(make_offer_dict(
                        titre=title,
                        societe=company,
                        localisation=loc or location,
                        date=date_text,
                        description="",
                        url=href or f"https://www.google.com/search?q={urllib.parse.quote(f'{title} {company} jobs')}",
                        source="google_jobs",
                    ))

                except Exception:
                    continue

            if not offers:
                results = soup.select("div.g, div[data-hveid]")
                for result in results[:15]:
                    try:
                        link_el = result.select_one("a[href]")
                        if not link_el:
                            continue
                        href = link_el.get("href", "")
                        if not href or "google.com" in href:
                            continue

                        title_el = result.select_one("h3")
                        title = clean_html_text(title_el.get_text()) if title_el else ""
                        if not title or len(title) < 5:
                            continue

                        snippet_el = result.select_one("div.VwiC3b, span.aCOpRe")
                        snippet = clean_html_text(snippet_el.get_text()) if snippet_el else ""

                        offers.append(make_offer_dict(
                            titre=title,
                            societe="",
                            localisation=location,
                            date="",
                            description=snippet,
                            url=href,
                            source="google_jobs",
                        ))
                    except Exception:
                        continue

            logger.info("Google Jobs scraper found %d offers for keyword=%s", len(offers), keyword)

        except Exception as e:
            logger.warning("Google Jobs scraper failed for keyword=%s: %s", keyword, e)

        return offers
