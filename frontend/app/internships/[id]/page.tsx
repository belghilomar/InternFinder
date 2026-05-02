import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { InternshipCard } from '@/components/internship-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInternshipById, getRecentOffers } from '@/lib/api'
import { ArrowLeft, Briefcase, Clock, MapPin, ExternalLink } from 'lucide-react'
import { SaveButton } from './save-button'

export default async function InternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const internship = await getInternshipById(id)

  if (!internship) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Internship Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The internship you are looking for might have been removed or the link is incorrect.
          </p>
          <Link href="/internships">
            <Button size="lg" className="rounded-full px-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Internships
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const allOffers = await getRecentOffers()
  const similarInternships = allOffers
    .filter((item) => item.domain === internship.domain && item.id !== internship.id)
    .slice(0, 3)

  const typeColors: Record<string, string> = {
    Remote: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'On-site': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Hybrid: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  }

  const domain = internship.domain || 'IT'
  const type = internship.type || 'On-site'

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200">
      <Navbar />

      {/* Navigation Bar */}
      <div className="bg-[#020817] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/internships"
            className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Internships
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8">
            {/* Header / Image Section */}
            <div className="relative h-[400px] w-full rounded-2xl overflow-hidden mb-10 bg-slate-800/50 border border-slate-700/50 shadow-2xl group">
              <Image 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200" 
                alt={internship.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent opacity-60" />
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={`${typeColors[type]} px-3 py-1 text-xs font-semibold uppercase tracking-wider`}>
                  {type}
                </Badge>
              </div>
              
              <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                {internship.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 mb-10 text-slate-400">
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-sky-400" />
                   </div>
                   <span className="text-xl font-medium text-slate-300">{internship.company || 'Company not specified'}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Location</p>
                  <div className="flex items-center gap-3 text-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                       <MapPin className="w-4 h-4 text-sky-400" />
                    </div>
                    <span className="text-lg font-semibold">{internship.location || 'Tunisie'}</span>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Duration / Date</p>
                  <div className="flex items-center gap-3 text-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                       <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-lg font-semibold">{internship.date_posted || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                   <div className="w-1.5 h-8 bg-sky-500 rounded-full" />
                   About the Internship
                </h2>
                <div className="text-slate-400 text-lg leading-relaxed space-y-6">
                  {internship.description ? (
                    <p className="whitespace-pre-wrap">{internship.description}</p>
                  ) : (
                    <p>No detailed description provided for this offer. Please check the original listing for full requirements and responsibilities.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              
              {/* Actions Card */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-xl">
                 <Link href={internship.url} target="_blank">
                    <Button className="w-full h-14 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-lg mb-4 shadow-lg shadow-sky-500/20">
                      Apply Now
                    </Button>
                 </Link>
                 <SaveButton internshipId={internship.id.toString()} />
              </div>

              {/* Company Info */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Company Info</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Company Name</p>
                    <p className="text-lg font-semibold text-slate-200">{internship.company || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Position Type</p>
                    <Badge variant="outline" className={`${typeColors[type]} mt-1`}>
                      {type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Professional Domain</p>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none mt-1">
                      {domain}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Source Card */}
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Source</h3>
                <p className="text-slate-400 text-sm mb-6">
                  This offer was discovered via <span className="text-sky-400 font-bold uppercase">{internship.search_keyword}</span>.
                </p>
                <Link href={internship.url} target="_blank">
                  <Button variant="outline" className="w-full border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-2 group">
                    <ExternalLink className="w-4 h-4 group-hover:text-sky-400" />
                    Open Original Listing
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Similar Internships Section */}
        {similarInternships.length > 0 && (
          <div className="mt-24 pt-24 border-t border-slate-800">
            <div className="flex items-center justify-between mb-12">
               <h2 className="text-3xl font-extrabold text-white">Similar Opportunities</h2>
               <Link href="/internships" className="text-sky-400 hover:underline font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarInternships.map((similarInternship) => (
                <InternshipCard key={similarInternship.id} internship={similarInternship} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
