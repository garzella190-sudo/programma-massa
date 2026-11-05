// lib/seedPianoMassa.ts
// Dati originali del "Piano Massa 93kg" (estratti da Programma_Massa_Manu_v4.html).
// Servono a ripristinare il piano quando il database viene ricreato o svuotato.

import type { TipoPiano } from '@/types/diet'

export interface RigaSeed {
  ordine: number
  orario: string
  fase: string
  pasto: string
  sostanza: string
  quantita: string
  note: string
}

const FASI_INTEGRAZIONE = ["supporto","focus","pre-wk","post-wk","shaker","digestione","repair"]

export const RIGHE_PIANO_MASSA: RigaSeed[] = [
  { ordine: 0, orario: "07:00", fase: "Colazione", pasto: "Yogurt Fage + Muesli + Frutta", sostanza: "Proteine + Carbo + Fibre", quantita: "150g+50g+100g", note: "Base anabolica e micronutrienti." },
  { ordine: 1, orario: "07:15", fase: "Supporto", pasto: "Nutrea Pro", sostanza: "Glucosamina / Condroitina", quantita: "2 cpr", note: "Supporto strutturale cartilagini." },
  { ordine: 2, orario: "07:15", fase: "Supporto", pasto: "OptiMSM", sostanza: "Metilsulfonilmetano (Zolfo)", quantita: "2 capsule", note: "Antinfiammatorio e riparazione." },
  { ordine: 3, orario: "07:15", fase: "Focus", pasto: "Lions Mane (Hericium)", sostanza: "Estratto fungino (Nootropo)", quantita: "1 compressa", note: "Focus mentale per il workout." },
  { ordine: 4, orario: "10:30", fase: "Spuntino", pasto: "Pane Integrale + Mandorle", sostanza: "Carbo + Grassi buoni", quantita: "2 fette + 15g", note: "Carburante energetico." },
  { ordine: 5, orario: "12:00", fase: "Pre-WK", pasto: "Citrullina + BCAA", sostanza: "Aminoacidi (Pump & Protezione)", quantita: "5+5 cpr", note: "Stimolo NO2 e anti-catabolismo." },
  { ordine: 6, orario: "12:00", fase: "Pre-WK", pasto: "Creatina (Dose 1)", sostanza: "Creatina Monoidrato", quantita: "3.5 g", note: "ATP per la forza (300ml H2O)." },
  { ordine: 7, orario: "12:30", fase: "TRAIN", pasto: "Allenamento Forza", sostanza: "Stimolo Meccanico", quantita: "60 min", note: "Consumo stimato ~500kcal." },
  { ordine: 8, orario: "13:45", fase: "Pranzo", pasto: "Riso + Panino + Proteina + Budino", sostanza: "Carbo + Proteine (Caseine)", quantita: "Variabile", note: "Pasto Massa (Riso+Pane)." },
  { ordine: 9, orario: "13:50", fase: "Post-WK", pasto: "Creatina (Dose 2)", sostanza: "Creatina Monoidrato", quantita: "3.5 g", note: "Recupero scorte ATP post-fatica." },
  { ordine: 10, orario: "15:45", fase: "Shaker", pasto: "Whey + Farina d'Avena", sostanza: "Siero Latte + Carbo Complessi", quantita: "35g + 35g", note: "Surplus calorico (400ml H2O)." },
  { ordine: 11, orario: "15:45", fase: "Digestione", pasto: "Bromelina", sostanza: "Enzima Proteolitico", quantita: "1 compressa", note: "Digerisce Proteine/Avena." },
  { ordine: 12, orario: "19:15", fase: "Repair", pasto: "OptiMSM", sostanza: "Metilsulfonilmetano (Zolfo)", quantita: "3 capsule", note: "Riparazione tendinea notturna." },
  { ordine: 13, orario: "20:30", fase: "Cena", pasto: "Pasta + Proteina + Olio", sostanza: "Carbo + Proteine + Lipidi", quantita: "100g + 200g", note: "Recupero glicogeno notturno." },
]

export function eIntegrazione(fase: string): boolean {
  return FASI_INTEGRAZIONE.includes(fase.trim().toLowerCase())
}

export const NOME_PIANO_MASSA = 'Piano Massa 93kg'
export const NOME_INTEGRAZIONE_MASSA = 'Integrazione Massa 93kg'

export function righePerTipo(tipo: TipoPiano): RigaSeed[] {
  return RIGHE_PIANO_MASSA.filter((riga) =>
    tipo === 'integrazione' ? eIntegrazione(riga.fase) : !eIntegrazione(riga.fase),
  )
}
