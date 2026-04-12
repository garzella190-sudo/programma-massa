'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBubbleProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmLabel?: string;
  type?: 'error' | 'info' | 'success';
}

export const AlertBubble = ({
  isOpen,
  title = 'Attenzione',
  message,
  onClose,
  confirmLabel = 'Ho capito',
  type = 'error'
}: AlertBubbleProps) => {
  const [mounted, setMounted] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        ref={bubbleRef}
        className={cn(
          "relative w-[90%] max-w-[340px] p-8 bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className={cn(
              "p-4 rounded-2xl mb-2",
              type === 'error' ? "bg-red-50 dark:bg-red-900/20 text-red-500" :
              type === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
              "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
            )}>
              <AlertCircle size={32} />
            </div>
            <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{title}</h4>
            <div className="text-sm font-bold text-zinc-400 dark:text-zinc-500 leading-relaxed px-2 overflow-auto max-h-[150px] w-full text-center">
              {typeof message === 'object' ? JSON.stringify(message, null, 2) : message}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={cn(
              "w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
              type === 'error' ? "bg-zinc-900 dark:bg-zinc-100 dark:text-black" : "bg-blue-600"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
