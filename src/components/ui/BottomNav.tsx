'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Dumbbell, Search, UtensilsCrossed, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Schede', icon: ClipboardList, path: '/schede' },
  { label: 'Workout', icon: Dumbbell, path: '/allenamento' },
  { label: 'Esercizi', icon: Search, path: '/esercizi' },
  { label: 'Dieta', icon: UtensilsCrossed, path: '/dieta' },
  { label: 'Profilo', icon: User, path: '/profilo' },
]

/**
 * Bottom tab bar stile Hevy: 5 voci, label sempre visibili,
 * stato attivo = colore accent + soft fill sull'icona (nessuna pillola).
 */
export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-canvas/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] print:hidden">
      <div className="max-w-lg mx-auto flex items-stretch h-[68px] px-1">
        {NAV_ITEMS.map((item) => {
          const attivo = pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              aria-current={attivo ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0"
            >
              <span
                className={cn(
                  'flex items-center justify-center w-9 h-7 rounded-[8px] transition-colors',
                  attivo ? 'bg-accent/16 text-accent' : 'text-ink-3',
                )}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={attivo ? 2.4 : 2} />
              </span>
              <span className={cn('h-tab-label truncate max-w-full px-0.5', attivo ? 'text-accent' : 'text-ink-3')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
