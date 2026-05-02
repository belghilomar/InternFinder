'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

export function SaveButton({ internshipId }: { internshipId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, addSavedInternship, removeSavedInternship } = useAuth()
  const isSaved = user?.savedInternships.includes(internshipId) ?? false

  const handleClick = () => {
    if (!user) {
      const params = new URLSearchParams({ redirect: pathname })
      router.push(`/signin?${params.toString()}`)
      return
    }

    if (isSaved) {
      removeSavedInternship(internshipId)
      return
    }

    addSavedInternship(internshipId)
  }

  return (
    <Button
      variant={isSaved ? 'default' : 'outline'}
      className="w-full mb-6"
      onClick={handleClick}
      aria-pressed={isSaved}
    >
      <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
      {!user ? 'Sign in to Save' : isSaved ? 'Saved' : 'Save for Later'}
    </Button>
  )
}
