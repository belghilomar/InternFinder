from __future__ import annotations

from typing import Any, Dict, List

from .intent import IntentResult


def _as_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _as_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def build_memory(context: Dict[str, Any] | None, intent: IntentResult) -> Dict[str, Any]:
    context = context or {}
    current = dict(_as_dict(context.get("memory")))
    user = _as_dict(context.get("user"))

    if user.get("field") and not current.get("field"):
        current["field"] = user["field"]

    user_skills = [str(skill).strip() for skill in _as_list(user.get("skills")) if str(skill).strip()]
    memory_skills = [str(skill).strip() for skill in _as_list(current.get("skills")) if str(skill).strip()]
    slot_skills = [str(skill).strip() for skill in _as_list(intent.slots.get("skills")) if str(skill).strip()]
    skills = sorted(set(memory_skills + user_skills + slot_skills), key=str.lower)
    if skills:
        current["skills"] = skills[:10]

    for key in ("field", "location", "level", "work_mode"):
        if intent.slots.get(key):
            current[key] = intent.slots[key]

    current["lastIntent"] = intent.name
    current["language"] = intent.language
    return current


def recently_answered(context: Dict[str, Any] | None, intent_name: str) -> bool:
    conversation = _as_list((context or {}).get("conversation"))
    recent_assistant_intents = [
        item.get("intent")
        for item in conversation[-6:]
        if isinstance(item, dict) and item.get("role") == "assistant"
    ]
    return intent_name in recent_assistant_intents
