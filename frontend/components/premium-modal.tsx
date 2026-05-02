'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/auth-context'
import { Check, Sparkles, Trophy, Rocket, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { user, updateUser } = useAuth()
  
  const benefits = [
    {
      title: '24/7 AI Career Assistant',
      description: 'Get personalized advice, CV analysis, and cover letters anytime.',
      icon: Sparkles,
    },
    {
      title: 'Premium Templates',
      description: 'Access to 20+ professional CV and Cover Letter templates.',
      icon: Trophy,
    },
    {
      title: 'Expert Interview Prep',
      description: 'Detailed guides for technical and behavioral interviews.',
      icon: Rocket,
    },
    {
      title: 'AI Priority Search',
      description: 'Be the first to see new internships before they go public.',
      icon: ShieldCheck,
    },
  ]

  const handleUpgrade = () => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      return
    }

    const updatedUser = { ...user, isPremium: true }
    updateUser(updatedUser)
    
    toast.success('Welcome to InternFinder Premium!')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none bg-background rounded-[2.5rem]">
        <div className="relative overflow-hidden">
          {/* Header Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="relative p-8 pb-4 text-center">
            <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              InternFinder Pro
            </Badge>
            <DialogTitle className="text-3xl font-extrabold text-foreground mb-2">
              Unlock Your <span className="text-amber-500">Full Potential</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base max-w-sm mx-auto">
              Get exclusive access to the tools and resources that top candidates use to land their dream internships.
            </DialogDescription>
          </div>

          <div className="relative p-8 pt-4 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-0.5">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground leading-snug">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-border/50 text-center">
              <div className="mb-6">
                <span className="text-4xl font-black text-foreground">29.99 <span className="text-lg">TND</span></span>
                <span className="text-muted-foreground font-medium ml-2">/ year</span>
              </div>
              
              <Button 
                onClick={handleUpgrade}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-none text-white font-bold text-lg shadow-xl shadow-amber-500/20 group transition-all"
              >
                Upgrade to Premium Now
                <Rocket className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
              
              <p className="mt-4 text-xs text-muted-foreground font-medium">
                One-time payment. Cancel anytime. Secure checkout.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

