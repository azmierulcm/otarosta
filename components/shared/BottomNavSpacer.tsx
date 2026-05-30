'use client'

import { useAuth } from '@/lib/contexts/AuthContext'

/** Adds bottom padding only when the BottomNav is visible (auth + mobile). */
export function BottomNavSpacer() {
  const { user } = useAuth()
  if (!user) return null
  return <div className="h-20 md:hidden" aria-hidden="true" />
}
