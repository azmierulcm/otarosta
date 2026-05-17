'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'

export interface Profile {
  id: string
  full_name?: string
  rank?: string
  airline?: string
  fleet?: string
  base?: string
  bio?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isAuthModalOpen: boolean
  authView: 'login' | 'signup'
  setProfile: (profile: Profile | null) => void
  openAuthModal: (view?: 'login' | 'signup') => void
  closeAuthModal: () => void
  setAuthView: (view: 'login' | 'signup') => void
  signOutUser: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      // Unblock the UI as soon as auth state is known — don't wait for
      // the profile fetch. If getDoc throws or hangs, setIsLoading(false)
      // would never run and the spinner would be stuck forever.
      setIsLoading(false)

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'profiles', firebaseUser.uid))
          if (snap.exists()) {
            setProfile({ id: firebaseUser.uid, ...snap.data() } as Profile)
          }
        } catch {
          // Profile unavailable — proceed without it, fallbacks handle display
        }
      } else {
        setProfile(null)
      }
    })
    return unsubscribe
  }, [])

  const openAuthModal = (view: 'login' | 'signup' = 'signup') => {
    setAuthView(view)
    setIsAuthModalOpen(true)
  }
  const closeAuthModal = () => setIsAuthModalOpen(false)
  const signOutUser = () => signOut(auth)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthModalOpen,
        authView,
        setProfile,
        openAuthModal,
        closeAuthModal,
        setAuthView,
        signOutUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
