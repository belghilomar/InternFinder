from __future__ import annotations

from typing import Any, Dict, Iterable, List

from django.db.models import Q

from internships.models import InternshipOffer


class InternshipRetriever:
    def find_relevant_offers(self, memory: Dict[str, Any], limit: int = 3) -> List[Dict[str, Any]]:
        terms = self._query_terms(memory)
        location = str(memory.get("location") or "").strip().lower()

        try:
            queryset = InternshipOffer.objects.all()
            query = Q()
            for term in terms:
                query |= (
                    Q(title__icontains=term)
                    | Q(description__icontains=term)
                    | Q(domain__icontains=term)
                    | Q(search_keyword__icontains=term)
                )

            if query:
                queryset = queryset.filter(query).distinct()

            if location and location not in {"tunisia", "tunisie", "remote", "hybrid"}:
                queryset = queryset.filter(location__icontains=location)

            offers = queryset.order_by("-created_at")[:limit]
            return [self._serialize_offer(offer, terms) for offer in offers]
        except Exception:
            return []

    def _query_terms(self, memory: Dict[str, Any]) -> List[str]:
        raw_terms: List[str] = []
        field = str(memory.get("field") or "").strip()
        if field:
            raw_terms.extend(field.replace("and", " ").split())

        for skill in memory.get("skills") or []:
            raw_terms.append(str(skill))

        if not raw_terms:
            raw_terms.extend(["stage", "internship"])

        return self._unique_terms(raw_terms)[:8]

    def _unique_terms(self, terms: Iterable[str]) -> List[str]:
        seen = set()
        clean_terms: List[str] = []
        stop_words = {"and", "or", "the", "for", "de", "du", "des", "et", "a", "an"}
        for term in terms:
            normalized = str(term).strip().lower()
            if len(normalized) < 2 or normalized in stop_words or normalized in seen:
                continue
            seen.add(normalized)
            clean_terms.append(normalized)
        return clean_terms

    def _serialize_offer(self, offer: InternshipOffer, terms: List[str]) -> Dict[str, Any]:
        text = f"{offer.title} {offer.description or ''} {offer.domain or ''}".lower()
        matched = [term for term in terms if term in text]
        score = min(96, 58 + (len(matched) * 12))
        return {
            "id": offer.id,
            "title": offer.title,
            "company": offer.company or "Company not specified",
            "location": offer.location or "Location not specified",
            "url": offer.url,
            "domain": offer.domain or "General",
            "score": score,
            "match_reason": f"Matches: {', '.join(matched[:3])}" if matched else "Recent internship offer from the database.",
        }
