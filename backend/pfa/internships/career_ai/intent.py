from __future__ import annotations

from dataclasses import dataclass, field
import re
import unicodedata
from typing import Any, Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class IntentResult:
    name: str
    confidence: float
    matched_terms: List[str] = field(default_factory=list)
    language: str = "en"
    slots: Dict[str, Any] = field(default_factory=dict)
    guide_requested: bool = False


INTENT_RULES: Dict[str, Tuple[str, ...]] = {
    "internship_search": (
        "stage", "internship", "pfe", "traineeship", "find internship",
        "looking for internship", "application", "apply", "recruiter",
        "opportunity", "alternance", "summer internship",
    ),
    "cv_review": (
        "cv", "resume", "curriculum", "ats", "bullet", "experience",
        "cover letter", "motivation letter", "lettre", "portfolio",
    ),
    "interview_prep": (
        "interview", "entretien", "mock", "question", "star method",
        "technical interview", "hr interview", "tell me about yourself",
    ),
    "offer_analysis": (
        "job offer", "offer", "description", "requirements", "missions",
        "responsibilities", "understand this", "analyse this", "analyze this",
    ),
    "job_market": (
        "market", "salary", "stipend", "pay", "demand", "trend",
        "skills to learn", "career path", "roadmap", "learn", "stack",
    ),
    "personal_branding": (
        "linkedin", "brand", "branding", "headline", "about section",
        "profile", "self branding", "personal pitch", "bio",
    ),
}

FIELD_RULES: Dict[str, Tuple[str, ...]] = {
    "software engineering": (
        "software", "developer", "developpeur", "web", "frontend", "backend",
        "full stack", "full-stack", "react", "next", "node", "python", "java",
        "django", "spring", "mobile", "flutter", "informatique", "it",
    ),
    "data and AI": (
        "data", "ai", "ia", "machine learning", "ml", "deep learning",
        "analytics", "business intelligence", "bi", "python", "sql", "power bi",
    ),
    "cybersecurity": (
        "security", "cyber", "cybersecurity", "securite", "soc", "network",
        "pentest", "linux", "cloud security",
    ),
    "marketing and communication": (
        "marketing", "communication", "social media", "content", "seo", "brand",
        "community manager", "digital marketing",
    ),
    "finance and accounting": (
        "finance", "accounting", "comptabilite", "audit", "bank", "banking",
        "excel", "analysis", "financial",
    ),
    "mechanical and electrical engineering": (
        "mechanical", "mecanique", "electrical", "electrique", "mechatronics",
        "mecatronique", "automatisme", "industrial", "maintenance",
    ),
}

LOCATION_RULES: Tuple[str, ...] = (
    "tunisia", "tunisie", "tunis", "sfax", "sousse", "ariana", "ben arous",
    "nabeul", "monastir", "bizerte", "gabes", "remote", "hybrid", "distance",
)

LEVEL_RULES: Dict[str, Tuple[str, ...]] = {
    "PFE": ("pfe", "final year", "projet de fin", "graduation project"),
    "master": ("master", "m1", "m2", "graduate"),
    "engineering": ("engineering", "ingenieur", "cycle ingenieur", "engineer"),
    "licence": ("licence", "bachelor", "undergraduate"),
    "entry level": ("entry", "junior", "first job", "debutant"),
}

GUIDE_TERMS: Tuple[str, ...] = (
    "guide", "step by step", "help me", "i want", "je veux", "show me how",
    "where do i start", "start", "plan", "roadmap",
)


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    without_accents = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", without_accents.lower()).strip()


def _contains_term(normalized: str, term: str) -> bool:
    term = normalize_text(term)
    if not term:
        return False
    if len(term) <= 3 or " " not in term:
        return bool(re.search(rf"(?<!\w){re.escape(term)}(?!\w)", normalized))
    return term in normalized


def _matched_terms(normalized: str, terms: Iterable[str]) -> List[str]:
    return [term for term in terms if _contains_term(normalized, term)]


def detect_language(message: str, normalized: str) -> str:
    french_markers = (
        " je ", "j'", "mon ", "ma ", "mes ", "stage", "entretien",
        "lettre", "tunisie", "ingenieur", "licence", "ecole",
    )
    padded = f" {normalized} "
    return "fr" if any(marker in padded for marker in french_markers) else "en"


def extract_slots(message: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
    context = context or {}
    normalized = normalize_text(message)
    slots: Dict[str, Any] = {}

    user = context.get("user") if isinstance(context.get("user"), dict) else {}
    memory = context.get("memory") if isinstance(context.get("memory"), dict) else {}

    if memory.get("field"):
        slots["field"] = memory["field"]
    if user.get("field") and not slots.get("field"):
        slots["field"] = user["field"]

    for field_name, terms in FIELD_RULES.items():
        if _matched_terms(normalized, terms):
            slots["field"] = field_name
            break

    skills = []
    for source in (memory.get("skills"), user.get("skills")):
        if isinstance(source, list):
            skills.extend(str(skill).strip() for skill in source if str(skill).strip())
    if skills:
        slots["skills"] = sorted(set(skills), key=str.lower)[:8]

    for location in LOCATION_RULES:
        if _contains_term(normalized, location):
            slots["location"] = location.title() if location not in {"remote", "hybrid"} else location
            break
    if memory.get("location") and not slots.get("location"):
        slots["location"] = memory["location"]

    for level, terms in LEVEL_RULES.items():
        if _matched_terms(normalized, terms):
            slots["level"] = level
            break
    if memory.get("level") and not slots.get("level"):
        slots["level"] = memory["level"]

    if _contains_term(normalized, "remote") or _contains_term(normalized, "distance"):
        slots["work_mode"] = "remote"
    elif _contains_term(normalized, "hybrid") or _contains_term(normalized, "mixte"):
        slots["work_mode"] = "hybrid"

    return slots


def detect_intent(message: str, context: Dict[str, Any] | None = None) -> IntentResult:
    stripped = (message or "").strip()
    normalized = normalize_text(stripped)
    language = detect_language(stripped, normalized)
    slots = extract_slots(stripped, context)

    if not stripped:
        return IntentResult("empty", 1.0, language=language, slots=slots)

    scores: Dict[str, int] = {}
    matches: Dict[str, List[str]] = {}
    for intent_name, terms in INTENT_RULES.items():
        intent_matches = _matched_terms(normalized, terms)
        if intent_matches:
            scores[intent_name] = len(intent_matches)
            matches[intent_name] = intent_matches

    if not scores:
        if any(slot in slots for slot in ("field", "skills", "level", "location")):
            selected = "internship_search"
            score = 1
            selected_matches = []
        else:
            selected = "general_career"
            score = 0
            selected_matches = []
    else:
        selected = max(scores, key=scores.get)
        score = scores[selected]
        selected_matches = matches[selected]

    guide_requested = bool(_matched_terms(normalized, GUIDE_TERMS))
    short_stage_request = selected == "internship_search" and len(normalized.split()) <= 6
    confidence = min(0.98, 0.48 + (score * 0.16)) if selected != "general_career" else 0.35

    return IntentResult(
        name=selected,
        confidence=confidence,
        matched_terms=selected_matches,
        language=language,
        slots=slots,
        guide_requested=guide_requested or short_stage_request,
    )


def missing_slots_for(intent_name: str, memory: Dict[str, Any]) -> List[str]:
    if intent_name != "internship_search":
        return []

    required = [
        ("field", "your field or specialty"),
        ("location", "preferred location or remote option"),
        ("level", "your level, for example PFE, licence, master, or engineering"),
    ]
    return [label for key, label in required if not memory.get(key)]
