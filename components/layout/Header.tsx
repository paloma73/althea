'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'

interface HeaderProps {
  userEmail: string
}

export default function Header({ userEmail }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-border shadow-sm z-10">
      <div />
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-muted-foreground hover:bg-muted/60 transition-colors" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs font-medium text-foreground leading-none">{userEmail}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Praticien</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center shadow-sm flex-shrink-0">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
