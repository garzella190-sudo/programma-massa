'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  isVisible: boolean
  onClose: () => void
}

export const Toast = ({ message, type = 'success', isVisible, onClose }: ToastProps) => {
  const [internalVisible, setInternalVisible] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setInternalVisible(true)
      const timer = setTimeout(() => {
        setInternalVisible(false)
        setTimeout(onClose, 300)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setInternalVisible(false)
    }
  }, [isVisible, onClose])

  if (!isVisible && !internalVisible) return null

  return (
    <div className={cn(
      "fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 transform",
      internalVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
    )}>
      <div className={cn(
        "flex items-center gap-3 px-6 py-4 rounded-[20px] shadow-2xl backdrop-blur-md border",
        type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" :
        type === 'error' ? "bg-red-500/90 border-red-400 text-white" :
        "bg-zinc-800/90 border-zinc-700 text-white"
      )}>
        {type === 'success' && <CheckCircle2 size={20} className="animate-in zoom-in duration-300" />}
        {type === 'error' && <AlertCircle size={20} className="animate-in zoom-in duration-300" />}
        <p className="font-bold text-sm tracking-tight whitespace-nowrap">{message}</p>
        <button onClick={() => { setInternalVisible(false); setTimeout(onClose, 300); }} className="ml-2 hover:opacity-70 p-1">
          <X size={16} />
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
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return { toast, showToast, hideToast }
}
