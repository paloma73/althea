'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function BilanFormSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors text-left"
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            open ? 'rotate-180' : ''
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}
