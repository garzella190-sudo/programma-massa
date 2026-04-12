'use client'

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { WorkoutItem } from "@/types/workout";
import { callGemini } from "@/actions/ai";

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRow: WorkoutItem | null;
}

export const AIModal = ({ isOpen, onClose, selectedRow }: AIModalProps) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  if (!isOpen || !selectedRow) return null;

  const handleAsk = async (type: 'alternatives' | 'explain') => {
    setLoading(true);
    setResponse('');
    
    let prompt = '';
    if (type === 'alternatives') {
      const randomSeed = Math.floor(Math.random() * 10000);
      prompt = `Gemma 4, proponi 2 alternative ALIMENTARI di pari livello nutrizionale/energetico (macro e calorie) a: "${selectedRow.items}" (Quantità: ${selectedRow.qty}) per la fase "${selectedRow.phase}". Assicurati che siano compatibili con il piano di massa da 93kg. (Codice var: ${randomSeed})`;
    } else {
      prompt = `Gemma 4, analizza la componente biochimica e sportiva di: "${selectedRow.items}" (Quantità: ${selectedRow.qty}) nella fase di "${selectedRow.phase}". Spiega l'utilità nel mio programma di ipertrofia e massa muscolare.`;
    }


    try {
      const res = await callGemini(prompt);
      setResponse(res);
    } catch (error) {
      setResponse("Si è verificato un errore durante la comunicazione con l'IA.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-800 dark:text-zinc-100">
            <Icon name="Sparkles" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Assistente AI
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[16px] text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700">
            <span className="font-semibold block mb-1">In analisi:</span>
            {selectedRow.items} <span className="opacity-70">({selectedRow.qty})</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
              <Icon name="Loader2" className="w-8 h-8 mb-3 text-blue-600 dark:text-blue-500 animate-spin" />
              <p>Elaborazione risposta AI...</p>
            </div>
          ) : response ? (
            <div className="text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed text-sm animate-fade-in">
              {response}
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4">
              <p className="text-center text-zinc-500 text-sm mb-2">Cosa vuoi sapere su questo elemento?</p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => handleAsk('alternatives')}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-semibold rounded-[16px] bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors"
                >
                  🔄 Alternative
                </button>
                <button 
                  onClick={() => handleAsk('explain')}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-semibold rounded-[16px] bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  📖 Spiega Benefici
                </button>
              </div>
            </div>
          )}
        </div>

        {response && !loading && (
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-3">
             <button 
                onClick={() => setResponse('')}
                className="flex-1 px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                Indietro
              </button>
          </div>
        )}
      </div>
    </div>
  );
};
