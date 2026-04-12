'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Dumbbell, History, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { suggestExercisesWithAI } from '@/actions/ai'

const COMMON_EXERCISES = [
  "Panca Piana", "Panca Inclinata", "Squat", "Stacco da Terra", 
  "Trazioni alla Sbarra", "Rematore", "Military Press", "Curl Bilanciere",
  "Pushdown Tricipiti", "Leg Press", "Leg Extension", "Leg Curl", 
  "Lat Machine", "Pulley", "Alzati Laterali"
];

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseName: string) => void;
  customExercises?: string[];
}

export function ExercisePickerModal({ isOpen, onClose, onSelect, customExercises = [] }: ExercisePickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [recentExercises, setRecentExercises] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isSearchingAI, setIsSearchingAI] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const saved = localStorage.getItem('recent_exercises')
      if (saved) {
        try {
          setRecentExercises(JSON.parse(saved))
        } catch (e) {}
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const allExercises = Array.from(new Set([...COMMON_EXERCISES, ...customExercises]))
  const filtered = allExercises.filter(ex => 
    ex.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.localeCompare(b))

  const handleSelect = (name: string) => {
    // Salva nei recenti
    const newRecent = [name, ...recentExercises.filter(ex => ex !== name)].slice(0, 5)
    setRecentExercises(newRecent)
    localStorage.setItem('recent_exercises', JSON.stringify(newRecent))
    
    onSelect(name)
    onClose()
  }

  const handleAISuggest = async () => {
    if (!searchTerm.trim()) return;
    setIsSearchingAI(true);
    try {
      const suggestions = await suggestExercisesWithAI(searchTerm);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAI(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-b-[32px] md:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border-b border-x md:border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh] md:max-h-[90vh] md:mt-10">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Scegli Esercizio</h2>
            <p className="text-xs text-zinc-500 font-medium">Seleziona dalla lista o cerca</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              autoFocus
              type="text"
              placeholder="Cerca esercizio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
          {/* Recenti */}
          {recentExercises.length > 0 && !searchTerm && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Usati di recente</h3>
              <div className="grid grid-cols-1 gap-2">
                {recentExercises.map((ex) => (
                  <button
                    key={`recent-${ex}`}
                    onClick={() => handleSelect(ex)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-zinc-900 dark:text-zinc-100 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all text-left group"
                  >
                    <History className="w-4 h-4 text-blue-500" />
                    <span className="font-bold flex-1">{ex}</span>
                    <Plus className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tutti gli esercizi */}
          <div>
            <div className="flex justify-between items-center mb-3 ml-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {searchTerm ? 'Risultati ricerca' : 'Tutti gli esercizi'}
              </h3>
              {searchTerm && (
                <button 
                  onClick={handleAISuggest}
                  disabled={isSearchingAI}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSearchingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Suggerimenti IA
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Risultati IA */}
              {aiSuggestions.length > 0 && searchTerm && (
                <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  {aiSuggestions.map((ex) => (
                    <button
                      key={`ai-${ex}`}
                      onClick={() => handleSelect(ex)}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 text-zinc-900 dark:text-zinc-100 hover:scale-[1.01] transition-all text-left group"
                    >
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="font-bold flex-1">{ex}</span>
                      <Plus className="w-4 h-4 text-blue-500 opacity-60" />
                    </button>
                  ))}
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
                </div>
              )}

              {filtered.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleSelect(ex)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <Dumbbell className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  <span className="font-bold flex-1">{ex}</span>
                  <Plus className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              
              {filtered.length === 0 && !isSearchingAI && aiSuggestions.length === 0 && (
                <button
                  onClick={() => handleSelect(searchTerm)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-left"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-bold flex-1">Aggiungi nuovo: "{searchTerm}"</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
           <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all active:scale-95"
           >
             Chiudi
           </button>
        </div>
      </div>
    </div>
  )
}
