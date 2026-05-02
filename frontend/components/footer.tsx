import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">I</span>
              </div>
              <span className="font-bold">InternFinder</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Find your perfect internship with AI-powered matching.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/internships" className="hover:text-foreground transition-colors">
                  Browse Internships
                </Link>
              </li>
              <li>
                <Link href="/matching" className="hover:text-foreground transition-colors">
                  Smart Matching
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/resources" className="hover:text-foreground transition-colors">
                  Learning Center
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="mailto:hello@internfinder.dev" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <span>Privacy Policy (coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
