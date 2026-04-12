'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSchedeAttive } from '@/actions/workout'
import { useHeartRate } from '@/hooks/useHeartRate'
import { cn } from '@/lib/utils'
import { Dumbbell, Heart, Watch, Timer, ChevronRight, ChevronDown, Check, RotateCcw, Loader2, WifiOff, Play, Pause, SkipForward } from 'lucide-react'
import { Toast, useToast } from '@/components/ui/Toast'

interface EsercizioRow {
  id: string;
  scheda_id: string;
  user_id: string;
  nome: string;
  peso: string;
  reps: number;
  serie: number;
  recupero: number;
  ordine: number;
  tags: string[];
}

interface EsercizioGruppo {
  nome: string
  items: EsercizioRow[]
}

interface Scheda {
  id: string;
  nome: string;
  esercizi: EsercizioRow[];
}

export default function LiveWorkout() {
  const [schede, setSchede] = useState<Scheda[]>([])
  const [selectedScheda, setSelectedScheda] = useState<Scheda | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [currentSerieIdx, setCurrentSerieIdx] = useState(0)
  const [completedSeries, setCompletedSeries] = useState<Set<string>>(new Set())
  const [showSchedaSelector, setShowSchedaSelector] = useState(false)
  const [workoutWeights, setWorkoutWeights] = useState<Record<string, string>>({})
  
  // Timer
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerTotal, setTimerTotal] = useState(0)
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false)
  const [showRecoveryFinishOverlay, setShowRecoveryFinishOverlay] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Heart Rate
  const hr = useHeartRate()
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const data = await getSchedeAttive()
      setSchede(data)
      if (data.length === 1) setSelectedScheda(data[0]) // Pre-seleziona se c'è solo una scheda
      setLoading(false)
    }
    fetch()
  }, [])

  // Group exercises by name OR by circuit
  const groupedEsercizi: EsercizioGruppo[] = []
  if (selectedScheda?.esercizi) {
    selectedScheda.esercizi.forEach((ex) => {
      const circuitTag = ex.tags?.find(t => t.startsWith('circuit-'))
      const last = groupedEsercizi[groupedEsercizi.length - 1]

      if (circuitTag) {
        // È un circuito. Lo raggruppiamo per ID circuito.
        if (last && last.items[0]?.tags?.includes(circuitTag)) {
          last.items.push(ex)
        } else {
          // Usiamo un flag o una proprietà speciale per identificarlo come circuito
          groupedEsercizi.push({ nome: "CIRCUITO", items: [ex] })
        }
      } else {
        // Esercizio standard: raggruppiamo per nome se consecutivi e della stessa serie
        if (last && !last.items[0]?.tags?.some(t => t.startsWith('circuit-')) && last.nome === (ex.nome || "Esercizio")) {
          last.items.push(ex)
        } else {
          groupedEsercizi.push({ nome: ex.nome || "Esercizio", items: [ex] })
        }
      }
    })
  }

  const currentExercise = groupedEsercizi[currentExIdx]
  const currentSerie = currentExercise?.items[currentSerieIdx]
  const totalSeries = currentExercise?.items.length || 0

  // Timer logic
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false)
      setShowRecoveryFinishOverlay(true)
      // Vibrate + beep
      if (typeof window !== 'undefined') {
        if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 200, 500])
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, audioCtx.currentTime)
          gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
          osc.start()
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5)
          osc.stop(audioCtx.currentTime + 2)
        } catch (e) {}
      }
      showToast("⏱ Recupero completato!", "success")
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive, timerSeconds])

  const startTimer = (seconds: number) => {
    setTimerTotal(seconds)
    setTimerSeconds(seconds)
    setTimerActive(true)
  }

  const completeSerie = () => {
    if (!currentSerie) return
    const key = `${currentExIdx}-${currentSerieIdx}`
    setCompletedSeries(prev => new Set(prev).add(key))
    
    // Start recovery timer
    startTimer(currentSerie.recupero || 60)
    
    // Advance
    if (currentSerieIdx < totalSeries - 1) {
      setCurrentSerieIdx(prev => prev + 1)
    } else if (currentExIdx < groupedEsercizi.length - 1) {
      setCurrentExIdx(prev => prev + 1)
      setCurrentSerieIdx(0)
    }
  }

  const selectExercise = (exIdx: number, serieIdx: number = 0) => {
    setCurrentExIdx(exIdx)
    setCurrentSerieIdx(serieIdx)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const timerProgress = timerTotal > 0 ? ((timerTotal - timerSeconds) / timerTotal) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-400 font-black text-xs uppercase tracking-widest">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (schede.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 pb-32">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-zinc-800 rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-10 h-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 mb-2">Nessuna scheda attiva</h2>
          <p className="text-zinc-400 mb-4">Vai nelle Schede e attiva almeno una scheda per iniziare l'allenamento</p>
        </div>
      </div>
    )
  }

  if (!isWorkoutStarted) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 flex flex-col justify-center pb-32">
        <h1 className="text-3xl font-black mb-2 text-center">Allenamento</h1>
        <p className="text-zinc-400 mb-8 text-center text-sm font-bold">Seleziona la scheda da eseguire oggi</p>
        <div className="space-y-4 max-w-sm mx-auto w-full">
          {schede.map(s => (
            <button 
              key={s.id} 
              onClick={() => setSelectedScheda(s)}
              className={cn(
                "w-full p-5 rounded-[24px] border transition-all text-left flex items-center justify-between",
                selectedScheda?.id === s.id 
                  ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                  : "border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-zinc-700"
              )}
            >
              <span className="font-black text-lg uppercase tracking-tight">{s.nome}</span>
              {selectedScheda?.id === s.id && <Check className="w-5 h-5 text-blue-500" />}
            </button>
          ))}
          
          <div className="pt-8">
            <button 
              disabled={!selectedScheda}
              onClick={() => setIsWorkoutStarted(true)}
              className="w-full py-5 rounded-[24px] bg-white text-black font-black text-sm uppercase tracking-widest shadow-xl shadow-white/10 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5" /> Inizia Allenamento
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-32">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-sm uppercase tracking-tight">Allenamento Live</span>
          </div>

          {/* Heart Rate Badge */}
          <div className="flex items-center gap-2">
            {hr.isConnected && hr.heartRate ? (
              <button onClick={hr.disconnect} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="font-black text-red-400 text-lg tabular-nums">{hr.heartRate}</span>
                <span className="text-[10px] font-bold text-red-500/60 uppercase">bpm</span>
              </button>
            ) : (
              <button 
                onClick={hr.connect}
                disabled={hr.isConnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                title={!hr.isSupported ? "Su iPhone usa Bluefy browser (gratis su App Store)" : "Connetti Amazfit"}
              >
                {hr.isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Watch className="w-4 h-4" />}
                {hr.isConnecting ? '...' : hr.isSupported ? 'Watch' : '⌚'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Scheda Selector */}
        <button 
          onClick={() => setShowSchedaSelector(!showSchedaSelector)}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-[24px] border border-zinc-800 hover:border-zinc-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Scheda</span>
            <span className="font-black text-zinc-100 uppercase tracking-tight">{selectedScheda?.nome}</span>
          </div>
          <ChevronDown className={cn("w-5 h-5 text-zinc-500 transition-transform", showSchedaSelector && "rotate-180")} />
        </button>

        {showSchedaSelector && (
          <div className="bg-zinc-900 rounded-[24px] border border-zinc-800 p-3 space-y-1 animate-fade-in">
            {schede.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedScheda(s); setShowSchedaSelector(false); setCurrentExIdx(0); setCurrentSerieIdx(0); setCompletedSeries(new Set()); }}
                className={cn(
                  "w-full text-left p-3 rounded-2xl font-black text-sm uppercase tracking-tight transition-all",
                  selectedScheda?.id === s.id ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800"
                )}
              >
                {s.nome}
              </button>
            ))}
          </div>
        )}

        {/* Timer */}
        {timerActive && (
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[32px] border border-blue-500/30 p-8 text-center animate-fade-in">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">
              <Timer className="w-4 h-4 inline mr-1" /> Recupero
            </p>
            <div className="text-6xl font-black tabular-nums text-white mb-4">
              {formatTime(timerSeconds)}
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${timerProgress}%` }}
              />
            </div>
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={() => setTimerSeconds(prev => Math.max(1, prev - 30))}
                className="px-4 py-2.5 bg-zinc-800/50 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                title="-30 secondi"
              >
                -30s
              </button>

              <button 
                onClick={() => { setTimerActive(false); setTimerSeconds(0); }}
                className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all shadow-xl active:scale-95"
              >
                <SkipForward className="w-4 h-4 mr-1 hidden sm:inline" /> Salta
              </button>
              
              <button
                onClick={() => {
                  setTimerSeconds(prev => prev + 30);
                  setTimerTotal(prev => Math.max(prev, timerSeconds + 30));
                }}
                className="px-4 py-2.5 bg-zinc-800/50 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                title="+30 secondi"
              >
                +30s
              </button>
            </div>
          </div>
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <div className="bg-zinc-900 rounded-[32px] border border-zinc-800 p-6 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">
                {currentExercise.nome === "CIRCUITO" ? "Circuito - Esercizio Corrente" : "Esercizio Corrente"}
              </p>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {currentExercise.nome === "CIRCUITO" ? (currentSerie?.nome || "Esercizio") : currentExercise.nome}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Serie {currentSerieIdx + 1} / {totalSeries}
                </span>
              </div>
            </div>

            {/* Current Serie Details */}
            {currentSerie && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/50 relative overflow-hidden group">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Peso</p>
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => {
                        const current = parseFloat(workoutWeights[currentSerie.id] || currentSerie.peso) || 0;
                        const newVal = Math.max(0, current - 5);
                        setWorkoutWeights(prev => ({ ...prev, [currentSerie.id]: newVal.toString() }));
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-300 transition-colors"
                    >
                      -
                    </button>
                    <p className="text-2xl font-black text-blue-400 tabular-nums">
                      {workoutWeights[currentSerie.id] || currentSerie.peso}
                      <span className="text-xs text-zinc-500 ml-0.5">kg</span>
                    </p>
                    <button 
                      onClick={() => {
                        const current = parseFloat(workoutWeights[currentSerie.id] || currentSerie.peso) || 0;
                        const newVal = current + 5;
                        setWorkoutWeights(prev => ({ ...prev, [currentSerie.id]: newVal.toString() }));
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Reps</p>
                  <p className="text-2xl font-black text-green-400">{currentSerie.reps}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-2xl p-4 text-center border border-zinc-700/50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Recupero</p>
                  <p className="text-2xl font-black text-purple-400">{currentSerie.recupero}<span className="text-sm text-zinc-500">s</span></p>
                </div>
              </div>
            )}

            {/* Complete Button */}
            <button
              onClick={completeSerie}
              disabled={timerActive}
              className={cn(
                "w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all",
                timerActive
                  ? "bg-zinc-800 text-zinc-500 cursor-wait"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30"
              )}
            >
              <Check className="w-5 h-5" /> Serie Completata
            </button>
          </div>
        )}

        {/* Exercise List */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Tutti gli esercizi</p>
          {groupedEsercizi.map((group, gIdx) => {
            const isActive = currentExIdx === gIdx
            const allCompleted = group.items.every((_, sIdx) => completedSeries.has(`${gIdx}-${sIdx}`))
            
            return (
              <button
                key={gIdx}
                onClick={() => selectExercise(gIdx)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left",
                  isActive ? "bg-blue-600/10 border border-blue-500/30" : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700",
                  allCompleted && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
                    allCompleted ? "bg-green-500/20 text-green-500" : isActive ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                  )}>
                    {allCompleted ? <Check className="w-4 h-4" /> : gIdx + 1}
                  </div>
                  <div>
                    <span className={cn("font-black text-sm uppercase tracking-tight", isActive ? "text-blue-400" : "text-zinc-300")}>
                      {group.nome === "CIRCUITO" ? "Circuito Training" : group.nome}
                    </span>
                    <p className="text-[10px] font-bold text-zinc-500">
                      {group.items.length} serie • {group.nome === "CIRCUITO" ? "Mix" : (workoutWeights[group.items[0]?.id] || group.items[0]?.peso) + "kg"}
                    </p>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
              </button>
            )
          })}
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      {/* Recovery Finish Overlay */}
      {showRecoveryFinishOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-xl animate-pulse" />
          <div className="relative bg-white dark:bg-zinc-900 rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl border-4 border-white/20 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50 animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Recupero Finito!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-8">È ora di iniziare la prossima serie. Forza!</p>
            <button 
              onClick={() => setShowRecoveryFinishOverlay(false)}
              className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Prossima Serie
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
