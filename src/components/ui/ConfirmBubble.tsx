'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmBubbleProps {
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  trigger: React.ReactNode;
  className?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const ConfirmBubble = ({
  title = 'Conferma eliminazione',
  message = 'Sei sicuro? Questa azione non può essere annullata.',
  onConfirm,
  onCancel,
  trigger,
  className,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  isLoading = false
}: ConfirmBubbleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onCancel?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onCancel]);

  const modalContent = isOpen && (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(false);
        onCancel?.();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        ref={bubbleRef}
        className={cn(
          "relative w-[90%] max-w-[340px] p-6 bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 mb-2">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{title}</h4>
            <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              disabled={isLoading}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
                setIsOpen(false);
              }}
              className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest bg-red-600 text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              {confirmLabel}
            </button>
            <button
              disabled={isLoading}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onCancel?.();
              }}
              className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-transparent"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="inline-block">
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="cursor-pointer">
        {trigger}
      </div>
      {mounted && isOpen ? createPortal(modalContent, document.body) : null}
    </div>
  );
};
