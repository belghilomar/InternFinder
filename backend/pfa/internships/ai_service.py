import re
from typing import Any, Dict, List

from .career_ai.service import CareerAssistantService


class CareerAssistantAI(CareerAssistantService):
    def __init__(self):
        super().__init__()
        self.enabled = True

    def _call_llm(self, prompt: str, system_prompt: str = "You are an expert career assistant.") -> str:
        return "AI provider not configured. Using fast deterministic career engine."

    def generate_chatbot_response(self, message: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        return self.chat(message, context)

    def analyze_cv(self, cv_text: str) -> Dict[str, Any]:
        text = cv_text or ""
        lowered = text.lower()
        skills = self._extract_skills(text)
        has_contact = bool(re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}|\+?\d[\d\s().-]{7,}", text))
        has_link = any(token in lowered for token in ["linkedin", "github", "portfolio", "behance"])
        has_metrics = bool(re.search(r"\b\d+\s*(%|percent|users|clients|projects|days|hours|dt|tnd)?\b", lowered))
        has_action_verbs = any(
            verb in lowered
            for verb in ["built", "created", "developed", "designed", "optimized", "automated", "analyzed", "managed", "launched"]
        )
        has_sections = sum(section in lowered for section in ["education", "experience", "projects", "skills", "certifications"])

        score = 45
        score += min(len(skills), 8) * 3
        score += 10 if has_contact else 0
        score += 8 if has_link else 0
        score += 12 if has_metrics else 0
        score += 10 if has_action_verbs else 0
        score += min(has_sections * 4, 15)
        score = max(35, min(score, 96))

        weaknesses = []
        if not has_contact:
            weaknesses.append({"type": "Contact", "content": "Add a professional email and phone number at the top of the CV."})
        if not has_link:
            weaknesses.append({"type": "Proof", "content": "Add LinkedIn, GitHub, portfolio, or a project link so recruiters can verify your work."})
        if not has_metrics:
            weaknesses.append({"type": "Impact", "content": "Add numbers where possible: users, time saved, accuracy, revenue, project duration, or team size."})
        if not has_action_verbs:
            weaknesses.append({"type": "Phrasing", "content": "Start bullets with action verbs such as Built, Automated, Designed, Analyzed, or Optimized."})
        if has_sections < 3:
            weaknesses.append({"type": "Structure", "content": "Use clear sections: Education, Projects, Experience, Skills, Certifications."})

        if not weaknesses:
            weaknesses.append({"type": "Targeting", "content": "Tailor the top summary and skills section to each offer before applying."})

        improved_bullets = [
            "Built a [project type] using [tools], improving [metric] for [users/team].",
            "Automated [manual task] with [technology], reducing processing time by [number]%.",
            "Designed and delivered [feature] in a team of [number], using [method/tool] to achieve [result].",
        ]

        return {
            "score": score,
            "extracted_data": {
                "skills": skills,
                "education": "Detected" if any(word in lowered for word in ["university", "school", "licence", "master", "engineering"]) else "Not clearly detected",
                "experience_years": self._estimate_experience(text),
            },
            "weaknesses": weaknesses[:5],
            "improved_bullet_points": improved_bullets,
            "ats_optimization": (
                "Mirror keywords from the target offer in a Core Skills section. Keep formatting simple, use standard headings, "
                "and save as PDF unless the recruiter asks for another format."
            ),
        }

    def rank_jobs(self, user_profile: Dict[str, Any], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ranked_jobs = []
        user_skills = [str(skill).lower() for skill in user_profile.get("skills", [])]
        target_field = str(user_profile.get("field", "")).lower()
        for job in jobs:
            title_text = f"{job.get('title', '')} {job.get('description', '')} {job.get('domain', '')}".lower()
            score = 45
            matches = []
            missing = []
            for skill in user_skills:
                if skill and skill in title_text:
                    score += 10
                    matches.append(skill)
            if target_field and target_field in title_text:
                score += 12
            common_skills = ["leadership", "communication", "sql", "cloud", "analytics", "excel", "python", "react"]
            for skill in common_skills:
                if skill not in user_skills and skill in title_text:
                    missing.append(skill)
            ranked_jobs.append({
                **job,
                "score": min(98, score),
                "match_reason": f"Matches your background in {', '.join(matches[:3])}." if matches else "Matches your general field of interest.",
                "missing_skills": missing[:4],
            })
        return sorted(ranked_jobs, key=lambda item: item["score"], reverse=True)

    def generate_personal_branding(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        name = profile.get("fullName", "Professional")
        field = profile.get("field", "Technology")
        skills = profile.get("skills") or ["problem-solving"]
        top_skills = ", ".join(skills[:3])
        return {
            "linkedin_headline": f"{field} student | Seeking internship | Projects in {top_skills}",
            "about_section": (
                f"I am {name}, a {field} profile focused on building practical solutions with {top_skills}. "
                "I am looking for an internship where I can contribute to real projects, learn from a strong team, "
                "and deliver measurable results."
            ),
            "professional_bio": f"{name} is an early-career {field} talent with practical skills in {top_skills} and a strong learning mindset.",
        }

    def generate_cover_letter(self, profile: Dict[str, Any], job_title: str, job_desc: str = "") -> str:
        name = profile.get("fullName", "[Your Name]")
        field = profile.get("field", "[Your Field]")
        skills = ", ".join(profile.get("skills", ["problem-solving", "teamwork"])[:4])
        company_focus = "your team" if not job_desc else "the projects described in the offer"
        return f"""Subject: Application for {job_title}

Dear Hiring Manager,

I am applying for the {job_title} opportunity because it matches my background in {field} and my practical skills in {skills}. I am especially interested in contributing to {company_focus} while continuing to learn in a professional environment.

In my academic and project work, I have focused on turning requirements into concrete deliverables, collaborating with teammates, and improving my work through feedback. I would be glad to bring that same discipline, curiosity, and reliability to your team.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my profile can support your internship needs.

Sincerely,
{name}"""

    def optimize_cv_for_job(self, cv_text: str, job_description: str) -> Dict[str, Any]:
        cv_words = set(re.findall(r"[a-zA-Z][a-zA-Z+#.]{2,}", (cv_text or "").lower()))
        job_words = set(re.findall(r"[a-zA-Z][a-zA-Z+#.]{2,}", (job_description or "").lower()))
        useful_missing = sorted((job_words - cv_words) - {"the", "and", "with", "for", "you", "our", "your", "are", "this"})[:12]
        match_score = 55 + min(40, len(cv_words & job_words) * 2)
        first_name_match = re.search(r"\b[A-Z][a-z]+\b", cv_text or "")
        profile_name = first_name_match.group(0) if first_name_match else "Candidate"
        return {
            "match_score": min(match_score, 95),
            "keyword_optimization": [
                {"original": "Worked on web projects", "optimized": "Built responsive web features using the target stack and delivered tested functionality for end users."},
                {"original": "Helped the team", "optimized": "Collaborated with a cross-functional team to analyze requirements, implement tasks, and document results."},
            ],
            "missing_keywords": useful_missing[:8],
            "summary_suggestion": f"{profile_name} is an early-career professional targeting this role with practical project experience and a strong ability to learn quickly.",
        }

    def _extract_skills(self, text: str) -> List[str]:
        skill_terms = [
            "Python", "Java", "JavaScript", "TypeScript", "React", "Next.js", "Node", "Django", "SQL", "PostgreSQL",
            "Docker", "AWS", "Azure", "Power BI", "Excel", "Machine Learning", "Data Analysis", "Git", "Agile",
            "Project Management", "French", "English", "Communication",
        ]
        found = []
        for skill in skill_terms:
            if re.search(rf"(?<!\w){re.escape(skill)}(?!\w)", text, re.IGNORECASE):
                found.append(skill)
        return found

    def _estimate_experience(self, text: str) -> str:
        years = re.findall(r"\b(20\d{2})\b", text or "")
        if len(years) >= 2:
            return "Estimated from dated entries"
        if any(word in (text or "").lower() for word in ["intern", "stage", "freelance", "project"]):
            return "Entry-level / internship experience"
        return "Not enough information"


ai_assistant = CareerAssistantAI()
