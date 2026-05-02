import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Clock } from 'lucide-react'

export function InternshipCard({ internship }: { internship: any }) {
  const inferDomain = (title: string, desc: string = '') => {
    const text = (title + ' ' + desc).toLowerCase()
    if (text.includes('maintenance') || text.includes('mécanique') || text.includes('industriel')) return 'Engineering'
    if (text.includes('finance') || text.includes('comptabilité') || text.includes('gestion')) return 'Finance'
    if (text.includes('marketing') || text.includes('vente') || text.includes('digital')) return 'Marketing'
    if (text.includes('design') || text.includes('graphique') || text.includes('ui') || text.includes('ux')) return 'Design'
    if (text.includes('rh') || text.includes('humaines') || text.includes('recrutement')) return 'HR'
    return 'IT' // Default
  }

  const typeColors: Record<string, string> = {
    'Remote': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'On-site': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Hybrid': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  const domainColors: Record<string, string> = {
    'IT': 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'Finance': 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    'Engineering': 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    'Marketing': 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    'Design': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    'HR': 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  }

  const image = internship.image || `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800`
  const type = internship.type || 'On-site'
  const domain = internship.domain || inferDomain(internship.title, internship.description)
  const location = internship.location && internship.location !== 'Tunisie' ? internship.location : 'Tunis, Tunisia'
  const company = internship.company || 'Confidential'
  const dateStr = internship.date || internship.date_posted || 'Recently'

  return (
    <Link href={`/internships/${internship.id}`}>
      <div className="group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <Image
            src={image}
            alt={internship.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {internship.matchScore && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold shadow-lg">
              {internship.matchScore}% Match
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">{company}</p>
            <Badge variant="outline" className={typeColors[type] || typeColors['Remote']}>
              {type}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {internship.title}
          </h3>

          <div className="mb-3">
            <Badge variant="secondary" className={domainColors[domain] || domainColors['IT']}>
              {domain}
            </Badge>
          </div>

          <div className="space-y-2 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {location}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {dateStr}
            </div>
          </div>

          <div className="mt-auto">
            <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
              View Offer
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
