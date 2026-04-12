'use client'

import { useState, useEffect } from 'react'
import { Plus, Dumbbell, Trash2, Calendar, ChevronRight, LogOut, Loader2, ListTodo, Copy, Edit3, ToggleLeft, ToggleRight } from 'lucide-react'
import { getSchede, eliminaScheda, duplicaScheda, toggleSchedaAttiva } from '@/actions/workout'
import NewPlanModal from '@/components/workout/NewPlanModal'
import EditPlanModal from '@/components/workout/EditPlanModal'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Toast, useToast } from '@/components/ui/Toast'

interface Scheda {
  id: string;
  nome: string;
  creato_at: string;
  attiva?: boolean;
  esercizi: any[];
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
    setSchede(data as Scheda[])
    setLoading(false)
  }

  useEffect(() => {
    fetchSchede()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen p-4 md:p-8 pb-32 bg-[#f4f4f4] dark:bg-[#09090b] transition-colors duration-500">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            Le Mie <span className="text-blue-600 dark:text-blue-500">Schede</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">Gestisci le tue schede personalizzate</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-all shadow-sm border border-zinc-200 dark:border-zinc-800"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p className="font-bold text-sm uppercase tracking-widest">Caricamento schede...</p>
          </div>
        ) : schede.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 animate-fade-in shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-2">Ancora nessuna scheda</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto">È il momento di creare il tuo primo allenamento personalizzato!</p>
            <button 
              onClick={() => setModalOpen(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            >
              Crea Nuova Scheda
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in max-w-4xl mx-auto">
            {/* New Card Trigger */}
            <button 
              onClick={() => setModalOpen(true)}
              className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border-2 border-dashed border-zinc-100 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all flex items-center gap-6 group shadow-sm w-full"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm shrink-0">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500">Nuova Scheda</span>
            </button>

            {/* Schede List */}
            {schede.map((scheda) => (
              <div 
                key={scheda.id}
                onClick={() => handleEdit(scheda)}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden flex items-center gap-5 cursor-pointer w-full"
              >
                {/* Toggle Attiva */}
                <button
                  onClick={(e) => handleToggleAttiva(scheda.id, scheda.attiva ?? true, e)}
                  className={cn(
                    "shrink-0 transition-all",
                    (scheda.attiva ?? true) ? "text-green-500" : "text-zinc-300 dark:text-zinc-600"
                  )}
                  title={(scheda.attiva ?? true) ? "Visibile in Allenamento" : "Nascosta da Allenamento"}
                >
                  {(scheda.attiva ?? true) ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>

                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "p-3 rounded-2xl transition-all shrink-0",
                    (scheda.attiva ?? true) 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white" 
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}>
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-lg font-black leading-tight transition-colors uppercase tracking-tight truncate",
                      (scheda.attiva ?? true) 
                        ? "text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-500"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}>{scheda.nome}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {new Date(scheda.creato_at).toLocaleDateString('it-IT')}
                      </div>
                      <div className="hidden md:flex flex-wrap gap-2">
                        {scheda.esercizi?.slice(0, 3).map((ex: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded-md text-[9px] font-black uppercase text-zinc-400 border border-zinc-100 dark:border-zinc-700">
                            {ex.nome.split(' ').slice(0, 1).join(' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 shrink-0">
                  {/* Action Bar */}
                  <div className="flex items-center gap-1.5 transition-all">
                    <button 
                      onClick={(e) => handleDuplicate(scheda.id, e)}
                      className="p-2 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
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
                          className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 text-blue-600 dark:text-blue-500 font-black text-[10px] uppercase tracking-widest">
                      <Edit3 className="w-4 h-4" /> Gestisci
                    </div>
                    <ChevronRight className="w-6 h-6 text-zinc-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
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
