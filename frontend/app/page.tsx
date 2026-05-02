'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { InternshipCard } from '@/components/internship-card'
import { EmptyInternships } from '@/components/empty-internships'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { howItWorks, tunisianCities } from '@/lib/mock-data'
import { getRecentOffers, Internship } from '@/lib/api'
import { ArrowRight, MapPin, Search, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [recentOffers, setRecentOffers] = useState<Internship[]>([])
  const [loadingOffers, setLoadingOffers] = useState(true)

  useEffect(() => {
    getRecentOffers()
      .then((offers) => setRecentOffers(offers))
      .catch(() => setRecentOffers([]))
      .finally(() => setLoadingOffers(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (keyword) params.append('keyword', keyword)
    if (location) params.append('location', location)

    const query = params.toString()
    router.push(query ? `/internships?${query}` : '/internships')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-Powered Internship Matching
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Find Your <span className="text-primary">Perfect Internship</span> Smarter
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Discover internship opportunities matched to your skills and aspirations. Our AI
              analyzes thousands of positions to find the perfect fit for your career journey.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border rounded-lg p-2 shadow-lg">
                <div className="flex-1 flex items-center gap-2 px-4 py-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Job title or keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 px-4 py-2 border-t sm:border-t-0 sm:border-l border-border">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    list="tunisia-cities"
                    placeholder="Tunis, Sfax, Sousse..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  <datalist id="tunisia-cities">
                    {tunisianCities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
                <Button type="submit" className="sm:w-auto px-6">
                  Search
                </Button>
              </div>
            </form>

            <Link href="/internships">
              <Button size="lg" variant="outline" className="inline-flex items-center gap-2">
                Explore All Internships
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to find your dream internship
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <div className="mb-4 text-5xl font-semibold text-primary/70">{item.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {item.step < 3 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-full">
                    <div className="w-12 h-0.5 bg-border" />
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Featured Opportunities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Check out some of our latest and most popular internship positions
            </p>
          </div>

          {loadingOffers ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading recent offers...
              </div>
            </div>
          ) : recentOffers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recentOffers.slice(0, 6).map((internship) => (
                  <InternshipCard key={internship.id} internship={internship} />
                ))}
              </div>

              <div className="text-center">
                <Link href="/internships">
                  <Button size="lg">
                    View All Internships
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <EmptyInternships />
          )}
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-32 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students finding their perfect internship match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/matching">
              <Button size="lg">
                Try Smart Matching
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/internships">
              <Button size="lg" variant="outline">
                Browse Internships
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
