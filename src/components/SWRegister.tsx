'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SWRegister() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    let registration: ServiceWorkerRegistration;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update();
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar ServiceWorker con versione v4 per forzare bypass cache iOS
      navigator.serviceWorker
        .register('/sw-v4.js')
        .then((reg) => {
          registration = reg;
          
          // Verifica aggiornamenti all'avvio
          registration.update();

          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdatePrompt(true);
          }

          // Polling ogni 30 minuti
          updateInterval = setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000);

          // Verifica quando torna in primo piano
          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Rileva nuovi aggiornamenti
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdatePrompt(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });

      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        if (updateInterval) clearInterval(updateInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-4 rounded-[32px] shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <RefreshCw className="text-white animate-spin" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight uppercase tracking-tight">Nuova Versione!</p>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Aggiorna per le novità</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-500/20"
          >
            Aggiorna
          </button>
          <button
            onClick={() => setShowUpdatePrompt(false)}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
