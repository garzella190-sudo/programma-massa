'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  isVisible: boolean
  onClose: () => void
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

const ACCENT = {
  success: 'text-done',
  error: 'text-danger',
  info: 'text-accent',
} as const

export const Toast = ({ message, type = 'success', isVisible, onClose }: ToastProps) => {
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setVisibile(false)
      return
    }
    setVisibile(true)
    const timer = setTimeout(() => {
      setVisibile(false)
      setTimeout(onClose, 200)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isVisible, onClose])

  if (!isVisible && !visibile) return null

  const Icona = ICONS[type]

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed left-1/2 -translate-x-1/2 bottom-[92px] z-[200] pointer-events-none transition-all duration-200',
        visibile ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2.5 h-floating rounded-[12px] px-3.5 py-2.5 max-w-[90vw]">
        <Icona className={cn('w-4 h-4 shrink-0', ACCENT[type])} />
        <p className="text-[14px] font-semibold text-ink truncate">{message}</p>
        <button
          onClick={() => {
            setVisibile(false)
            setTimeout(onClose, 200)
          }}
          className="ml-1 p-1 text-ink-3 hover:text-ink"
          aria-label="Chiudi notifica"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }))
  }

  return { toast, showToast, hideToast }
}
