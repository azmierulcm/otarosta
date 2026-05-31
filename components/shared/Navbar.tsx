'use client'

import React from 'react'
import { LayoutDashboard, BookOpen, ShoppingBag, Settings2, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/':           'My Roster',
  '/passport':   'Passport',
  '/roster':     'Share Card',
  '/marketplace':'Marketplace',
  '/settings':   'Settings',
  '/profile':    'Profile',
}

export const Navbar = () => {
  const { user, signOutUser, openAuthModal } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { label: 'Roster',      href: '/',            icon: LayoutDashboard },
    { label: 'Passport',    href: '/passport',    icon: BookOpen },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { label: 'Settings',    href: '/settings',    icon: Settings2 },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )?.[1] ?? 'Otarosta'

  return (
    <nav className="sticky top-0 w-full bg-bg/90 backdrop-blur-sm border-b border-border z-[100]" style={{ borderBottomWidth: '0.5px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">

          {/* Logo (desktop always; mobile only for guests) */}
          <Link href="/" className={`flex items-center gap-2 hover:opacity-75 transition-opacity shrink-0 ${user ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex flex-col gap-[3px]">
              <div className="w-5 h-1 bg-accent/20 rounded-sm" />
              <div className="w-5 h-2 bg-accent/50 rounded-sm" />
              <div className="w-5 h-4 bg-accent rounded-sm" />
            </div>
            <span className="text-[22px] font-bold text-text tracking-tight">Otarosta</span>
          </Link>

          {/* Mobile page title — shown only for authenticated users */}
          {user && (
            <span className="md:hidden text-[17px] font-black tracking-tight text-text">
              {pageTitle}
            </span>
          )}

          {/* Mobile: auth buttons for guests only */}
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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-pill)] text-[13px] font-medium transition-colors ${
                      isActive(link.href)
                        ? 'text-accent bg-accent-soft'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    }`}
                  >
                    <link.icon size={15} />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={signOutUser}
                  className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-pill)] text-[13px] text-danger/70 hover:text-danger hover:bg-danger/5 border border-transparent hover:border-danger/20 transition-colors"
                >
                  <LogOut size={14} />
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
