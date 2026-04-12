'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, X, Dumbbell, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Sparkles, Loader2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { aggiornaInteraScheda, getUltimoEsercizioInfo, eliminaScheda } from '@/actions/workout'
import { generateWorkoutWithAI, analyzeMuscleTargets } from '@/actions/ai'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { useToast } from '@/components/ui/Toast'
import Select from '@/components/ui/Select'
import { ExercisePickerModal } from './ExercisePickerModal'

const COMMON_EXERCISES = [
  "Panca Piana", "Panca Inclinata", "Squat", "Stacco da Terra", 
  "Trazioni alla Sbarra", "Rematore", "Military Press", "Curl Bilanciere",
  "Pushdown Tricipiti", "Leg Press", "Leg Extension", "Leg Curl", 
  "Lat Machine", "Pulley", "Alzati Laterali"
];

const RECOVERY_OPTIONS = [
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '1m' },
  { id: 75, label: '1m 15s' },
  { id: 90, label: '1m 30s' },
  { id: 105, label: '1m 45s' },
  { id: 120, label: '2m' },
  { id: 135, label: '2m 15s' },
  { id: 150, label: '2m 30s' },
  { id: 165, label: '2m 45s' },
  { id: 180, label: '3m' },
];

const WEIGHT_OPTIONS_BASE = Array.from({ length: 151 }, (_, i) => ({ id: i, label: `${i}kg` }));
const REPS_OPTIONS = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, label: `${i + 1} Rep` }));

interface SerieInfo {
  id: string;
  peso: string;
  reps: string;
  recupero: number;
}

interface CircuitExercise {
  id: string;
  nome: string;
  peso: string;
  reps: string;
  recupero: number;
}

interface EsercizioGroup {
  id: string;
  nome: string;
  isCustom: boolean;
  isCircuit: boolean;
  circuitExercises?: CircuitExercise[];
  serieList: SerieInfo[];
  targetSerie: number;
}

let nextId = 0;
const genId = () => `edit-id-${Date.now()}-${nextId++}`;

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheda: {
    id: string;
    nome: string;
    esercizi: any[];
  } | null;
}

export default function EditPlanModal({ isOpen, onClose, onSuccess, scheda }: EditPlanModalProps) {
  const [nomeScheda, setNomeScheda] = useState('')
  const [esercizi, setEsercizi] = useState<EsercizioGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [customExercises, setCustomExercises] = useState<string[]>([])
  const { showToast } = useToast()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [currentPickerGroupId, setCurrentPickerGroupId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [historyWeights, setHistoryWeights] = useState<Record<string, string>>({})
  const contentRef = useRef<HTMLDivElement>(null)
  const prevEserciziLength = useRef(esercizi.length)

  const showAlert = (message: string) => {
    showToast(message, 'error')
  }

  useEffect(() => {
    const saved = localStorage.getItem('custom_exercises')
    if (saved) {
      try {
        setCustomExercises(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])



  useEffect(() => {
    if (isOpen && scheda) {
      setNomeScheda(scheda.nome || '')
      
      const tempGroups: EsercizioGroup[] = []
      const circuitMap: Record<string, EsercizioGroup> = {}
      
      if (scheda.esercizi && scheda.esercizi.length > 0) {
        scheda.esercizi.forEach((ex: any) => {
          const circuitId = ex.tags?.find((t: string) => t.startsWith('circuit-'))
          
          if (circuitId) {
            if (!circuitMap[circuitId]) {
              const newCircuit: EsercizioGroup = {
                id: genId(),
                nome: 'CIRCUITO',
                isCustom: false,
                isCircuit: true,
                circuitExercises: [],
                serieList: [],
                targetSerie: 0
              }
              circuitMap[circuitId] = newCircuit
              tempGroups.push(newCircuit)
            }
            
            const group = circuitMap[circuitId]
            const roundTag = ex.tags?.find((t: string) => t.startsWith('round:'))
            const roundNum = roundTag ? parseInt(roundTag.split(':')[1]) : 1
            const posTag = ex.tags?.find((t: string) => t.startsWith('pos:'))
            const posNum = posTag ? parseInt(posTag.split(':')[1]) : 0

            if (roundNum === 1) {
              if (!group.circuitExercises![posNum]) {
                group.circuitExercises![posNum] = {
                  id: genId(),
                  nome: ex.nome || '',
                  peso: ex.peso?.toString() || '0',
                  reps: ex.reps?.toString() || '10',
                  recupero: ex.recupero || 15
                }
              }
            }

            if (!group.serieList[roundNum - 1]) {
              group.serieList[roundNum - 1] = {
                id: genId(),
                peso: '0',
                reps: '0',
                recupero: 60
              }
            }
          } else {
            const last = tempGroups[tempGroups.length - 1]
            if (last && !last.isCircuit && last.nome === ex.nome) {
              last.serieList.push({
                id: genId(),
                peso: ex.peso?.toString() || '0',
                reps: ex.reps?.toString() || '10',
                recupero: ex.recupero || 60
              });
            } else {
              tempGroups.push({
                id: genId(),
                nome: ex.nome || '',
                isCustom: !COMMON_EXERCISES.includes(ex.nome || ''),
                isCircuit: false,
                targetSerie: 0,
                serieList: [{
                  id: genId(),
                  peso: ex.peso?.toString() || '0',
                  reps: ex.reps?.toString() || '10',
                  recupero: ex.recupero || 60
                }]
              })
            }
          }
        })
        
        tempGroups.forEach(g => {
          g.targetSerie = g.serieList.length;
          if (g.isCircuit && g.circuitExercises) {
            g.circuitExercises = g.circuitExercises.filter(Boolean)
          }
        });

        setEsercizi(tempGroups)
        prevEserciziLength.current = tempGroups.length
        
        const col: Record<string, boolean> = {}
        tempGroups.forEach(g => { col[g.id] = true })
        setCollapsedGroups(col)
      } else {
        setEsercizi([{ id: genId(), nome: '', isCustom: false, isCircuit: false, targetSerie: 3, serieList: [{ id: genId(), peso: '0', reps: '10', recupero: 60 }] }])
        setCollapsedGroups({})
        prevEserciziLength.current = 1
      }
    }
  }, [isOpen, scheda])

  useEffect(() => {
    if (esercizi.length > prevEserciziLength.current && contentRef.current) {
      setTimeout(() => {
        const lastEx = contentRef.current?.querySelector('.exercice-group:last-child');
        if (lastEx) {
          lastEx.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
    prevEserciziLength.current = esercizi.length;
  }, [esercizi.length]);

  if (!isOpen || !scheda) return null

  const addGroup = () => {
    const newCollapsed = { ...collapsedGroups };
    esercizi.forEach(ex => { newCollapsed[ex.id] = true; });
    setCollapsedGroups(newCollapsed);
    const newId = genId();
    setEsercizi([...esercizi, { id: newId, nome: '', isCustom: false, isCircuit: false, targetSerie: 3, serieList: [{ id: genId(), peso: '0', reps: '10', recupero: 60 }] }])
    setCurrentPickerGroupId(newId)
    setIsPickerOpen(true)
    showToast("Esercizio aggiunto", "success")
  }

  const openPicker = (groupId: string) => {
    setCurrentPickerGroupId(groupId)
    setIsPickerOpen(true)
  }

  const handleExerciseSelect = async (name: string) => {
    if (!currentPickerGroupId) return;
    
    const groupId = currentPickerGroupId;
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, nome: name };
      }
      if (g.isCircuit && g.circuitExercises) {
        return {
          ...g,
          circuitExercises: g.circuitExercises.map(ce => ce.id === groupId ? { ...ce, nome: name } : ce)
        };
      }
      return g;
    }));
    
    try {
      const last = await getUltimoEsercizioInfo(name);
      if (last) {
         const lastPeso = String(last.peso || '0');
         setHistoryWeights(prev => ({ ...prev, [name]: lastPeso }));
         setEsercizi(prev => prev.map(g => {
             if (g.id === groupId) {
                 const updatedSerieList = g.serieList.map(s => ({
                     ...s,
                     peso: lastPeso,
                     reps: last.reps?.toString() || '10',
                     recupero: last.recupero || 60
                 }));
                 return { ...g, serieList: updatedSerieList };
             }
             if (g.isCircuit && g.circuitExercises) {
                return {
                  ...g,
                  circuitExercises: g.circuitExercises.map(ce => {
                    if (ce.id === groupId) {
                      return { ...ce, peso: lastPeso, reps: last.reps?.toString() || '10', recupero: last.recupero || 15 };
                    }
                    return ce;
                  })
                };
             }
             return g;
         }));
      }
    } catch (err) {
      console.error('SEARCH ERROR:', err);
    }
    
    setIsPickerOpen(false)
    setCurrentPickerGroupId(null)
  }

  const addCircuit = () => {
    const newCollapsed = { ...collapsedGroups };
    esercizi.forEach(ex => { newCollapsed[ex.id] = true; });
    setCollapsedGroups(newCollapsed);
    const newId = genId();
    setEsercizi([...esercizi, { 
      id: newId, 
      nome: 'CIRCUITO', 
      isCustom: false, 
      isCircuit: true, 
      targetSerie: 3, 
      circuitExercises: [
        { id: genId(), nome: '', peso: '0', reps: '10', recupero: 15 },
        { id: genId(), nome: '', peso: '10', reps: '10', recupero: 60 }
      ],
      serieList: [
        { id: genId(), peso: '0', reps: '0', recupero: 60 },
        { id: genId(), peso: '0', reps: '0', recupero: 60 },
        { id: genId(), peso: '0', reps: '0', recupero: 60 }
      ]
    }])
  }

  const addExerciseToCircuit = (groupId: string) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId && g.isCircuit) {
        return {
          ...g,
          circuitExercises: [...(g.circuitExercises || []), { id: genId(), nome: '', peso: '0', reps: '10', recupero: 15 }]
        }
      }
      return g;
    }))
  }

  const removeExerciseFromCircuit = (groupId: string, exerciseId: string) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId && g.isCircuit) {
        return {
          ...g,
          circuitExercises: (g.circuitExercises || []).filter(ce => ce.id !== exerciseId)
        }
      }
      return g;
    }))
  }

  const updateCircuitExercise = (groupId: string, exerciseId: string, fields: Partial<CircuitExercise>) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId && g.isCircuit) {
        return {
          ...g,
          circuitExercises: (g.circuitExercises || []).map(ce => ce.id === exerciseId ? { ...ce, ...fields } : ce)
        }
      }
      return g;
    }))
  }

  const removeGroup = (groupId: string) => {
    setEsercizi(prev => prev.filter(g => g.id !== groupId))
    showToast("Esercizio rimosso", "success")
  }

  const generateSeries = (groupId: string, targetCount: number) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId) {
        const currentSeries = [...g.serieList];
        if (targetCount > currentSeries.length) {
          const diff = targetCount - currentSeries.length;
          const lastSerie = currentSeries[currentSeries.length - 1] || { peso: '0', reps: '10', recupero: 60 };
          for (let i = 0; i < diff; i++) {
            currentSeries.push({
               id: genId(), 
               peso: lastSerie.peso, 
               reps: lastSerie.reps, 
               recupero: lastSerie.recupero 
            });
          }
        } else if (targetCount < currentSeries.length) {
          currentSeries.splice(Math.max(1, targetCount));
        }
        return { ...g, targetSerie: targetCount, serieList: currentSeries };
      }
      return g;
    }))
    setCollapsedGroups(prev => ({...prev, [groupId]: false}));
  }

  const addSerie = (groupId: string) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId) {
        const lastSerie = g.serieList[g.serieList.length - 1] || { peso: '0', reps: '10', recupero: 60 };
        return {
          ...g,
          serieList: [...g.serieList, { id: genId(), peso: lastSerie.peso, reps: lastSerie.reps, recupero: lastSerie.recupero }]
        }
      }
      return g;
    }))
  }

  const removeSerie = (groupId: string, serieId: string) => {
    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, serieList: g.serieList.filter(s => s.id !== serieId) }
      }
      return g;
    }))
    showToast("Serie rimossa", "success")
  }

  const moveGroupUp = (idx: number) => {
    if (idx <= 0) return;
    const newEsercizi = [...esercizi];
    const temp = newEsercizi[idx];
    newEsercizi[idx] = newEsercizi[idx - 1];
    newEsercizi[idx - 1] = temp;
    setEsercizi(newEsercizi);
    showToast("Ordine aggiornato", "success");
  };

  const moveGroupDown = (idx: number) => {
    if (idx >= esercizi.length - 1) return;
    const newEsercizi = [...esercizi];
    const temp = newEsercizi[idx];
    newEsercizi[idx] = newEsercizi[idx + 1];
    newEsercizi[idx + 1] = temp;
    setEsercizi(newEsercizi);
    showToast("Ordine aggiornato", "success");
  };

  const duplicateGroup = (groupId: string) => {
    const group = esercizi.find(g => g.id === groupId);
    if (!group) return;
    
    const newId = genId();
    const newGroup: EsercizioGroup = {
      ...group,
      id: newId,
      serieList: group.serieList.map(s => ({ ...s, id: genId() })),
      circuitExercises: group.circuitExercises?.map(ce => ({ ...ce, id: genId() }))
    };
    
    const index = esercizi.findIndex(g => g.id === groupId);
    const newEsercizi = [...esercizi];
    newEsercizi.splice(index + 1, 0, newGroup);
    setEsercizi(newEsercizi);
    showToast("Esercizio duplicato", "success");
  };

  const updateSerie = (groupId: string, serieId: string, fields: Partial<SerieInfo>) => {

    setEsercizi(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, serieList: g.serieList.map(s => s.id === serieId ? { ...s, ...fields } : s) }
      }
      return g;
    }))
  }

  const handleAIGenerate = async () => {
    setLoading(true);
    try {
      const prompt = `L'utente ha una scheda chiamata "${nomeScheda}". Suggerisci come ottimizzarla o variala mantenendo lo stesso volume ma con input tecnici Gemma 4.`;
      const result = await generateWorkoutWithAI(prompt);
      
      const lines = result.split('\n');
      const tableLines = lines.filter((l: string) => l.includes('|') && !l.includes('---'));
      const exerciseRows = tableLines.slice(1);
      
      if (exerciseRows.length > 0) {
        const newGroups: EsercizioGroup[] = exerciseRows.map((row: string) => {
          const parts = row.split('|').map((p: string) => p.trim()).filter(Boolean);
          if (parts.length < 3) return null;
          
          const [nome, setReps, recuperoStr] = parts;
          const [sets, reps] = setReps.toLowerCase().split('x').map((s: string) => parseInt(s.trim()));
          const recupero = parseInt(recuperoStr) || 60;
          
          const targetSets = sets || 3;
          const repsVal = reps ? String(reps) : '10';
          
          const serieList: SerieInfo[] = Array.from({ length: targetSets }, () => ({
            id: genId(),
            peso: '0',
            reps: repsVal,
            recupero: recupero
          }));

          return {
            id: genId(),
            nome: nome,
            isCustom: !COMMON_EXERCISES.includes(nome),
            isCircuit: false,
            targetSerie: targetSets,
            serieList
          };
        }).filter(Boolean) as EsercizioGroup[];

        if (newGroups.length > 0) {
          setEsercizi(prev => [...prev, ...newGroups]);
          showToast("Suggerimenti IA aggiunti in coda!", "success");
        } else {
          showToast("L'IA non ha restituito esercizi validi. Riprova.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Errore generazione IA", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!scheda) return;
    setLoading(true);
    try {
      await eliminaScheda(scheda.id);
      showToast("Scheda eliminata", "success");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Errore durante l'eliminazione", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const validExercises = esercizi
      .filter(g => g.nome.trim() !== '')
      .map(g => ({
        nome: g.nome,
        serie: g.serieList.length,
        reps: g.serieList[0]?.reps || '10'
      }));

    if (validExercises.length === 0) return showToast("Aggiungi almeno un esercizio", "error");

    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeMuscleTargets(validExercises);
      
      if (result.startsWith('ERRORE_IA:')) {
        showToast(result.replace('ERRORE_IA:', '').trim(), "error");
        setAnalysisResult(null);
      } else {
        setAnalysisResult(result);
        showToast("Analisi completata!", "success");
        // Scroll to result
        setTimeout(() => {
          const el = document.getElementById('ai-analysis-result');
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      showToast("Errore durante l'analisi", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {

    if (!nomeScheda) return showAlert("Inserisci un nome per la scheda")
    const validGroups = esercizi.filter(ex => ex.nome.trim() !== '')

    const flatEsercizi: { nome: string; peso: string; reps: string; serie: number; recupero: number; tags?: string[] }[] = [];
    
    validGroups.forEach(g => {
      if (g.isCircuit && g.circuitExercises) {
        const circuitId = `circuit-${Math.random().toString(36).substr(2, 9)}`;
        g.serieList.forEach((round, roundIdx) => {
          g.circuitExercises!.forEach((ce, ceIdx) => {
            flatEsercizi.push({
              nome: ce.nome,
              peso: ce.peso,
              reps: ce.reps,
              serie: roundIdx + 1,
              recupero: ce.recupero,
              tags: [circuitId, `round:${roundIdx + 1}`, `pos:${ceIdx}`]
            });
          });
        });
      } else {
        g.serieList.forEach((s, idx) => {
          flatEsercizi.push({
            nome: g.nome,
            peso: String(s.peso),
            reps: String(s.reps),
            serie: idx + 1,
            recupero: s.recupero,
            tags: []
          });
        });
      }
    });

    setLoading(true)
    try {
      const res = await aggiornaInteraScheda(scheda.id, nomeScheda, flatEsercizi)
      if (res.success) {
        showToast("Scheda aggiornata!", "success")
        onSuccess()
        onClose()
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('SAVE ERROR:', error)
      showAlert(error.message || 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex md:items-center justify-center md:p-4 bg-zinc-50 dark:bg-zinc-950 md:bg-zinc-900/60 md:dark:bg-black/80 md:backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-50 dark:bg-zinc-950 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl flex flex-col md:rounded-[32px] md:shadow-2xl md:border md:border-zinc-200 md:dark:border-zinc-800 relative">
        
        <div className="flex justify-between items-center p-5 md:p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 md:rounded-t-[32px] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2.5 bg-blue-600 dark:bg-blue-500 rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/20">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">Modifica Scheda</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div ref={contentRef} className="p-4 md:p-6 space-y-8 overflow-y-auto flex-1 pb-40 relative z-0">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">Nome Scheda</label>
            <input 
              type="text" 
              placeholder="E.g. Spinta A, Gambe..."
              value={nomeScheda}
              onChange={(e) => setNomeScheda(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold shadow-sm"
            />
          </div>

          <div className="space-y-6">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">Esercizi & Serie</label>
            
            {esercizi.map((g) => {
              const isCollapsed = collapsedGroups[g.id];
              
              if (g.isCircuit) {
                return (
                  <div key={g.id} className="exercice-group bg-white dark:bg-zinc-900 rounded-[24px] md:rounded-[28px] border-2 border-purple-500/30 dark:border-purple-500/20 shadow-sm transition-all mb-4 relative z-0">
                    <div 
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleGroup(g.id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className={cn("p-2 rounded-xl transition-all shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400")}>
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div className="flex-1">
                           <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Circuito</h3>
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{g.serieList.length} Giri • {g.circuitExercises?.length} Esercizi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 mr-1">
                          {esercizi.indexOf(g) > 0 && (
                            <button onClick={() => moveGroupUp(esercizi.indexOf(g))} className="p-1 hover:text-blue-500 text-zinc-400 transition-colors">
                              <ArrowUp size={14} />
                            </button>
                          )}
                          {esercizi.indexOf(g) < esercizi.length - 1 && (
                            <button onClick={() => moveGroupDown(esercizi.indexOf(g))} className="p-1 hover:text-blue-500 text-zinc-400 transition-colors">
                              <ArrowDown size={14} />
                            </button>
                          )}
                        </div>
                        <ConfirmBubble 
                          title="Elimina Circuito"
                          message="Eliminare l'intero circuito?"
                          onConfirm={() => removeGroup(g.id)}
                          trigger={
                            <button className="p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                              <Trash2 size={16} />
                            </button>
                          }
                        />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-4 pt-0 space-y-4">
                        <div className="space-y-3">
                          {g.circuitExercises?.map((ce, idx) => (
                            <div key={ce.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                              <div className="flex items-center gap-3 mb-3">
                                <button
                                  type="button"
                                  onClick={() => openPicker(ce.id)}
                                  className={cn(
                                    "flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all text-left shadow-sm",
                                    ce.nome 
                                      ? "bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400 text-white"
                                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                                  )}
                                >
                                   <div className="flex items-center gap-2 truncate">
                                     <Dumbbell className={cn("w-4 h-4 shrink-0", ce.nome ? "text-white/80" : "text-zinc-400")} />
                                     <span className="font-black text-sm uppercase tracking-tight truncate">
                                       {ce.nome || "Scegli Esercizio..."}
                                     </span>
                                   </div>
                                   <ChevronRight size={14} className={cn("shrink-0", ce.nome ? "text-white/60" : "opacity-30")} />
                                </button>
                                <button onClick={() => removeExerciseFromCircuit(g.id, ce.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              
                              <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-0.5 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                  <button onClick={() => {
                                    const current = parseFloat(ce.peso) || 0;
                                    const newVal = Math.max(0, current - 5);
                                    updateCircuitExercise(g.id, ce.id, { peso: newVal.toString() });
                                  }} className="w-6 h-6 flex items-center justify-center font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 cursor-pointer">-</button>
                                  
                                  <Select 
                                    options={WEIGHT_OPTIONS_BASE}
                                    value={ce.peso}
                                    onChange={(v) => updateCircuitExercise(g.id, ce.id, { peso: v.toString() })}
                                    variant="minimal"
                                    className="w-full flex-1 !py-1 text-center font-bold"
                                  />

                                  <button onClick={() => {
                                    const current = parseFloat(ce.peso) || 0;
                                    const newVal = current + 5;
                                    updateCircuitExercise(g.id, ce.id, { peso: newVal.toString() });
                                  }} className="w-6 h-6 flex items-center justify-center font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 cursor-pointer">+</button>
                                </div>
                                <div className="flex-1">
                                  <Select 
                                    options={REPS_OPTIONS}
                                    value={ce.reps}
                                    onChange={(v) => updateCircuitExercise(g.id, ce.id, { reps: v.toString() })}
                                    variant="minimal"
                                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Select 
                                    options={RECOVERY_OPTIONS}
                                    value={ce.recupero}
                                    onChange={(v) => updateCircuitExercise(g.id, ce.id, { recupero: Number(v) })}
                                    variant="minimal"
                                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => addExerciseToCircuit(g.id)}
                            className="w-full py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-dashed border-purple-500/30 transition-all"
                          >
                            + Aggiungi Esercizio al Circuito
                          </button>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">Numero di Giri (Rounds)</label>
                           <Select 
                              options={Array.from({ length: 15 }, (_, i) => ({ id: i + 1, label: `${i + 1} Giri` }))}
                              value={g.serieList.length}
                              onChange={(val) => generateSeries(g.id, Number(val))}
                           />
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={g.id} className="exercice-group bg-white dark:bg-zinc-900 rounded-[24px] md:rounded-[28px] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all mb-4 relative z-0">
                  <div 
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-transparent dark:border-transparent"
                    onClick={() => toggleGroup(g.id)}
                    style={{ borderBottomColor: !isCollapsed ? 'rgba(161, 161, 170, 0.1)' : 'transparent' }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className={cn("p-2 rounded-xl transition-all shrink-0", isCollapsed ? "bg-zinc-100 dark:bg-zinc-800" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400")}>
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </div>
                      
                      <div className="flex-1 min-w-0" onClick={(e) => !isCollapsed && e.stopPropagation()}>
                        {!isCollapsed ? (
                           <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 max-w-[400px]">
                            <div className="flex-1 w-full min-w-[200px]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openPicker(g.id); }}
                                  className={cn(
                                    "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all text-left",
                                    g.nome 
                                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
                                  )}
                                >
                                  <div className="flex items-center gap-3 truncate">
                                    <Dumbbell className={cn("w-4 h-4 shrink-0", g.nome ? "text-blue-500" : "text-zinc-400")} />
                                    <span className="font-bold truncate text-base">
                                      {g.nome || "Scegli Esercizio..."}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
                                </button>
                            </div>
                            
                            <div className="w-[115px] shrink-0 pointer-events-auto mt-2 sm:mt-0">
                               <Select 
                                 options={Array.from({ length: 15 }, (_, i) => ({ id: i + 1, label: `${i + 1} Serie` }))}
                                 value={g.targetSerie || 3}
                                 onChange={(val) => generateSeries(g.id, typeof val === 'number' ? val : parseInt(val as string))}
                               />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">
                              {g.nome || 'Nuovo Esercizio'}
                            </h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">
                              {g.serieList.length} Serie in totale
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1 mr-2 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                        {esercizi.indexOf(g) > 0 && (
                          <button onClick={() => moveGroupUp(esercizi.indexOf(g))} className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors" title="Sposta su">
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {esercizi.indexOf(g) < esercizi.length - 1 && (
                          <button onClick={() => moveGroupDown(esercizi.indexOf(g))} className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors" title="Sposta giù">
                            <ArrowDown size={14} />
                          </button>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => duplicateGroup(g.id)}
                        className="p-3 sm:p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all mr-2"
                        title="Duplica esercizio"
                      >
                        <Copy size={18} />
                      </button>

                      <ConfirmBubble 
                        title="Elimina Esercizio"
                        message={`Eliminare "${g.nome || 'questo esercizio'}" con tutte le sue serie?`}
                        onConfirm={() => removeGroup(g.id)}
                        trigger={
                          <button 
                            type="button"
                            className="p-3 sm:p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shadow-sm active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        }
                      />
                    </div>

                  </div>

                  {!isCollapsed && (
                    <div className="bg-zinc-50/50 dark:bg-zinc-900/30">
                      {g.serieList.map((serie, index) => (
                        <div 
                          key={serie.id} 
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:px-5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-white dark:hover:bg-zinc-800/40 transition-colors animate-in slide-in-from-right fade-in duration-300"
                          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                        >
                           <div className="flex items-center gap-2 font-black text-[10px] uppercase text-zinc-400 tracking-widest w-16 shrink-0 pt-2 sm:pt-0">
                             Serie {index + 1}
                           </div>

                           <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 w-full pb-2 sm:pb-0">
                             <div className="flex items-center flex-1 min-w-[120px] gap-0.5 bg-white dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
                                <button onClick={() => {
                                  const val = Math.max(0, (parseFloat(serie.peso) || 0) - 5);
                                  updateSerie(g.id, serie.id, { peso: val.toString() });
                                }} className="w-8 h-8 flex items-center justify-center font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 tooltip" title="-5kg">-</button>
                                
                                <Select 
                                  options={(() => {
                                    const historyWeight = historyWeights[g.nome];
                                    if (historyWeight && !WEIGHT_OPTIONS_BASE.find(o => o.id.toString() === historyWeight)) {
                                      return [{ id: historyWeight, label: `${historyWeight}kg (Ultimo)` }, { isDivider: true }, ...WEIGHT_OPTIONS_BASE];
                                    }
                                    return WEIGHT_OPTIONS_BASE;
                                  })()}
                                  value={serie.peso}
                                  onChange={(val) => updateSerie(g.id, serie.id, { peso: val.toString() })}
                                  variant="minimal"
                                  className="w-full flex-1 !py-1 text-center font-bold"
                                />

                                <button onClick={() => {
                                  const val = (parseFloat(serie.peso) || 0) + 5;
                                  updateSerie(g.id, serie.id, { peso: val.toString() });
                                }} className="w-8 h-8 flex items-center justify-center font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 tooltip" title="+5kg">+</button>
                             </div>

                             <div className="flex-1 min-w-[90px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                               <Select 
                                 options={REPS_OPTIONS}
                                 value={parseFloat(serie.reps) || 10}
                                 onChange={(val) => updateSerie(g.id, serie.id, { reps: val.toString() })}
                                 variant="minimal"
                                 className="w-full text-center font-bold"
                                />
                             </div>

                             <div className="flex-1 min-w-[100px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                               <Select 
                                 options={RECOVERY_OPTIONS}
                                 value={serie.recupero}
                                 onChange={(val) => updateSerie(g.id, serie.id, { recupero: Number(val) })}
                                 variant="minimal"
                                 className="w-full text-center font-bold"
                                />
                             </div>
                           </div>

                           <div className="shrink-0 w-full sm:w-auto flex justify-end gap-2 mt-2 sm:mt-0">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeSerie(g.id, serie.id); }}
                                disabled={g.serieList.length <= 1}
                                className={cn(
                                  "p-3 rounded-xl transition-all flex items-center justify-center shadow-sm",
                                  g.serieList.length <= 1 
                                    ? "text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed" 
                                    : "text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 active:scale-90"
                                )}
                                title={g.serieList.length <= 1 ? "Deve esserci almeno una serie" : "Elimina questa serie"}
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                      ))}

                      <div className="p-3 sm:px-5 sm:py-3 border-t border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50">
                        <button
                          onClick={() => addSerie(g.id)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-[14px] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={16} /> 
                          <span className="hidden sm:inline">Aggiungi</span> Serie
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={addGroup}
                className="w-full py-6 rounded-[24px] border-2 border-dashed border-blue-200 dark:border-blue-900/30 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest bg-blue-50/10 dark:bg-blue-900/10"
              >
                <Plus className="w-5 h-5" /> Nuovo Esercizio
              </button>
              <button 
                onClick={handleAIGenerate}
                disabled={loading}
                className="w-full py-6 rounded-[24px] border-2 border-dashed border-emerald-200 dark:border-emerald-900/30 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest bg-emerald-50/10 dark:bg-emerald-900/10 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Ottimizza con Gemma 4
              </button>
              <button 
                onClick={addCircuit}
                className="w-full py-6 rounded-[24px] border-2 border-dashed border-purple-200 dark:border-purple-900/30 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest bg-purple-50/10 dark:bg-purple-900/10"
              >
                <Plus className="w-5 h-5 text-purple-500" /> Nuovo Circuito
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || loading}
                className="w-full py-6 rounded-[24px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 disabled:opacity-50 lg:col-span-3 lg:mt-2"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Analisi Muscolare (Dettagliata)
              </button>
            </div>

            {analysisResult && (
              <div id="ai-analysis-result" className="mt-10 p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[32px] border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                     <Sparkles size={20} />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Report Muscolare IA</h3>
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Generato da Gemma 4 Architect</p>
                   </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 rounded-b-[32px] flex flex-col gap-3">
          <button 
            onClick={handleSave} disabled={loading}
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all focus:ring-4 focus:ring-zinc-500/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          
          <ConfirmBubble 
            title="Elimina Scheda"
            message="Vuoi eliminare definitivamente questa scheda? L'azione non è reversibile."
            onConfirm={handleDelete}
            trigger={
              <button 
                disabled={loading}
                className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              >
                Elimina Scheda
              </button>
            }
          />
        </div>
      </div>
      <ExercisePickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={handleExerciseSelect}
        customExercises={customExercises}
      />
    </div>
  )
}
