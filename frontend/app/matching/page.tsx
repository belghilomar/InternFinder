'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { InternshipCard } from '@/components/internship-card'
import { Button } from '@/components/ui/button'
import { getMatchedInternships } from '@/lib/api'
import { Sparkles, Loader2 } from 'lucide-react'

const skillsData = [
  'JavaScript', 'Python', 'React', 'TypeScript', 'SQL', 'CSS', 'Excel',
  'Data Analysis', 'UI Design', 'Communication', 'Problem Solving',
  'Project Management', 'Marketing', 'Financial Analysis',
]

const fieldsData = ['IT', 'Finance', 'Engineering', 'Marketing', 'Design', 'HR']

export default function MatchingPage() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [matchedInternships, setMatchedInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]
    )
  }

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]
    )
  }

  const handleFindMatches = async () => {
    if (selectedSkills.length > 0 || selectedFields.length > 0) {
      setLoading(true)
      try {
        const matches = await getMatchedInternships(selectedSkills, selectedFields)
        setMatchedInternships(matches)
        setShowResults(true)
      } catch (error) {
        console.error('Matching error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">AI-Powered Matching</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Smart Internship Matching</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us about your skills and interests, and our AI will find the best internship
            matches for you from our live database.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showResults ? (
          <div className="space-y-12">
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Select Your Skills</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {skillsData.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                      selectedSkills.includes(skill)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/50'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Select Your Interest Areas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {fieldsData.map((field) => (
                  <button
                    key={field}
                    onClick={() => toggleField(field)}
                    className={`p-4 rounded-lg border-2 transition-all text-center font-medium ${
                      selectedFields.includes(field)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/50'
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={handleFindMatches}
                disabled={loading || (selectedSkills.length === 0 && selectedFields.length === 0)}
                className="inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Finding matches...' : 'Find My Perfect Match'}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Your Matched Internships</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Based on your profile, here are the best opportunities
              </p>
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Adjust Preferences
              </Button>
            </div>

            {matchedInternships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {matchedInternships.map((match) => (
                  <InternshipCard 
                    key={match.offer.id} 
                    internship={{
                      ...match.offer,
                      domain: 'IT',
                      type: 'Remote',
                      requirements: []
                    } as any} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-6">
                  No matches found in the current database. Try adding more skills or searching for new internships first!
                </p>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/internships">Browse Internships</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
