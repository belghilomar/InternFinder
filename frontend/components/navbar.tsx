'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { Moon, Sun, LogOut, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

function NavbarContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">I</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">InternFinder</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/internships" className="text-foreground hover:text-primary transition-colors">
              Internships
            </Link>
            <Link href="/matching" className="text-foreground hover:text-primary transition-colors">
              Smart Match
            </Link>
            <Link href="/resources" className="text-foreground hover:text-primary transition-colors">
              Resources
            </Link>
            <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
            )}

            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm">{user.fullName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex gap-2 text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export function Navbar() {
  return <NavbarContent />
}
