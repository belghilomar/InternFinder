import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export function EmptyInternships() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="rounded-lg bg-card border border-border p-8 text-center max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-lg bg-muted">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">No internships available right now</h3>
        <p className="text-muted-foreground mb-6">
          Check back soon, or browse our career resources while you prepare your next application.
        </p>
        <Button asChild className="w-full">
          <Link href="/resources">Browse Resources</Link>
        </Button>
      </div>
    </div>
  )
}
