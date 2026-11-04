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
    <div className="fixed bottom-[92px] left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-fade-in">
      <div className="h-floating rounded-[16px] p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <RefreshCw className="animate-spin" size={16} />
          </div>
          <div className="min-w-0">
            <p className="h-card-title">Nuova versione</p>
            <p className="h-caption mt-0.5">Aggiorna per le novità</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleUpdate} className="h-btn h-btn-primary px-4">
            Aggiorna
          </button>
          <button
            onClick={() => setShowUpdatePrompt(false)}
            className="h-icon-btn"
            aria-label="Chiudi"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
