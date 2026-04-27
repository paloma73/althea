'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react'

const nav = [
  { href: '/', label: 'Accueil', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/bilans', label: 'Bilans', icon: FileText },
  { href: '/settings', label: 'Profil', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-[#1a5fa8]' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-[#1a5fa8]' : 'text-muted-foreground')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
