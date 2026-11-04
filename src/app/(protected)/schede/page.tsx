'use client'

import { useState, useEffect } from 'react'
import { Plus, Dumbbell, Trash2, Calendar, ChevronRight, LogOut, Loader2, ListTodo, Copy, ToggleLeft, ToggleRight } from 'lucide-react'
import { getSchede, eliminaScheda, duplicaScheda, toggleSchedaAttiva } from '@/actions/workout'
import NewPlanModal from '@/components/workout/NewPlanModal'
import EditPlanModal from '@/components/workout/EditPlanModal'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/Toast'
import type { EsercizioCatalogo, EsercizioScheda } from '@/types/workout'

interface Scheda {
  id: string;
  nome: string;
  creato_at: string;
  attiva?: boolean;
  esercizi: (EsercizioScheda & { esercizio: EsercizioCatalogo })[];
}

export default function SchedePage() {
  const [schede, setSchede] = useState<Scheda[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedScheda, setSelectedScheda] = useState<Scheda | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const { toast, showToast, hideToast } = useToast()

  const fetchSchede = async () => {
    setLoading(true)
    const data = await getSchede()
    setSchede(data as unknown as Scheda[])
    setLoading(false)
  }

  useEffect(() => {
    // Caricamento iniziale delle schede: nessun input reattivo da cui derivare lo stato.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchede()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await eliminaScheda(id)
      showToast("Scheda eliminata", "success")
      fetchSchede()
    } catch {
      showToast("Errore eliminazione", "error")
    }
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await duplicaScheda(id)
      showToast("Scheda duplicata!", "success")
      fetchSchede()
    } catch {
      showToast("Errore duplicazione", "error")
    }
  }

  const handleToggleAttiva = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleSchedaAttiva(id, !current)
      setSchede(prev => prev.map(s => s.id === id ? { ...s, attiva: !current } : s))
      showToast(!current ? "Scheda attivata" : "Scheda disattivata", "success")
    } catch {
      showToast("Errore aggiornamento", "error")
    }
  }

  const handleEdit = (scheda: Scheda) => {
    setSelectedScheda(scheda)
    setEditModalOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-canvas pb-nav">
      <div className="max-w-3xl mx-auto px-4 pt-6">

        {/* Header */}
        <header className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="h-label">Allenamento</p>
            <h1 className="h-title mt-1">
              Le Mie <span className="text-accent">Schede</span>
            </h1>
            <p className="h-caption mt-1">Gestisci le tue schede personalizzate</p>
          </div>

          <button
            onClick={handleLogout}
            className="h-icon-btn shrink-0"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-3">
            <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
            <p className="h-caption">Caricamento schede…</p>
          </div>
        ) : schede.length === 0 ? (
          <div className="h-card border-dashed p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-[12px] bg-field flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-7 h-7 text-ink-3" />
            </div>
            <h2 className="h-card-title mb-1">Ancora nessuna scheda</h2>
            <p className="h-caption mb-5">È il momento di creare il tuo primo allenamento personalizzato.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="h-btn h-btn-primary"
            >
              <Plus className="w-4 h-4" />
              Crea nuova scheda
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">

            {/* New Card Trigger */}
            <button
              onClick={() => setModalOpen(true)}
              className="h-card w-full border-dashed flex items-center gap-3 px-3 py-3 mb-3 text-left active:bg-raised transition-colors"
            >
              <span className="w-9 h-9 rounded-[10px] bg-accent/16 text-accent flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </span>
              <span className="h-label text-accent">Nuova scheda</span>
            </button>

            {/* Schede List */}
            {schede.map((scheda) => {
              const attiva = scheda.attiva ?? true

              return (
                <div
                  key={scheda.id}
                  onClick={() => handleEdit(scheda)}
                  className="h-card mb-3 overflow-hidden cursor-pointer active:bg-raised/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 px-3 py-3">

                    {/* Toggle Attiva */}
                    <button
                      onClick={(e) => handleToggleAttiva(scheda.id, attiva, e)}
                      className={cn(
                        'h-icon-btn shrink-0',
                        attiva ? 'text-done' : 'text-ink-3'
                      )}
                      title={attiva ? "Visibile in Allenamento" : "Nascosta da Allenamento"}
                    >
                      {attiva ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>

                    {/* Icona scheda */}
                    <div className={cn(
                      'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0',
                      attiva ? 'bg-accent/16 text-accent' : 'bg-field text-ink-3'
                    )}>
                      <ListTodo className="w-5 h-5" />
                    </div>

                    {/* Titolo + meta */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn('h-card-title truncate', !attiva && 'text-ink-2')}>
                        {scheda.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className="h-label flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span className="tnum normal-case tracking-normal">
                            {new Date(scheda.creato_at).toLocaleDateString('it-IT')}
                          </span>
                        </span>
                        <div className="hidden md:flex flex-wrap gap-1.5 min-w-0">
                          {scheda.esercizi?.slice(0, 3).map((ex, i) => (
                            <span key={i} className="h-chip px-2 py-0.5 text-[11px] truncate">
                              {ex.esercizio?.nome.split(' ').slice(0, 1).join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => handleDuplicate(scheda.id, e)}
                        className="h-icon-btn"
                        title="Duplica"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <ConfirmBubble
                        title="Elimina Scheda"
                        message={`Sei sicuro di voler eliminare "${scheda.nome}"?`}
                        onConfirm={() => handleDelete(scheda.id)}
                        trigger={
                          <button
                            className="h-icon-btn text-danger"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        }
                      />
                      <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewPlanModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => { fetchSchede(); showToast("Scheda creata!", "success"); }} 
      />

      <EditPlanModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchSchede}
        scheda={selectedScheda}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  );
}
