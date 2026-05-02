'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { InternshipCard } from '@/components/internship-card'
import { EmptyInternships } from '@/components/empty-internships'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { tunisianCities } from '@/lib/mock-data'
import { searchInternships, Internship } from '@/lib/api'
import { Search, X, Loader2 } from 'lucide-react'

interface InternshipsClientProps {
  initialKeyword: string
  initialTypes: string[]
  initialDomains: string[]
  initialLocations: string[]
}

export function InternshipsClient({
  initialKeyword,
  initialTypes,
  initialDomains,
  initialLocations,
}: InternshipsClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialKeyword)
  const [debouncedQuery, setDebouncedQuery] = useState(initialKeyword)
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(false)
  const [isScraping, setIsScraping] = useState(false)

  const [selectedTypes, setSelectedTypes] = useState(initialTypes)
  const [selectedDomains, setSelectedDomains] = useState(initialDomains)
  const [selectedLocations, setSelectedLocations] = useState(initialLocations)

  const types = ['Remote', 'On-site', 'Hybrid']
  const domains = ['IT', 'Finance', 'Engineering', 'Marketing', 'Design', 'HR']
  const locations = tunisianCities

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchData = useCallback(async (query: string, isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      if (query.trim()) {
        const data = await searchInternships(query)
        setInternships(Array.isArray(data?.results) ? data.results : [])
        setIsScraping(data.is_scraping)
      } else {
        const { getRecentOffers } = await import('@/lib/api')
        const recent = await getRecentOffers()
        setInternships(Array.isArray(recent) ? recent : [])
        setIsScraping(false)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(debouncedQuery)
  }, [debouncedQuery, fetchData])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isScraping) {
      interval = setInterval(() => {
        fetchData(debouncedQuery, true)
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isScraping, debouncedQuery, fetchData])

  const filteredInternships = useMemo(() => {
    if (!internships || !Array.isArray(internships)) return [];
    return internships.filter((internship) => {
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(t =>
        (internship.description || '').toLowerCase().includes(t.toLowerCase()) ||
        internship.title.toLowerCase().includes(t.toLowerCase())
      )

      const matchesDomain = selectedDomains.length === 0 || selectedDomains.some(d =>
        (internship.description || '').toLowerCase().includes(d.toLowerCase()) ||
        internship.title.toLowerCase().includes(d.toLowerCase())
      )

      const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(internship.location)

      return matchesType && matchesDomain && matchesLocation
    })
  }, [internships, selectedDomains, selectedLocations, selectedTypes])

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]))
  }

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((item) => item !== domain) : [...prev, domain]
    )
  }

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((item) => item !== location) : [...prev, location]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedDomains([])
    setSelectedLocations([])
  }

  const hasActiveFilters =
    searchQuery.length > 0 ||
    selectedTypes.length > 0 ||
    selectedDomains.length > 0 ||
    selectedLocations.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Internship Opportunities</h1>
              <p className="text-lg text-muted-foreground">
                Browse {(internships || []).length} real-time internships found for you
              </p>
            </div>
            
            <div className="w-full md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search internships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/50 bg-muted/30 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8">
          <div className="w-full">
            <div className="mb-8 flex flex-col items-center justify-center gap-4">
              <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredInternships.length}</span> results
                  </p>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters} 
                      className="text-xs h-8 hover:text-destructive"
                    >
                      <X className="w-3 h-3 mr-1" /> Clear all
                    </Button>
                  )}
                </div>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              </div>

              {isScraping && (
                <div className="flex items-center flex-col gap-3 p-6 rounded-2xl bg-primary/5 border border-primary/10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-3 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold tracking-tight">Searching in progress...</span>
                  </div>
                  <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-fast" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    We are currently scanning multiple sources to find the latest offers for you.
                  </p>
                </div>
              )}
            </div>

            {filteredInternships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredInternships.map((internship) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                  />
                ))}
              </div>
            ) : !loading && !isScraping ? (
              <EmptyInternships />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                {!isScraping && (
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-primary/10 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {isScraping ? (
                   <div className="space-y-4">
                     <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                           <Search className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                     </div>
                     <h2 className="text-2xl font-bold text-foreground">Analyzing the Web</h2>
                     <p className="text-muted-foreground max-w-sm">
                       Our engine is currently visiting top Tunisian platforms to find relevant internships for you. Hang tight!
                     </p>
                   </div>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-foreground mb-2">Fetching results...</p>
                    <p className="text-muted-foreground">This will only take a moment.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
