const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Internship {
  id: number;
  title: string;
  company: string;
  location: string;
  date_posted: string;
  url: string;
  search_keyword: string;
  description?: string;
  domain?: string;
  type?: string;
  created_at: string;
}

export interface SearchResponse {
  results: Internship[];
  is_scraping: boolean;
  count: number;
}

export interface AssistantOffer {
  id?: number;
  title: string;
  company?: string;
  location?: string;
  url?: string;
  domain?: string;
  score?: number;
  match_reason?: string;
}

export interface AIChatResponse {
  answer: string;
  suggestions?: string[];
  next_steps?: string[];
  follow_up_questions?: string[];
  results?: AssistantOffer[];
  intent?: string;
  confidence?: number;
  mode?: string;
  memory?: Record<string, unknown>;
  latency_ms?: number;
  source?: string;
}

export async function searchInternships(keyword: string, location: string = 'Tunisie'): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/offers/?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
  if (!response.ok) throw new Error('Failed to fetch internships');
  return response.json();
}

export async function getScrapingStatus(keyword: string, location: string = 'Tunisie'): Promise<{ is_scraping: boolean, count: number }> {
  const response = await fetch(`${API_BASE_URL}/status/?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
  if (!response.ok) throw new Error('Failed to fetch status');
  return response.json();
}

export async function getMatchedInternships(skills: string[], domains: string[]): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/matching/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills, domains })
  });
  if (!response.ok) throw new Error('Failed to fetch matches');
  return response.json();
}

export async function getResources(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/resources/`);
  if (!response.ok) throw new Error('Failed to fetch resources');
  return response.json();
}

export async function getRecentOffers(): Promise<Internship[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/offers/`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  } catch {
    return [];
  }
}

export async function getInternshipById(id: string): Promise<Internship | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/offers/${id}/`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function askAI(message: string, context: Record<string, unknown> = {}, timeoutMs = 12000): Promise<AIChatResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to get AI response');
    }
    return data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function analyzeCV(cvText: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/ai/analyze-cv/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cv_text: cvText })
  });
  if (!response.ok) throw new Error('Failed to analyze CV');
  return response.json();
}

export async function generateBranding(profile: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/ai/branding/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile })
  });
  if (!response.ok) throw new Error('Failed to generate branding');
  return response.json();
}
