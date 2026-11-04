'use client'

import { useState, useEffect, useRef } from 'react'
import { getSchede, completaAllenamento, getStoricoEsercizio } from '@/actions/workout'
import { EsercizioCatalogo, SchedaAllenamento, EsercizioScheda, TipoSerie, SerieInput } from '@/types/workout'
import { Dumbbell, Plus, Trash2, Check, Timer, Play, X, Loader2, HelpCircle, Save, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast, Toast } from '@/components/ui/Toast'
import { ExercisePickerModal } from './ExercisePickerModal'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { cn } from '@/lib/utils'

interface LiveExercise {
  id: string; // temp ID
  esercizio: EsercizioCatalogo;
  serie: {
    id: string; // temp ID
    tipo: TipoSerie;
    peso: number;
    reps: number;
    completed: boolean;
    prevInfo?: string;
  }[]
  recupero: number;
}

let nextId = 0;
const genId = () => `liveex-${Date.now()}-${nextId++}`;

export default function LiveWorkout() {
  const [schede, setSchede] = useState<(SchedaAllenamento & { esercizi: (EsercizioScheda & { esercizio: EsercizioCatalogo })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [workoutName, setWorkoutName] = useState('Nuovo Allenamento')
  const [notes, setNotes] = useState('')
  const [esercizi, setEsercizi] = useState<LiveExercise[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  // Modals
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  
  // Timer di recupero
  const [restSeconds, setRestSeconds] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [restActive, setRestActive] = useState(false)

  const { toast, showToast, hideToast } = useToast()
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Carica le schede/routine per l'avvio
  useEffect(() => {
    async function load() {
      try {
        const data = await getSchede()
        setSchede(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Timer globale dell'allenamento
  useEffect(() => {
    if (isStarted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsedSeconds(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isStarted])

  // Timer di recupero
  useEffect(() => {
    if (restActive && restSeconds > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSeconds(prev => prev - 1)
      }, 1000)
    } else if (restSeconds === 0 && restActive) {
      setRestActive(false)
      // Vibrate + beep
      if (typeof window !== 'undefined') {
        if (navigator.vibrate) navigator.vibrate([400, 200, 400])
        try {
          const AudioCtor: typeof AudioContext =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          const audioCtx = new AudioCtor()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, audioCtx.currentTime)
          gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2)
          osc.stop(audioCtx.currentTime + 1.5)
        } catch (e) {}
      }
      showToast("⏱ Recupero terminato!", "success")
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }
  }, [restActive, restSeconds])

  // Avvia allenamento
  const handleStartWorkout = async (templateId: string | null) => {
    const now = new Date()
    setStartTime(now)
    setSelectedTemplateId(templateId)
    
    if (templateId) {
      const template = schede.find(s => s.id === templateId)
      if (template) {
        setWorkoutName(template.nome)
        // Mappa gli esercizi del template
        const mappedExs: LiveExercise[] = []
        for (const te of template.esercizi) {
          // Cerca storico carichi per consigliare peso precedente
          let prevInfo = ''
          try {
            const history = await getStoricoEsercizio(te.esercizio_id)
            if (history && history.length > 0) {
              const lastSet = history[0]
              prevInfo = `${lastSet.peso}kg x ${lastSet.reps}`
            }
          } catch (e) {
            console.error(e)
          }

          const serie = Array.from({ length: te.serie_target }, () => ({
            id: genId(),
            tipo: 'Normal' as TipoSerie,
            peso: 0,
            reps: 10,
            completed: false,
            prevInfo: prevInfo || undefined
          }))

          mappedExs.push({
            id: genId(),
            esercizio: te.esercizio,
            serie,
            recupero: te.recupero_target
          })
        }
        setEsercizi(mappedExs)
      }
    } else {
      setWorkoutName('Allenamento Libero')
      setEsercizi([])
    }
    setIsStarted(true)
  }

  // Aggiungi esercizio a sessione in corso
  const handleAddExerciseToLive = async (ex: EsercizioCatalogo) => {
    let prevInfo = ''
    try {
      const history = await getStoricoEsercizio(ex.id)
      if (history && history.length > 0) {
        const lastSet = history[0]
        prevInfo = `${lastSet.peso}kg x ${lastSet.reps}`
      }
    } catch (e) {}

    const newEx: LiveExercise = {
      id: genId(),
      esercizio: ex,
      serie: [{
        id: genId(),
        tipo: 'Normal',
        peso: 0,
        reps: 10,
        completed: false,
        prevInfo: prevInfo || undefined
      }],
      recupero: 60
    }
    setEsercizi(prev => [...prev, newEx])
    showToast(`${ex.nome} aggiunto`, 'success')
  }

  // Cambia tipo serie
  const toggleSetType = (exId: string, setId: string, currentType: TipoSerie) => {
    const types: TipoSerie[] = ['Normal', 'Warmup', 'Drop', 'Failure']
    const nextIdx = (types.indexOf(currentType) + 1) % types.length
    const nextType = types[nextIdx]

    setEsercizi(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          serie: ex.serie.map(s => s.id === setId ? { ...s, tipo: nextType } : s)
        }
      }
      return ex
    }))
  }

  // Aggiungi serie
  const handleAddSet = (exId: string) => {
    setEsercizi(prev => prev.map(ex => {
      if (ex.id === exId) {
        const lastSet = ex.serie[ex.serie.length - 1]
        return {
          ...ex,
          serie: [...ex.serie, {
            id: genId(),
            tipo: 'Normal',
            peso: lastSet ? lastSet.peso : 0,
            reps: lastSet ? lastSet.reps : 10,
            completed: false,
            prevInfo: lastSet ? lastSet.prevInfo : undefined
          }]
        }
      }
      return ex
    }))
  }

  // Rimuovi serie
  const handleRemoveSet = (exId: string, setId: string) => {
    setEsercizi(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          serie: ex.serie.filter(s => s.id !== setId)
        }
      }
      return ex
    }))
  }

  // Rimuovi intero esercizio
  const handleRemoveExercise = (exId: string) => {
    setEsercizi(prev => prev.filter(ex => ex.id !== exId))
  }

  // Logga completamento serie
  const handleCheckSet = (exId: string, setId: string, completed: boolean, recupero: number) => {
    setEsercizi(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          serie: ex.serie.map(s => s.id === setId ? { ...s, completed } : s)
        }
      }
      return ex
    }))

    // Se spuntata a True, avvia timer recupero
    if (completed && recupero > 0) {
      setRestTotal(recupero)
      setRestSeconds(recupero)
      setRestActive(true)
    }
  }

  // Modifica valori peso e reps
  const handleUpdateSetValues = (exId: string, setId: string, fields: { peso?: number; reps?: number }) => {
    setEsercizi(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          serie: ex.serie.map(s => s.id === setId ? { ...s, ...fields } : s)
        }
      }
      return ex
    }))
  }

  // Completa sessione
  const handleFinishWorkout = async () => {
    if (esercizi.length === 0) {
      showToast("Aggiungi almeno un esercizio", "error")
      return
    }

    const anyCompleted = esercizi.some(ex => ex.serie.some(s => s.completed))
    if (!anyCompleted) {
      showToast("Spunta almeno una serie per salvare", "error")
      return
    }

    setLoading(true)
    try {
      const now = new Date()
      // Filtra solo le serie completate
      const payload = esercizi
        .map(ex => ({
          esercizio_id: ex.esercizio.id,
          serie: ex.serie
            .filter(s => s.completed)
            .map(s => ({
              tipo: s.tipo,
              peso: s.peso,
              reps: s.reps
            }))
        }))
        .filter(ex => ex.serie.length > 0)

      const res = await completaAllenamento(
        workoutName,
        notes || null,
        startTime!.toISOString(),
        now.toISOString(),
        selectedTemplateId,
        payload
      )

      if (res.success) {
        showToast("Allenamento salvato con successo!", "success")
        setIsStarted(false)
        setEsercizi([])
        setNotes('')
        setWorkoutName('Nuovo Allenamento')
      } else {
        showToast(res.error || "Errore durante il salvataggio", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Errore di rete", "error")
    } finally {
      setLoading(false)
    }
  }

  // Formatta minuti/secondi
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].filter(Boolean).join(':')
  }

  // Metriche derivate per l'header live (solo presentazione)
  const serieCompletate = esercizi.reduce((acc, ex) => acc + ex.serie.filter(s => s.completed).length, 0)
  const serieTotali = esercizi.reduce((acc, ex) => acc + ex.serie.length, 0)
  const volumeTotale = esercizi.reduce(
    (acc, ex) => acc + ex.serie.filter(s => s.completed).reduce((v, s) => v + s.peso * s.reps, 0),
    0
  )
  const restPercent = restTotal > 0 ? Math.max(0, Math.min(100, (restSeconds / restTotal) * 100)) : 0

  if (loading && !isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-ink-3">
        <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
        <p className="h-caption">Caricamento…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-nav">
        {!isStarted ? (
          /* SCHERMATA DI INIZIO */
          <div className="space-y-6">
            <header>
              <p className="h-label">Nuova sessione</p>
              <h1 className="h-title mt-1">Avvia allenamento</h1>
              <p className="h-caption mt-1">Scegli una routine o inizia una sessione libera</p>
            </header>

            {/* Allenamento Vuoto */}
            <button
              onClick={() => handleStartWorkout(null)}
              className="h-btn h-btn-primary w-full"
            >
              <Play className="w-4 h-4 fill-white" /> Inizia sessione libera
            </button>

            {/* Lista Routine */}
            <div>
              <h2 className="h-label mb-2">Le tue routine</h2>
              {schede.length === 0 ? (
                <div className="h-card border-dashed p-8 text-center">
                  <Dumbbell className="w-7 h-7 text-ink-3 mx-auto mb-3" />
                  <p className="h-caption">Non hai ancora creato nessuna routine.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {schede.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleStartWorkout(s.id)}
                      className="h-card w-full p-3.5 flex items-center gap-3 text-left transition-colors hover:border-accent/50 active:bg-raised"
                    >
                      <span className="w-10 h-10 rounded-[10px] bg-raised text-accent flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="h-card-title block truncate">{s.nome}</span>
                        <span className="h-label block mt-1 normal-case tracking-normal">
                          {s.esercizi?.length || 0} esercizi
                        </span>
                      </span>
                      <span className="shrink-0 text-ink-3">
                        <Play className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* WORKOUT ATTIVO (LIVE DIARIO) */
          <div className="space-y-3 animate-fade-in">
            {/* Header Live Timer */}
            <div className="h-card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="h-label">Sessione in corso</p>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="mt-1 w-full max-w-[220px] sm:max-w-xs bg-transparent border-b border-transparent focus:border-accent outline-none text-[18px] font-bold tracking-[-0.2px] text-ink transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ConfirmBubble
                    title="Annulla Allenamento"
                    message="Sei sicuro di voler eliminare la sessione corrente? Non verrà salvata."
                    onConfirm={() => setIsStarted(false)}
                    trigger={
                      <button
                        className="h-icon-btn hover:text-danger"
                        title="Annulla allenamento"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    }
                  />
                  <button
                    onClick={handleFinishWorkout}
                    disabled={loading}
                    className="h-btn h-btn-primary px-4"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salva
                  </button>
                </div>
              </div>

              {/* Metriche durata / serie / volume */}
              <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-line">
                <div>
                  <p className="h-label">Durata</p>
                  <p className="h-metric mt-1 flex items-center gap-1.5 text-accent">
                    <Timer className="w-3.5 h-3.5" />
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="h-label">Serie</p>
                  <p className="h-metric mt-1">
                    {serieCompletate}
                    <span className="text-ink-3">/{serieTotali}</span>
                  </p>
                </div>
                <div>
                  <p className="h-label">Volume</p>
                  <p className="h-metric mt-1">
                    {volumeTotale.toLocaleString('it-IT')}
                    <span className="text-[12px] font-semibold text-ink-2"> kg</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Note Allenamento */}
            <div className="h-card p-3.5">
              <label className="h-label mb-1.5 block">Note allenamento</label>
              <textarea
                placeholder="Aggiungi dettagli sulla sessione..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="h-field resize-none"
              />
            </div>

            {/* Lista Esercizi Live */}
            <div className="space-y-3">
              {esercizi.map((ex) => (
                <div key={ex.id} className="h-card overflow-hidden">
                  {/* Nome esercizio intestazione */}
                  <div className="flex items-center gap-3 px-3.5 py-3 border-b border-line">
                    <span className="w-10 h-10 rounded-[10px] bg-raised text-accent flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="h-item truncate">{ex.esercizio.nome}</h3>
                      <p className="h-label mt-1">
                        {ex.esercizio.gruppo_muscolare}
                        <span className="text-ink-3 normal-case tracking-normal"> · rec. {ex.recupero}s</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="h-icon-btn hover:text-danger shrink-0"
                      title="Rimuovi esercizio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Tabella log serie */}
                  {/* Header Tabella */}
                  <div className="grid grid-cols-12 gap-1.5 items-center px-3 pb-1.5 pt-2.5 border-b border-line">
                    <div className="col-span-2 h-label text-center">Serie</div>
                    <div className="col-span-3 h-label text-center">Precedente</div>
                    <div className="col-span-3 h-label text-center">Kg</div>
                    <div className="col-span-2 h-label text-center">Reps</div>
                    <div className="col-span-2 h-label text-center">✓</div>
                  </div>

                  {/* Righe Serie */}
                  {ex.serie.map((s, sIdx) => (
                    <div
                      key={s.id}
                      className={cn(
                        'grid grid-cols-12 gap-1.5 items-center px-3 py-2 border-b border-line/60 last:border-0 transition-colors',
                        s.completed && 'h-row-done'
                      )}
                    >
                      {/* Tipo / Indice */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggleSetType(ex.id, s.id, s.tipo)}
                          className={cn(
                            'w-9 h-9 rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-colors',
                            s.tipo === 'Normal' && 'bg-field text-ink-2',
                            s.tipo === 'Warmup' && 'bg-accent-soft text-accent',
                            s.tipo === 'Drop' && 'bg-raised text-ink-2',
                            s.tipo === 'Failure' && 'bg-raised text-ink'
                          )}
                          title="Cambia tipo serie (Normal, Warmup, Drop, Failure)"
                        >
                          {s.tipo === 'Normal' ? sIdx + 1 : s.tipo[0]}
                        </button>
                      </div>

                      {/* Precedente */}
                      <div className="col-span-3 h-caption text-ink-3 text-center truncate">
                        {s.prevInfo || '—'}
                      </div>

                      {/* Input Peso */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0"
                          value={s.peso === 0 ? '' : s.peso}
                          onChange={(e) => handleUpdateSetValues(ex.id, s.id, { peso: parseFloat(e.target.value) || 0 })}
                          disabled={s.completed}
                          className="w-full h-9 bg-field rounded-[8px] border border-transparent text-center h-cell text-ink placeholder:text-ink-3 outline-none focus:border-accent disabled:opacity-70 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Input Reps */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={s.reps === 0 ? '' : s.reps}
                          onChange={(e) => handleUpdateSetValues(ex.id, s.id, { reps: parseInt(e.target.value) || 0 })}
                          disabled={s.completed}
                          className="w-full h-9 bg-field rounded-[8px] border border-transparent text-center h-cell text-ink placeholder:text-ink-3 outline-none focus:border-accent disabled:opacity-70 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Checkbox completamento */}
                      <div className="col-span-2 flex justify-center">
                        {s.completed ? (
                          <button
                            onClick={() => handleCheckSet(ex.id, s.id, false, ex.recupero)}
                            className="w-10 h-10 rounded-[8px] bg-done text-white flex items-center justify-center transition-colors active:opacity-90"
                            title="Serie completata"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckSet(ex.id, s.id, true, ex.recupero)}
                            className="w-10 h-10 rounded-[8px] bg-field text-ink-3 flex items-center justify-center transition-colors hover:text-ink active:bg-raised"
                            title="Segna serie come completata"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add set button */}
                  <div className="p-2.5">
                    <button
                      onClick={() => handleAddSet(ex.id)}
                      className="h-btn h-btn-tonal w-full"
                    >
                      <Plus className="w-4 h-4" /> Serie
                    </button>
                  </div>
                </div>
              ))}

              {/* Bottone Aggiungi Esercizio */}
              <button
                onClick={() => setIsPickerOpen(true)}
                className="h-btn h-btn-outline w-full border-dashed"
              >
                <Plus className="w-4 h-4" /> Aggiungi esercizio
              </button>
            </div>

            {/* Timer Recupero Attivo */}
            {restActive && (
              <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-80 z-50 animate-fade-in rounded-[12px] bg-accent-soft border border-accent/35 px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-accent shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="h-label">Recupero</p>
                    <p className="h-cell tnum text-accent mt-0.5">{formatTime(restSeconds)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setRestSeconds(prev => prev + 30)
                        setRestTotal(prev => prev + 30)
                      }}
                      className="h-9 px-2.5 rounded-[8px] bg-accent/16 text-accent h-cell text-[13px] transition-colors active:bg-raised tnum"
                    >
                      +30s
                    </button>
                    <button
                      onClick={() => {
                        setRestActive(false)
                        setRestSeconds(0)
                      }}
                      className="h-9 w-9 rounded-[8px] flex items-center justify-center text-ink-2 transition-colors active:bg-field"
                      title="Salta recupero"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-accent/20 overflow-hidden mt-2">
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${restPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddExerciseToLive}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
