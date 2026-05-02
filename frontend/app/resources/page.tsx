'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getResources } from '@/lib/api'
import { Download, Eye, FileText, Mail, Mic, Loader2, Lock, Sparkles, BookOpen } from 'lucide-react'
import { PremiumModal } from '@/components/premium-modal'
import { useAuth } from '@/context/auth-context'

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('CV')
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources()
        setResources(data)
      } catch (error) {
        console.error('Resources error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [])

  const categories = ['CV', 'Cover Letter', 'Interview']
  
  const handlePremiumClick = () => {
    setIsPremiumModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-card relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative">
          <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
            Career <span className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">Resources</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Professional templates and expert-led guides to help you land your dream internship.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
          </div>
        ) : (
          <div className="mb-20">
            <Tabs defaultValue="CV" onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-16 bg-muted/30 border border-border/50">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="data-[state=active]:shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resources
                      .filter((r) => r.category === category)
                      .map((resource) => (
                        <ResourceCard 
                          key={resource.id} 
                          resource={resource} 
                          onPremiumClick={handlePremiumClick}
                        />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        <section className="mt-24 pt-16 border-t border-border/50">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Tailor Your CV',
                description: 'Customize your CV for each position to highlight relevant skills.',
                Icon: FileText,
                glow: 'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
              },
              {
                title: 'Practice Interviews',
                description: 'Rehearse common interview questions and prepare examples.',
                Icon: Mic,
                glow: 'hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
              },
              {
                title: 'Follow Up',
                description: 'Send a thank you email within 24 hours of your interview.',
                Icon: Mail,
                glow: 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
              },
            ].map(({ Icon, ...tip }, idx) => (
              <div key={idx} className={`bg-card border border-border/50 rounded-2xl p-8 transition-all duration-300 ${tip.glow}`}>
                <Icon className="h-10 w-10 text-primary mb-6 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                <h3 className="text-xl font-bold text-foreground mb-3">{tip.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
      />
      <Footer />
    </div>
  )
}

function ResourceCard({ resource, onPremiumClick }: { resource: any; onPremiumClick: () => void }) {
  const { user } = useAuth()
  const isTemplate = resource.type === 'template'
  const isPremium = resource.is_premium
  const hasAccess = !isPremium || (user?.isPremium)
  
  return (
    <div className={`group bg-card border ${isPremium && !user?.isPremium ? 'border-amber-500/30' : 'border-border/50'} rounded-2xl p-8 hover:shadow-[0_0_25px_rgba(var(--primary),0.15)] ${isPremium && !user?.isPremium ? 'hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]' : 'hover:border-primary/50'} transition-all duration-500 flex flex-col h-full relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl ${isPremium && !user?.isPremium ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'} drop-shadow-[0_0_5px_currentColor]`}>
          {isPremium && !user?.isPremium ? <Lock className="w-5 h-5" /> : (isTemplate ? <FileText className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />)}
        </div>
        <div className="flex gap-2">
          {isPremium && (
            <Badge className={`${user?.isPremium ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'} text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full`}>
              {user?.isPremium ? 'Unlocked' : 'Premium'}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full">
            {resource.type}
          </Badge>
        </div>
      </div>

      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{resource.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">{resource.description}</p>

      <div className="flex flex-col gap-3">
        {!hasAccess ? (
          <Button 
            onClick={onPremiumClick}
            variant="default" 
            className="w-full rounded-xl font-bold bg-amber-500 hover:bg-amber-600 border-none text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
          >
            <Lock className="w-4 h-4 mr-2" /> Unlock Premium
          </Button>
        ) : isTemplate ? (
          <div className="flex gap-2">
            <Button variant="default" className="flex-1 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl font-bold border-border/50 hover:border-primary/50 transition-all">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button variant="default" className="w-full rounded-xl font-bold shadow-[0_0_15px_rgba(var(--primary),0.2)] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
            <BookOpen className="w-4 h-4 mr-2" /> Read Guide
          </Button>
        )}
      </div>
    </div>
  )
}
