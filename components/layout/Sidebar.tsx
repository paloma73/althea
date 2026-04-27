'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, Settings, Activity } from 'lucide-react'

const nav = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/bilans', label: 'Bilans', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#0B1E35] text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-900/40">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-white tracking-wide">Althea</p>
          <p className="text-[10px] text-blue-200/50 tracking-widest uppercase">Clinique</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-blue-200/40 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-blue-100/50 hover:bg-white/5 hover:text-blue-100'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-full" />
              )}
              <Icon className={cn('w-4 h-4 flex-shrink-0 ml-1', active ? 'text-cyan-400' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bas */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/settings"
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            pathname === '/settings'
              ? 'bg-white/10 text-white'
              : 'text-blue-100/50 hover:bg-white/5 hover:text-blue-100'
          )}
        >
          {pathname === '/settings' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-full" />
          )}
          <Settings className={cn('w-4 h-4 flex-shrink-0 ml-1', pathname === '/settings' ? 'text-cyan-400' : '')} />
          Paramètres
        </Link>
      </div>
    </aside>
  )
}
