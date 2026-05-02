import { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/signup-form'

type PageSearchParams = Promise<{
  redirect?: string | string[]
}>

function getSafeRedirect(value?: string | string[]) {
  const redirect = Array.isArray(value) ? value[0] : value
  return redirect?.startsWith('/') ? redirect : '/dashboard'
}

export const metadata: Metadata = {
  title: 'Create Account - Smart Internship Finder',
  description: 'Create a new account to get started',
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const resolvedSearchParams = await searchParams
  const redirectTo = getSafeRedirect(resolvedSearchParams.redirect)

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              InternFinder
            </h1>
          </Link>
          <p className="text-muted-foreground">Find your perfect internship opportunity</p>
        </div>

        <SignupForm redirectTo={redirectTo} />

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-primary hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
