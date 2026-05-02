from __future__ import annotations

from typing import Any, Dict, List

from .intent import IntentResult, missing_slots_for


class CareerResponseBuilder:
    def build(
        self,
        message: str,
        intent: IntentResult,
        memory: Dict[str, Any],
        offers: List[Dict[str, Any]],
        context: Dict[str, Any] | None = None,
        is_follow_up: bool = False,
    ) -> Dict[str, Any]:
        context = context or {}
        guide_mode = bool(context.get("guideMode")) or intent.guide_requested

        if intent.name == "empty":
            return self.empty_response(memory)

        handlers = {
            "internship_search": self._internship_response,
            "cv_review": self._cv_response,
            "interview_prep": self._interview_response,
            "offer_analysis": self._offer_response,
            "job_market": self._market_response,
            "personal_branding": self._branding_response,
            "general_career": self._general_response,
        }
        payload = handlers.get(intent.name, self._general_response)(message, memory, offers, guide_mode)

        if is_follow_up and payload.get("answer"):
            payload["answer"] = "Building on our last answer, here is the next useful move:\n\n" + payload["answer"]

        payload.setdefault("suggestions", self.default_suggestions(intent.name))
        payload.setdefault("next_steps", [])
        payload.setdefault("follow_up_questions", [])
        payload.setdefault("results", offers)
        payload["intent"] = intent.name
        payload["confidence"] = intent.confidence
        payload["mode"] = "guide" if guide_mode else "direct"
        return payload

    def empty_response(self, memory: Dict[str, Any] | None = None) -> Dict[str, Any]:
        field = (memory or {}).get("field") or "your field"
        return {
            "answer": (
                "Tell me what you need help with. For example:\n"
                "- I want a stage in web development in Tunis\n"
                "- Review this CV summary\n"
                "- Prepare me for an interview\n"
                f"- What skills should I learn for {field}?"
            ),
            "suggestions": ["I want a stage", "Review my CV", "Interview prep"],
            "next_steps": ["Send your field, location, and level for tailored guidance."],
            "follow_up_questions": ["What is your field and preferred location?"],
            "results": [],
            "intent": "empty",
            "confidence": 1.0,
            "mode": "guide",
        }

    def fallback_response(self, message: str = "") -> Dict[str, Any]:
        return {
            "answer": (
                "I could not complete the full assistant workflow, but here is a safe next step:\n"
                "1. Share your field, level, location, and target role.\n"
                "2. I will turn that into search keywords, CV improvements, and an application plan.\n"
                "3. If you pasted a CV or offer, resend the most important paragraph and I will analyze it."
            ),
            "suggestions": ["Guide me step by step", "Improve my CV", "Find internship keywords"],
            "next_steps": ["Retry with one clear goal and any missing context."],
            "follow_up_questions": ["What outcome do you want first: stage search, CV, interview, or offer analysis?"],
            "results": [],
            "intent": "fallback",
            "confidence": 0.2,
            "mode": "safe_fallback",
        }

    def _internship_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your target field"
        location = memory.get("location") or "your preferred location"
        level = memory.get("level") or "your current level"
        missing = missing_slots_for("internship_search", memory)

        if guide_mode and missing:
            questions = [f"What is {item}?" for item in missing]
            return {
                "answer": (
                    "Yes. I can guide you step by step. To make the stage search precise, answer these quick questions:\n"
                    + "\n".join(f"{index}. {question}" for index, question in enumerate(questions, start=1))
                    + "\n\nWhile you answer, prepare these three things:\n"
                    "- A one-page CV focused on projects and measurable results.\n"
                    "- 3 search keywords, for example 'React PFE', 'data analyst stage', or 'marketing internship'.\n"
                    "- A short message for recruiters: who you are, what you can do, and when you are available."
                ),
                "suggestions": ["Software in Tunis, PFE", "Data AI remote", "Marketing licence"],
                "next_steps": ["Reply with field, location, and level."],
                "follow_up_questions": questions,
                "results": offers,
            }

        offer_lines = self._offer_lines(offers)
        return {
            "answer": (
                f"Here is a focused stage search plan for {field} in {location} ({level}):\n\n"
                "1. Search with precise keywords\n"
                f"Use combinations like '{field} stage', '{field} PFE', '{field} internship {location}', and the main tools in your CV.\n\n"
                "2. Apply with a tailored CV\n"
                "Put your strongest project first. Each bullet should show action, tool, and result.\n\n"
                "3. Contact recruiters directly\n"
                "Send a short message with your specialty, availability, and portfolio or LinkedIn link.\n\n"
                "4. Track every application\n"
                "Use a table with company, role, date, contact, status, and next follow-up date."
                + offer_lines
            ),
            "suggestions": ["Write recruiter message", "Improve my CV for this", "Prepare interview answers"],
            "next_steps": [
                "Pick 10 companies and send targeted applications today.",
                "Send me your CV summary or one offer to tailor your application.",
            ],
            "follow_up_questions": ["Do you already have a CV and portfolio link?"],
            "results": offers,
        }

    def _cv_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your target role"
        return {
            "answer": (
                f"Fast CV improvement plan for {field}:\n\n"
                "1. Start with a targeted headline\n"
                "Example: 'Computer science student seeking a PFE in React/Django development'.\n\n"
                "2. Rewrite project bullets with this formula\n"
                "Action + tool + result. Example: 'Built a Django API with JWT auth and reduced manual matching work by 40%'.\n\n"
                "3. Add an ATS keyword block\n"
                "Include tools, languages, frameworks, databases, soft skills, and domain keywords from the offer.\n\n"
                "4. Remove weak lines\n"
                "Avoid 'responsible for' and generic lists. Replace them with proof: project, metric, user, or outcome."
            ),
            "suggestions": ["Analyze this CV text", "Rewrite my bullets", "Cover letter template"],
            "next_steps": ["Paste your CV summary or 3 experience bullets for direct rewriting."],
            "follow_up_questions": ["What role are you targeting with this CV?"],
            "results": [],
        }

    def _interview_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your target role"
        return {
            "answer": (
                f"Interview preparation plan for {field}:\n\n"
                "1. Prepare your 60-second pitch\n"
                "Who you are, what you build or study, your strongest project, and what internship you want.\n\n"
                "2. Use STAR for behavioral answers\n"
                "Situation, Task, Action, Result. Keep each answer under 90 seconds.\n\n"
                "3. Prepare proof for technical skills\n"
                "Be ready to explain one project architecture, one bug you solved, and one tradeoff you made.\n\n"
                "Mock question: Tell me about a project where you learned something difficult quickly."
            ),
            "suggestions": ["Ask me a mock question", "Help with my pitch", "Technical interview tips"],
            "next_steps": ["Answer the mock question and I will improve it."],
            "follow_up_questions": ["Is the interview HR, technical, or both?"],
            "results": [],
        }

    def _offer_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        return {
            "answer": (
                "To understand a job or stage offer, check it in this order:\n\n"
                "1. Mission: What will you actually do every week?\n"
                "2. Requirements: Which skills are mandatory vs optional?\n"
                "3. Learning value: Will you ship, analyze, sell, design, or just observe?\n"
                "4. Fit: Compare the offer keywords with your CV keywords.\n"
                "5. Risk: Watch for vague tasks, unpaid full-time work, or missing supervision.\n\n"
                "Paste the offer text and I will extract the key missions, required skills, missing CV keywords, and application angle."
            ),
            "suggestions": ["Analyze this offer", "Extract keywords", "Write application message"],
            "next_steps": ["Paste the offer description or URL title."],
            "follow_up_questions": ["Do you want a fit score or a simple explanation first?"],
            "results": offers,
        }

    def _market_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your field"
        return {
            "answer": (
                f"Practical job-market guidance for {field}:\n\n"
                "- High-value profiles combine one technical skill, one business/domain skill, and clear communication.\n"
                "- For internships, recruiters care less about years of experience and more about proof: projects, GitHub, case studies, certificates, or portfolio.\n"
                "- Your best shortcut is to target niches: React + dashboard, Python + data cleaning, Power BI + finance, marketing + analytics.\n"
                "- Apply early, follow up after 5-7 days, and keep improving the same CV with offer keywords."
            ),
            "suggestions": ["Build a learning roadmap", "Best projects for my field", "Search keywords"],
            "next_steps": ["Choose one niche and build/apply around it for the next 2 weeks."],
            "follow_up_questions": ["Which skill do you already have strongest proof for?"],
            "results": offers,
        }

    def _branding_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your field"
        return {
            "answer": (
                f"Personal branding for {field}:\n\n"
                "1. LinkedIn headline\n"
                f"Student in {field} | Seeking internship | Projects in [tool/domain]\n\n"
                "2. About section structure\n"
                "Line 1: your field and goal.\n"
                "Line 2: strongest tools/projects.\n"
                "Line 3: what kind of internship you want.\n"
                "Line 4: contact or portfolio link.\n\n"
                "3. Proof beats adjectives\n"
                "Replace 'motivated and dynamic' with a concrete project, result, or tool."
            ),
            "suggestions": ["Write LinkedIn headline", "Improve my About section", "Recruiter message"],
            "next_steps": ["Send your current headline and I will rewrite it."],
            "follow_up_questions": ["What are your top 2 skills or projects?"],
            "results": [],
        }

    def _general_response(self, message: str, memory: Dict[str, Any], offers: List[Dict[str, Any]], guide_mode: bool) -> Dict[str, Any]:
        field = memory.get("field") or "your field"
        return {
            "answer": (
                "I can help with four concrete career tasks:\n"
                "- Find a stage with a step-by-step plan.\n"
                "- Improve your CV and rewrite weak bullets.\n"
                "- Prepare interviews with mock questions and STAR answers.\n"
                "- Understand job offers and extract keywords.\n\n"
                f"For a tailored answer, tell me your field, level, and location. I currently have: {field}."
            ),
            "suggestions": ["I want a stage", "Review my CV", "Analyze an offer"],
            "next_steps": ["Choose one goal and share the missing context."],
            "follow_up_questions": ["What do you want to solve first?"],
            "results": offers,
        }

    def _offer_lines(self, offers: List[Dict[str, Any]]) -> str:
        if not offers:
            return "\n\nI did not find a matching stored offer yet. Use the plan above, then try a more specific keyword or location."

        lines = ["\n\nRelevant offers from the database:"]
        for offer in offers[:3]:
            lines.append(
                f"- {offer.get('title')} at {offer.get('company')} ({offer.get('location')}) - {offer.get('match_reason')}"
            )
        return "\n".join(lines)

    def default_suggestions(self, intent_name: str) -> List[str]:
        suggestions = {
            "internship_search": ["Guide me step by step", "Write recruiter message", "Search keywords"],
            "cv_review": ["Rewrite my bullets", "ATS keywords", "CV summary"],
            "interview_prep": ["Mock interview", "Improve my pitch", "STAR answer"],
            "offer_analysis": ["Extract offer keywords", "Check my fit", "Write application"],
        }
        return suggestions.get(intent_name, ["I want a stage", "Improve my CV", "Interview prep"])
