'use client'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getPiani, creaPiano, eliminaPiano, aggiungiRiga, aggiornaRiga, eliminaRiga, migraPianoMassa, abbinaIntegrazione, creaPianoIA, type PianoAlimentazione, type RigaPiano } from "@/actions/alimentazione"
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, UtensilsCrossed, Pill, Sparkles, X, ArrowDownToLine, Edit2, Check, Send } from "lucide-react"
import { Toast, useToast } from "@/components/ui/Toast"
import { ConfirmBubble } from "@/components/ui/ConfirmBubble"
import { callGemini, generateDietPlanWithAI, suggestFoodsWithAI } from "@/actions/ai"
import Select from "@/components/ui/Select"
import { AIModal } from "@/components/workout/AIModal"

export default function WorkoutSchedule() {
  const [activeTab, setActiveTab] = useState<'alimentazione' | 'integrazione'>('alimentazione')
  const [piani, setPiani] = useState<PianoAlimentazione[]>([])
  const [integrazioni, setIntegrazioni] = useState<PianoAlimentazione[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [renamingPlan, setRenamingPlan] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const { toast, showToast, hideToast } = useToast()
  
  // AI
  const [aiOpen, setAiOpen] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedAiRow, setSelectedAiRow] = useState<any>(null)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([])
  const [isSuggestingFood, setIsSuggestingFood] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const data = await getPiani(activeTab)
    setPiani(data)
    
    if (activeTab === 'alimentazione') {
      const allInt = await getPiani('integrazione')
      setIntegrazioni(allInt)
    }
    
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [activeTab])

  const handleNewPlan = async () => {
    const nome = activeTab === 'alimentazione' ? 'Nuovo Piano Alimentare' : 'Nuovo Piano Integrativo'
    try {
      const piano = await creaPiano(nome, activeTab)
      await fetchData()
      setExpandedPlan(piano.id)
      showToast("Piano creato!", "success")
    } catch (err) {
      showToast("Errore creazione piano", "error")
    }
  }

  const handleDeletePlan = async (id: string) => {
    try {
      await eliminaPiano(id)
      setPiani(prev => prev.filter(p => p.id !== id))
      showToast("Piano eliminato", "success")
    } catch (err) {
      showToast("Errore eliminazione", "error")
    }
  }

  const handleAddRow = async (pianoId: string) => {
    try {
      const currentPlan = piani.find(p => p.id === pianoId)
      const ordine = currentPlan?.righe?.length || 0
      await aggiungiRiga(pianoId, { orario: '', voce: '', quantita: '', note: '', ordine })
      await fetchData()
    } catch (err) {
      showToast("Errore aggiunta riga", "error")
    }
  }

  const handleCellEdit = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({ rowId, field })
    setEditValue(currentValue || '')
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    try {
      await aggiornaRiga(editingCell.rowId, { [editingCell.field]: editValue })
      setPiani(prev => prev.map(p => ({
        ...p,
        righe: p.righe.map((r: RigaPiano) => r.id === editingCell.rowId ? { ...r, [editingCell.field]: editValue } : r)
      })))
    } catch (err) {
      showToast("Errore salvataggio", "error")
    }
    setEditingCell(null)
  }

  const handleDeleteRow = async (rowId: string) => {
    try {
      await eliminaRiga(rowId)
      setPiani(prev => prev.map(p => ({
        ...p,
        righe: p.righe.filter((r: RigaPiano) => r.id !== rowId)
      })))
      showToast("Riga eliminata", "success")
    } catch (err) {
      showToast("Errore eliminazione", "error")
    }
  }

  const handleMigrate = async () => {
    try {
      await migraPianoMassa()
      showToast("Piano Massa migrato!", "success")
      fetchData()
    } catch (err: any) {
      showToast(err.message || "Errore migrazione", "error")
    }
  }

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiResponse('')
    try {
      const plansContext = piani.map(p => `- ${p.nome}: ${p.righe?.map(r => `${r.orario} ${r.voce} (${r.quantita})`).join(', ')}`).join('\n');
      const context = activeTab === 'alimentazione' 
        ? `L'utente sta visualizzando questi piani alimentari:\n${plansContext}\n\nL'utente cerca informazioni o alternative nutrizionali.`
        : `L'utente sta visualizzando questi piani di integrazione:\n${plansContext}\n\nL'utente cerca informazioni sugli integratori.`;
      const result = await callGemini(`${context}\n\nDomanda dell'utente: ${aiQuery}`)
      setAiResponse(result)
    } catch (err: any) {
      setAiResponse(`Errore: ${err.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSuggestFood = async () => {
    if (!editValue.trim()) return;
    setIsSuggestingFood(true);
    try {
      const suggestions = await suggestFoodsWithAI(editValue);
      setFoodSuggestions(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggestingFood(false);
    }
  }

  const handleGeneratePlanAI = async () => {
    setIsGeneratingPlan(true);
    try {
      const aiString = await generateDietPlanWithAI(activeTab, '');
      const nome = `Piano AI - ${new Date().toLocaleDateString('it-IT')}`;
      const piano = await creaPianoIA(nome, activeTab, aiString);
      await fetchData();
      setExpandedPlan(piano.id);
      showToast("Piano generato dall'IA!", "success");
    } catch (err) {
      console.error(err);
      showToast("Errore generazione piano IA", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  const columns = activeTab === 'alimentazione' 
    ? [
        { key: 'orario', label: 'Orario', width: 'w-24' },
        { key: 'voce', label: 'Pasto / Fase', width: 'flex-1' },
        { key: 'quantita', label: 'Quantità', width: 'w-32' },
        { key: 'note', label: 'Note', width: 'w-48' },
      ]
    : [
        { key: 'orario', label: 'Orario', width: 'w-24' },
        { key: 'voce', label: 'Integratore', width: 'flex-1' },
        { key: 'quantita', label: 'Quantità (mg/CPR)', width: 'w-40' },
      ];

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 bg-[#f4f4f4] dark:bg-[#09090b] transition-colors duration-500">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <span className="text-blue-600 dark:text-blue-500">
            {activeTab === 'alimentazione' ? <UtensilsCrossed className="w-8 h-8 inline" /> : <Pill className="w-8 h-8 inline" />}
          </span>
          {activeTab === 'alimentazione' ? 'Alimentazione' : 'Integrazione'}
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex gap-2 p-1.5 bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => setActiveTab('alimentazione')}
            className={cn(
              "flex-1 py-3 px-6 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all",
              activeTab === 'alimentazione'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <UtensilsCrossed className="w-4 h-4 inline mr-2" /> Alimentazione
          </button>
          <button
            onClick={() => setActiveTab('integrazione')}
            className={cn(
              "flex-1 py-3 px-6 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all",
              activeTab === 'integrazione'
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <Pill className="w-4 h-4 inline mr-2" /> Integrazione
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-5xl mx-auto mb-6 flex gap-3 flex-wrap">
        <button 
          onClick={handleNewPlan}
          className={cn(
            "flex items-center gap-2 px-6 py-3 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95",
            activeTab === 'alimentazione' 
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/30"
          )}
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'alimentazione' ? 'Nuovo Piano Alimentare' : 'Nuovo Piano Integrativo'}
        </button>

        <button 
          onClick={handleGeneratePlanAI}
          disabled={isGeneratingPlan}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-emerald-200 dark:border-emerald-800 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Sparkles className="w-4 h-4 text-emerald-500" />}
          Genera con IA
        </button>

        <button 
          onClick={() => setAiOpen(!aiOpen)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/20 transition-all active:scale-95 hover:shadow-xl"
        >
          <Sparkles className="w-4 h-4" /> Chiedi all'AI
        </button>

        {piani.length === 0 && !loading && (
          <button 
            onClick={handleMigrate}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 dark:bg-zinc-700 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" /> Migra Piano Massa
          </button>
        )}
      </div>

      {/* AI Panel */}
      {aiOpen && (
        <div className="max-w-5xl mx-auto mb-6 animate-fade-in">
          <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 rounded-[28px] border border-violet-200 dark:border-violet-800/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                  Assistente AI {activeTab === 'alimentazione' ? 'Nutrizione' : 'Integratori'}
                </h3>
              </div>
              <button onClick={() => setAiOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                placeholder={activeTab === 'alimentazione' ? "Es: Quante proteine devo assumere per 93kg?" : "Es: Quando prendere la creatina?"}
                className="flex-1 bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 rounded-2xl px-5 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-500/20 font-medium shadow-sm"
              />
              <button 
                onClick={handleAISearch}
                disabled={aiLoading}
                className="p-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>

            {aiResponse && (
              <div className="mt-4 p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-violet-100 dark:border-violet-900/30 shadow-inner">
                <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-medium leading-relaxed">{aiResponse}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p className="font-bold text-sm uppercase tracking-widest">Caricamento...</p>
          </div>
        ) : piani.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === 'alimentazione' ? <UtensilsCrossed className="w-8 h-8 text-zinc-300" /> : <Pill className="w-8 h-8 text-zinc-300" />}
            </div>
            <p className="text-zinc-500 font-bold">Nessun piano presente</p>
            <p className="text-zinc-400 text-xs mt-2">Crea un nuovo piano o migra i dati dal Piano Massa</p>
          </div>
        ) : (
          piani.map((piano) => {
            const isExpanded = expandedPlan === piano.id;
            const isRenaming = renamingPlan === piano.id;
            
            return (
              <div key={piano.id} className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/40 dark:shadow-black/40 transition-all overflow-hidden mb-6">
                {/* Plan Header */}
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setExpandedPlan(isExpanded ? null : piano.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "p-2 rounded-xl transition-all",
                      isExpanded 
                        ? (activeTab === 'alimentazione' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600")
                        : "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    
                    {isRenaming ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input 
                          autoFocus 
                          value={renameValue} 
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const { rinominaPiano } = await import('@/actions/alimentazione')
                              await rinominaPiano(piano.id, renameValue)
                              setRenamingPlan(null)
                              fetchData()
                            }
                          }}
                          className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 text-sm font-black text-zinc-900 dark:text-zinc-50 outline-none flex-1" 
                        />
                        <button onClick={async (e) => {
                          e.stopPropagation()
                          const { rinominaPiano } = await import('@/actions/alimentazione')
                          await rinominaPiano(piano.id, renameValue)
                          setRenamingPlan(null)
                          fetchData()
                        }} className="p-1.5 text-green-500"><Check className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">{piano.nome}</h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRenamingPlan(piano.id); setRenameValue(piano.nome); }}
                          className="p-1 text-zinc-300 hover:text-blue-500 transition-colors shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">
                      {piano.righe?.length || 0} righe
                    </span>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <ConfirmBubble 
                      title="Elimina Piano"
                      message={`Vuoi davvero eliminare "${piano.nome}"?`}
                      onConfirm={() => handleDeletePlan(piano.id)}
                      trigger={
                        <button className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                      }
                    />
                  </div>
                </div>

                {/* Plan Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-2 fade-in duration-200">
                    
                    {/* Modulo Abbinamento Integrazione */}
                    {activeTab === 'alimentazione' && integrazioni.length > 0 && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div className="p-2 sm:p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">Integrazione Abbinata</p>
                          <Select 
                            options={[
                              { id: 'none', label: 'Nessuna integrazione' },
                              ...integrazioni.map(i => ({ id: i.id, label: i.nome }))
                            ]}
                            value={piano.integrazione_abbinata_id || 'none'}
                            onChange={async (val) => {
                              const targetId = val === 'none' ? null : (val as string);
                              await abbinaIntegrazione(piano.id, targetId);
                              fetchData();
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 pb-4">
                      <div className="min-w-[700px]">
                        {/* Table Header */}
                        <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                          {columns.map((col) => (
                            <div key={col.key} className={cn("text-[12px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 shrink-0", col.width)}>
                              {col.label}
                            </div>
                          ))}
                          <div className="w-8 shrink-0" /> {/* spacer for delete btn */}
                        </div>

                        {/* Rows */}
                        {(() => {
                          let allRows = [...(piano.righe || [])];
                          if (activeTab === 'alimentazione' && piano.integrazione_abbinata_id) {
                            const pairedInt = integrazioni.find(i => i.id === piano.integrazione_abbinata_id);
                            if (pairedInt && pairedInt.righe) {
                              const intRows = pairedInt.righe.map((r: RigaPiano) => ({ ...r, isIntegration: true }));
                              allRows = [...allRows, ...intRows];
                            }
                          }
                          allRows.sort((a, b) => (a.orario || '').localeCompare(b.orario || ''));

                          return allRows.map((row: RigaPiano) => {
                            if (row.isIntegration) {
                              return (
                                <div key={`int-${row.id}`} className="flex items-center gap-2 px-3 py-3 mt-1 mb-1 rounded-2xl bg-purple-50/70 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 group/row">
                                  <div className={cn("min-w-0 shrink-0 font-bold text-base text-purple-600 dark:text-purple-400", columns[0].width)}>
                                    {row.orario || '—'}
                                  </div>
                                  <div className={cn("min-w-0 shrink-0 text-base font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300", columns[1].width)}>
                                    <div className="w-6 h-6 flex items-center justify-center bg-purple-200 dark:bg-purple-900/50 rounded-lg shrink-0">
                                      <Pill className="w-3.5 h-3.5" /> 
                                    </div>
                                    <span className="truncate">{row.voce || 'Integrazione'}</span>
                                  </div>
                                  <div className={cn("min-w-0 shrink-0 text-base font-medium text-purple-600/80 dark:text-purple-400/80", columns[2].width)}>
                                    {row.quantita || '—'}
                                  </div>
                                  <div className={cn("min-w-0 shrink-0 text-sm text-purple-500 italic", columns[3].width)}>
                                    <span className="truncate block">{row.note || ''}</span>
                                  </div>
                                  <div className="w-8 shrink-0 flex items-center justify-center">
                                    <button 
                                      onClick={() => { setSelectedAiRow({ items: row.voce, substance: row.voce, qty: row.quantita, phase: row.orario, notes: row.note }); setIsAiModalOpen(true); }}
                                      className="p-1.5 text-blue-500/50 hover:text-blue-500 transition-colors"
                                    >
                                      <Sparkles size={14} />
                                    </button>
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <div key={row.id} className="flex items-center gap-2 px-3 py-3.5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group/row border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                                {columns.map((col) => {
                                  const isEditing = editingCell?.rowId === row.id && editingCell?.field === col.key;
                                  return (
                                    <div key={col.key} className={cn("min-w-0 shrink-0", col.width)}>
                                      {isEditing ? (
                                        <div className="relative">
                                          <input
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => { setEditValue(e.target.value); setFoodSuggestions([]); }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleCellSave();
                                              if (e.key === 'Escape') setEditingCell(null);
                                            }}
                                            className="w-full bg-white dark:bg-zinc-800 border-2 border-blue-500 rounded-xl px-3 py-2 text-base font-bold text-zinc-900 dark:text-white outline-none shadow-lg shadow-blue-500/10"
                                          />
                                          {col.key === 'voce' && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); handleSuggestFood(); }}
                                                disabled={isSuggestingFood}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                title="Suggerimenti IA"
                                              >
                                                {isSuggestingFood ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                              </button>
                                              <button onClick={handleCellSave} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                                                <Check size={14} />
                                              </button>
                                            </div>
                                          )}
                                          
                                          {foodSuggestions.length > 0 && col.key === 'voce' && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                              <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 py-1">Suggerimenti IA</p>
                                              </div>
                                              {foodSuggestions.map((s, idx) => (
                                                <button
                                                  key={idx}
                                                  onClick={(e) => { e.stopPropagation(); setEditValue(s); setFoodSuggestions([]); }}
                                                  className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2 group transition-colors"
                                                >
                                                  <Sparkles size={12} className="text-blue-500" />
                                                  {s}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div 
                                          onClick={() => handleCellEdit(row.id, col.key, (row[col.key] as string) || '')}
                                          className={cn(
                                            "px-2 py-2 rounded-lg text-base font-bold cursor-pointer transition-all min-h-[40px] flex items-center",
                                            row[col.key] 
                                              ? "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800" 
                                              : "text-zinc-300 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-300"
                                          )}
                                        >
                                          {row[col.key] || '—'}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <button 
                                  onClick={() => { setSelectedAiRow({ items: row.voce, substance: row.voce, qty: row.quantita, phase: row.orario, notes: row.note }); setIsAiModalOpen(true); }}
                                  className="w-8 p-1.5 text-zinc-300 hover:text-blue-500 transition-colors shrink-0"
                                >
                                  <Sparkles size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="w-8 p-1.5 text-zinc-300 hover:text-red-500 transition-colors shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          });
                        })()}

                        {/* Add Row */}
                        <button 
                          onClick={() => handleAddRow(piano.id)}
                          className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-blue-500 hover:border-blue-300 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Plus className="w-4 h-4" /> Aggiungi Riga
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <AIModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        selectedRow={selectedAiRow} 
      />
    </div>
  )
}
