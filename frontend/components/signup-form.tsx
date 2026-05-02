'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check, Eye, EyeOff, Loader2, X } from 'lucide-react'

export function SignupForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const router = useRouter()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordStrength = {
    hasMinLength: formData.password.length >= 6,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  }

  const isStrongPassword = Object.values(passwordStrength).filter(Boolean).length >= 3

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!isStrongPassword) {
        throw new Error('Password is not strong enough')
      }

      await signUp(formData.email, formData.password, formData.fullName)
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Join our platform to find your ideal internship</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="foulen fouleni"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {formData.password && (
              <div className="space-y-2 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Password Strength:</p>
                <div className="space-y-1">
                  <StrengthIndicator met={passwordStrength.hasMinLength} label="At least 6 characters" />
                  <StrengthIndicator met={passwordStrength.hasUpperCase} label="Uppercase letter" />
                  <StrengthIndicator met={passwordStrength.hasLowerCase} label="Lowercase letter" />
                  <StrengthIndicator met={passwordStrength.hasNumber} label="Number" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isStrongPassword || formData.password !== formData.confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function StrengthIndicator({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full p-0.5 ${met ? 'bg-green-500' : 'bg-muted-foreground'}`}>
        {met ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-muted" />}
      </div>
      <span className={met ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-muted-foreground'}>
        {label}
      </span>
    </div>
  )
}
