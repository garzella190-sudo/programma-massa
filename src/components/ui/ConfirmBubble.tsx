'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmBubbleProps {
  title?: string
  message?: string
  onConfirm: () => void
  onCancel?: () => void
  trigger: React.ReactNode
  className?: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

/** Conferma per azioni distruttive (sheet stile Hevy). */
export const ConfirmBubble = ({
  title = 'Conferma eliminazione',
  message = 'Sei sicuro? Questa azione non può essere annullata.',
  onConfirm,
  onCancel,
  trigger,
  className,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  isLoading = false,
}: ConfirmBubbleProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onCancel?.()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onCancel])

  const contenuto = isOpen && (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation()
        setIsOpen(false)
        onCancel?.()
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div
        ref={bubbleRef}
        className={cn('relative w-full max-w-[340px] p-5 h-floating rounded-[20px] animate-fade-in', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-[10px] bg-danger/16 text-danger">
            <AlertCircle size={18} />
          </span>
          <div className="min-w-0">
            <h4 className="h-card-title">{title}</h4>
            <p className="h-caption mt-1">{message}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            disabled={isLoading}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
              setIsOpen(false)
            }}
            className="h-btn h-btn-danger w-full"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {confirmLabel}
          </button>
          <button
            disabled={isLoading}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              onCancel?.()
            }}
            className="h-btn h-btn-neutral w-full"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="inline-block">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {mounted && isOpen ? createPortal(contenuto, document.body) : null}
    </div>
  )
}
