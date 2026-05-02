from __future__ import annotations

import time
from typing import Any, Dict

from .intent import detect_intent
from .memory import build_memory, recently_answered
from .responses import CareerResponseBuilder
from .retrieval import InternshipRetriever


class CareerAssistantService:
    def __init__(self):
        self.retriever = InternshipRetriever()
        self.responses = CareerResponseBuilder()

    def chat(self, message: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        started_at = time.perf_counter()
        context = context if isinstance(context, dict) else {}

        try:
            intent = detect_intent(message, context)
            memory = build_memory(context, intent)
            offers = []
            if intent.name in {"internship_search", "job_market", "offer_analysis"}:
                offers = self.retriever.find_relevant_offers(memory)

            payload = self.responses.build(
                message=message or "",
                intent=intent,
                memory=memory,
                offers=offers,
                context=context,
                is_follow_up=recently_answered(context, intent.name),
            )
            payload["memory"] = memory
            payload["latency_ms"] = int((time.perf_counter() - started_at) * 1000)
            payload["source"] = "deterministic-career-engine"
            return payload
        except Exception:
            payload = self.responses.fallback_response(message or "")
            payload["memory"] = build_memory(context, detect_intent("", context))
            payload["latency_ms"] = int((time.perf_counter() - started_at) * 1000)
            payload["source"] = "fallback"
            return payload
