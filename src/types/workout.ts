// types/workout.ts

export type WorkoutIcon = 
  | 'Dumbbell' 
  | 'Clock' 
  | 'Activity' 
  | 'Check'
  | 'Flame'
  | 'History'
  | 'Trophy'
  | 'X'
  | 'Plus'
  | 'Play'
  | 'Square'
  | 'MoreVertical'
  | 'Sparkles'
  | 'Loader2'
  | 'Settings'
  | 'Download'
  | 'Coffee'
  | 'Utensils'
  | 'Moon'
  | 'Zap'
  | 'ShieldPlus'
  | 'ChevronRight'
  | 'Key';

// 1. Esercizi Catalogo
export interface EsercizioCatalogo {
  id: string;
  nome: string;
  gruppo_muscolare: string;
  attrezzatura: string;
  creato_at?: string;
}

// 2. Schede Allenamento (Template)
export interface SchedaAllenamento {
  id: string;
  user_id: string;
  nome: string;
  creato_at?: string;
  aggiornato_at?: string;
}

// 3. Esercizi all'interno della Scheda (Template items)
export interface EsercizioScheda {
  id: string;
  scheda_id: string;
  esercizio_id: string;
  serie_target: number;
  reps_target: string;
  recupero_target: number;
  ordine: number;
  creato_at?: string;
  // JOIN fields
  esercizio?: EsercizioCatalogo;
}

// 4. Allenamento (Diario/Sessione)
export interface Allenamento {
  id: string;
  user_id: string;
  scheda_id?: string | null;
  nome: string;
  inizio_at: string;
  fine_at?: string | null;
  note?: string | null;
  creato_at?: string;
}

// 5. Serie eseguite
export type TipoSerie = 'Normal' | 'Warmup' | 'Drop' | 'Failure';

export interface SerieAllenamento {
  id: string;
  allenamento_id: string;
  esercizio_id: string;
  tipo: TipoSerie;
  peso: number;
  reps: number;
  rpe?: number | null;
  creato_at?: string;
  // JOIN fields
  esercizio?: EsercizioCatalogo;
}

// Helper types per la UI (es. raggruppamento per Live Session)
export interface EsercizioLiveSession {
  esercizio_id: string;
  esercizio_nome: string;
  serie: SerieAllenamento[];
}

// Input types per completaAllenamento
export interface SerieInput {
  tipo: TipoSerie;
  peso: number;
  reps: number;
  rpe?: number | null;
}

export interface EsercizioAllenamentoInput {
  esercizio_id: string;
  serie: SerieInput[];
}
