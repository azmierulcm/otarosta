'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPinned, ShoppingBag, Settings2 } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Timeline', path: '/' },
  { icon: MapPinned, label: 'Passport', path: '/profile' },
  { icon: ShoppingBag, label: 'Market', path: '/marketplace' },
  { icon: Settings2, label: 'Settings', path: '/settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/demo')) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-bg/90 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const isActive =
            item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-colors active:bg-surface"
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? 'text-accent' : 'text-text-muted'}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
