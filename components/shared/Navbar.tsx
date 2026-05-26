'use client'

import React from 'react'
import { LayoutDashboard, MapPinned, ShoppingBag, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export const Navbar = () => {
  const { user, signOutUser, openAuthModal } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { label: 'Timeline', href: '/', icon: LayoutDashboard },
    { label: 'Passport', href: '/profile', icon: MapPinned },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { label: 'Settings', href: '/settings', icon: Settings2 },
  ]

  return (
    <nav className="sticky top-0 w-full bg-bg/90 backdrop-blur-sm border-b border-border z-[100]" style={{ borderBottomWidth: '0.5px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo + Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          >
            <div className="flex flex-col gap-[3px]">
              <div className="w-5 h-1 bg-accent/20 rounded-sm" />
              <div className="w-5 h-2 bg-accent/50 rounded-sm" />
              <div className="w-5 h-4 bg-accent rounded-sm" />
            </div>
            <span className="text-[22px] font-bold text-text tracking-tight">Otarosta</span>
          </Link>

          {/* Mobile auth buttons — only shown to unauthenticated visitors */}
          {!user && (
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 rounded-[var(--radius-pill)] text-[13px] font-medium text-text-muted hover:bg-surface transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-1.5 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-bold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
              >
                Get started
              </button>
            </div>
          )}

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] text-[14px] font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-accent bg-accent-soft'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={signOutUser}
                  className="ml-2 px-4 py-2 rounded-[var(--radius-pill)] text-[14px] text-text-muted hover:text-text hover:bg-surface transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-[var(--radius-pill)] text-[14px] text-text hover:bg-surface transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-bold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
                >
                  Upload my roster — it&apos;s free
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
