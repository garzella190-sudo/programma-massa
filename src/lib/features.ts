// lib/features.ts
// Interruttori delle funzionalità. La chat/AI della dieta è temporaneamente spenta:
// per riattivarla basta rimettere `true` qui (nessun'altra modifica necessaria).

export const FEATURES = {
  /** Pannello "Chiedi all'AI" + suggerimenti IA nelle righe del piano */
  chatDieta: false,
  /** Generazione automatica del piano con l'IA */
  generaPianoIA: false,
} as const

export const IA_DIETA_ATTIVA = FEATURES.chatDieta || FEATURES.generaPianoIA
