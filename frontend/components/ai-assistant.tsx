'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2, Compass, ExternalLink } from 'lucide-react'
import { askAI, type AIChatResponse, type AssistantOffer } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { PremiumModal } from '@/components/premium-modal'
import { Lock } from 'lucide-react'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
  suggestions?: string[]
  results?: AssistantOffer[]
  intent?: string
  latencyMs?: number
}

type AssistantMemory = Record<string, unknown>

const welcomeMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi. I can help you find a stage, improve your CV, prepare interviews, or understand an offer. What are you working on?',
  suggestions: ['I want a stage', 'Review my CV', 'Interview prep'],
  intent: 'welcome',
}

function buildOfflineFallback(message: string): AIChatResponse {
  const normalized = message.toLowerCase()
  if (normalized.includes('cv') || normalized.includes('resume')) {
    return {
      answer: 'The server is unavailable, but here is a useful CV check: keep it one page, add a targeted headline, rewrite bullets as Action + Tool + Result, and mirror keywords from the internship offer.',
      suggestions: ['Rewrite my bullets', 'ATS keywords', 'Cover letter template'],
      intent: 'cv_review',
      mode: 'offline_fallback',
    }
  }

  if (normalized.includes('interview') || normalized.includes('entretien')) {
    return {
      answer: 'The server is unavailable, but you can still prepare: write a 60-second pitch, prepare 3 STAR stories, and be ready to explain one project architecture and one bug you solved.',
      suggestions: ['Mock question', 'Improve my pitch', 'STAR answer'],
      intent: 'interview_prep',
      mode: 'offline_fallback',
    }
  }

  return {
    answer: 'The server is unavailable, but I can still guide you: tell me your field, location, level, and target internship type. Then search with precise keywords and tailor your CV to each offer.',
    suggestions: ['Software in Tunis, PFE', 'Data AI remote', 'Write recruiter message'],
    intent: 'internship_search',
    mode: 'offline_fallback',
  }
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guideMode, setGuideMode] = useState(true)
  const [memory, setMemory] = useState<AssistantMemory>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const appendAssistantResponse = (response: AIChatResponse) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.answer,
      suggestions: response.suggestions,
      results: response.results,
      intent: response.intent,
      latencyMs: response.latency_ms,
    }])

    if (response.memory) {
      setMemory(prev => ({ ...prev, ...response.memory }))
    }
  }

  const handleSend = async (text: string) => {
    if (!user?.isPremium) {
      setIsPremiumModalOpen(true)
      return
    }

    const userMessage = text.trim()
    if (!userMessage || isLoading) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }]
    setInput('')
    setMessages(nextMessages)
    setIsLoading(true)

    try {
      const response = await askAI(userMessage, {
        user: user ?? undefined,
        guideMode,
        memory,
        conversation: nextMessages.slice(-8).map(({ role, content, intent }) => ({ role, content, intent })),
      })
      appendAssistantResponse(response)
    } catch {
      appendAssistantResponse(buildOfflineFallback(userMessage))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all duration-300 scale-100 hover:scale-110 flex items-center justify-center p-0"
          aria-label="Open career assistant"
        >
          <MessageSquare className="w-6 h-6 text-primary-foreground" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[min(calc(100vw-2rem),420px)] h-[min(650px,calc(100vh-5rem))] flex flex-col shadow-2xl border-border bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                  Career Assistant
                  {!user?.isPremium && <Lock className="w-3 h-3 text-amber-500" />}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${user?.isPremium ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    {user?.isPremium ? 'AI Powered' : 'Premium Only'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-medium">Guide</span>
                <Switch checked={guideMode} onCheckedChange={setGuideMode} aria-label="Toggle guide mode" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full" aria-label="Close career assistant">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
          >
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-muted' : 'bg-primary/10'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted/50 border border-border rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.results && msg.results.length > 0 && (
                      <div className="space-y-2">
                        {msg.results.slice(0, 3).map((offer, index) => (
                          <a
                            key={`${offer.id ?? offer.title}-${index}`}
                            href={offer.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border border-border bg-background/80 p-3 text-xs hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground leading-snug">{offer.title}</p>
                                <p className="text-muted-foreground mt-1">{offer.company} - {offer.location}</p>
                                {offer.match_reason && <p className="text-primary mt-1">{offer.match_reason}</p>}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {msg.latencyMs !== undefined && (
                      <p className="text-[10px] text-muted-foreground px-1">Answered in {msg.latencyMs} ms</p>
                    )}

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion}-${index}`}
                            onClick={() => handleSend(suggestion)}
                            disabled={isLoading}
                            className="text-[11px] px-2.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/50 border border-border rounded-tl-none flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleSend(input)
              }}
              className="relative flex items-center"
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about stage, CV, interview..."
                className="pr-10 rounded-xl bg-muted/30 border-border focus-visible:ring-primary/50"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 h-8 w-8 text-primary hover:bg-transparent"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
    </div>
  )

}
