'use client'

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react'

export interface User {
  id: string
  email: string
  fullName: string
  skills: string[]
  field: string
  savedInternships: string[]
  isPremium: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => void
  updateUser: (user: User) => void
  addSavedInternship: (internshipId: string) => void
  removeSavedInternship: (internshipId: string) => void
}

interface StoredAccount extends User {
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const SESSION_STORAGE_KEY = 'internfinder.current-user'
const ACCOUNTS_STORAGE_KEY = 'internfinder.accounts'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function readStoredAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedAccounts = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!storedAccounts) {
      return []
    }

    const parsedAccounts = JSON.parse(storedAccounts)
    return Array.isArray(parsedAccounts) ? parsedAccounts : []
  } catch (error) {
    console.error('Failed to read stored accounts:', error)
    window.localStorage.removeItem(ACCOUNTS_STORAGE_KEY)
    return []
  }
}

function writeStoredAccounts(accounts: StoredAccount[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
}

function upsertStoredAccount(nextUser: User, password?: string) {
  const accounts = readStoredAccounts()
  const accountIndex = accounts.findIndex(
    (account) => normalizeEmail(account.email) === normalizeEmail(nextUser.email)
  )

  const nextAccount: StoredAccount = {
    ...nextUser,
    password: password ?? accounts[accountIndex]?.password ?? '',
  }

  if (accountIndex >= 0) {
    accounts[accountIndex] = nextAccount
  } else {
    accounts.push(nextAccount)
  }

  writeStoredAccounts(accounts)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = window.localStorage.getItem(SESSION_STORAGE_KEY)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        window.localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [user])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      const normalizedEmail = normalizeEmail(email)

      if (!normalizedEmail || !password) {
        throw new Error('Email and password are required')
      }

      const account = readStoredAccounts().find(
        (storedAccount) => normalizeEmail(storedAccount.email) === normalizedEmail
      )

      if (!account) {
        throw new Error('No account found for this email')
      }

      if (account.password !== password) {
        throw new Error('Incorrect password')
      }

      const { password: _password, ...storedUser } = account
      setUser(storedUser)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true)

    try {
      const normalizedEmail = normalizeEmail(email)
      const normalizedFullName = fullName.trim()

      if (!normalizedEmail || !password || !normalizedFullName) {
        throw new Error('All fields are required')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (
        readStoredAccounts().some(
          (storedAccount) => normalizeEmail(storedAccount.email) === normalizedEmail
        )
      ) {
        throw new Error('An account with this email already exists')
      }

      const newUser: User = {
        id: Date.now().toString(),
        email: normalizedEmail,
        fullName: normalizedFullName,
        skills: [],
        field: '',
        savedInternships: [],
        isPremium: false,
      }

      upsertStoredAccount(newUser, password)
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    upsertStoredAccount(updatedUser)
    setUser(updatedUser)
  }

  const addSavedInternship = (internshipId: string) => {
    if (user && !user.savedInternships.includes(internshipId)) {
      const updatedUser = {
        ...user,
        savedInternships: [...user.savedInternships, internshipId],
      }

      upsertStoredAccount(updatedUser)
      setUser(updatedUser)
    }
  }

  const removeSavedInternship = (internshipId: string) => {
    if (user) {
      const updatedUser = {
        ...user,
        savedInternships: user.savedInternships.filter((id) => id !== internshipId),
      }

      upsertStoredAccount(updatedUser)
      setUser(updatedUser)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
        addSavedInternship,
        removeSavedInternship,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
