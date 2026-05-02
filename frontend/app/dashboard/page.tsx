'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { InternshipCard } from '@/components/internship-card'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, useAuth } from '@/context/auth-context'
import { Bookmark, CheckCircle, Clock, Edit2, Heart, Trash2 } from 'lucide-react'

const profileFields = ['IT', 'Finance', 'Engineering', 'Marketing', 'Design', 'HR'] as const

import { getInternshipById, getMatchedInternships } from '@/lib/api'

function DashboardContent() {
  const { user, removeSavedInternship, updateUser } = useAuth()
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [savedInternships, setSavedInternships] = useState<any[]>([])
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([])
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isRecLoading, setIsRecLoading] = useState(false)

  useEffect(() => {
    async function fetchSaved() {
      if (!user || user.savedInternships.length === 0) {
        setSavedInternships([])
        return
      }

      setIsDataLoading(true)
      try {
        const promises = user.savedInternships.map(id => getInternshipById(id))
        const results = await Promise.all(promises)
        setSavedInternships(results.filter(Boolean))
      } catch (error) {
        console.error('Error fetching saved internships:', error)
      } finally {
        setIsDataLoading(false)
      }
    }
    
    fetchSaved()
  }, [user?.savedInternships])

  useEffect(() => {
    async function fetchRecommended() {
      if (!user || (user.skills.length === 0 && !user.field)) {
        setRecommendedInternships([])
        return
      }

      setIsRecLoading(true)
      try {
        const matches = await getMatchedInternships(user.skills, user.field ? [user.field] : [])
        setRecommendedInternships(matches.map(m => ({ ...m.offer, matchScore: m.matchScore })))
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setIsRecLoading(false)
      }
    }

    fetchRecommended()
  }, [user?.skills, user?.field])

  const handleProfileSave = (profile: Pick<User, 'skills' | 'field'>) => {
    if (!user) {
      return
    }

    updateUser({
      ...user,
      ...profile,
    })
    setShowProfileForm(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user?.fullName}!</h1>
              <p className="text-lg text-muted-foreground">
                Manage your saved internships and view personalized recommendations
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileForm((prev) => !prev)}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showProfileForm && user && (
          <ProfileForm
            user={user}
            onClose={() => setShowProfileForm(false)}
            onSave={handleProfileSave}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <StatCard 
            icon={<Bookmark className="w-6 h-6" />} 
            label="Saved" 
            value={isDataLoading ? '...' : savedInternships.length} 
          />
          <StatCard
            icon={<Heart className="w-6 h-6" />}
            label="Recommended"
            value={isRecLoading ? '...' : recommendedInternships.length}
          />
          <StatCard icon={<Clock className="w-6 h-6" />} label="Applications" value="0" />
          <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Completed" value="0" />
        </div>

        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="saved">Saved Internships</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-12">
            <div className="space-y-6">
              {savedInternships.length > 0 ? (
                <>
                  <p className="text-muted-foreground">
                    You have {savedInternships.length} saved internship
                    {savedInternships.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedInternships.map((internship) => (
                      <div key={internship.id} className="relative">
                        <InternshipCard internship={internship} />
                        <button
                          onClick={() => removeSavedInternship(internship.id)}
                          className="absolute top-4 right-4 p-2 bg-background border border-border rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-6">No saved internships yet</p>
                  <Link href="/internships">
                    <Button>Browse Internships</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="mt-12">
            <div className="space-y-6">
              {recommendedInternships.length > 0 ? (
                <>
                  <p className="text-muted-foreground">
                    Based on your profile, we recommend these {recommendedInternships.length}{' '}
                    internship{recommendedInternships.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendedInternships.map((internship) => (
                      <InternshipCard key={internship.id} internship={internship} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">
                    No internships are available yet. Recommendations will appear once you add real data.
                  </p>
                  <Button variant="outline" onClick={() => setShowProfileForm(true)}>
                    Update My Profile
                  </Button>
                </div>
              )}
              <div className="text-center pt-6">
                <Link href="/matching">
                  <Button variant="outline">Refine Recommendations</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="text-primary/20">{icon}</div>
      </div>
    </div>
  )
}

function ProfileForm({
  user,
  onClose,
  onSave,
}: {
  user: User
  onClose: () => void
  onSave: (profile: Pick<User, 'skills' | 'field'>) => void
}) {
  const [skills, setSkills] = useState(user.skills.join(', '))
  const [field, setField] = useState(user.field)

  const handleSave = () => {
    onSave({
      skills: skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      field,
    })
  }

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle>Update Your Profile</CardTitle>
        <CardDescription>Help us better match you with internships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Skills (comma-separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Python, UI Design"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Field of Interest</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">Select a field</option>
            {profileFields.map((profileField) => (
              <option key={profileField} value={profileField}>
                {profileField}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
