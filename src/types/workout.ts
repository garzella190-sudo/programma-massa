export type WorkoutIcon = 
  | 'Clock' 
  | 'Coffee' 
  | 'Dumbbell' 
  | 'Utensils' 
  | 'Moon' 
  | 'Zap' 
  | 'ShieldPlus' 
  | 'Sparkles' 
  | 'X' 
  | 'Loader2' 
  | 'ChevronRight' 
  | 'Activity' 
  | 'Download' 
  | 'Settings' 
  | 'Key';

export interface WorkoutItem {
  id: number;
  time: string;
  phase: string;
  items: string;
  substance: string;
  qty: string;
  notes: string;
  icon: WorkoutIcon;
  highlight: boolean;
}

export const scheduleData: WorkoutItem[] = [
  {
    id: 1,
    time: "07:00",
    phase: "Colazione",
    items: "Yogurt Fage + Muesli + Frutta",
    substance: "Proteine + Carbo + Fibre",
    qty: "150g+50g+100g",
    notes: "Base anabolica e micronutrienti.",
    icon: 'Coffee',
    highlight: false
  },
  {
    id: 2,
    time: "07:15",
    phase: "Supporto",
    items: "Nutrea Pro",
    substance: "Glucosamina / Condroitina",
    qty: "2 cpr",
    notes: "Supporto strutturale cartilagini.",
    icon: 'ShieldPlus',
    highlight: true
  },
  {
    id: 3,
    time: "07:15",
    phase: "Supporto",
    items: "OptiMSM",
    substance: "Metilsulfonilmetano (Zolfo)",
    qty: "2 capsule",
    notes: "Antinfiammatorio e riparazione.",
    icon: 'ShieldPlus',
    highlight: true
  },
  {
    id: 4,
    time: "07:15",
    phase: "Focus",
    items: "Lions Mane (Hericium)",
    substance: "Estratto fungino (Nootropo)",
    qty: "1 compressa",
    notes: "Focus mentale per il workout.",
    icon: 'Zap',
    highlight: true
  },
  {
    id: 5,
    time: "10:30",
    phase: "Spuntino",
    items: "Pane Integrale + Mandorle",
    substance: "Carbo + Grassi buoni",
    qty: "2 fette + 15g",
    notes: "Carburante energetico.",
    icon: 'Coffee',
    highlight: false
  },
  {
    id: 6,
    time: "12:00",
    phase: "Pre-WK",
    items: "Citrullina + BCAA",
    substance: "Aminoacidi (Pump & Protezione)",
    qty: "5+5 cpr",
    notes: "Stimolo NO2 e anti-catabolismo.",
    icon: 'Zap',
    highlight: false
  },
  {
    id: 7,
    time: "12:00",
    phase: "Pre-WK",
    items: "Creatina (Dose 1)",
    substance: "Creatina Monoidrato",
    qty: "3.5 g",
    notes: "ATP per la forza (300ml H2O).",
    icon: 'Zap',
    highlight: true
  },
  {
    id: 8,
    time: "12:30",
    phase: "TRAIN",
    items: "Allenamento Forza",
    substance: "Stimolo Meccanico",
    qty: "60 min",
    notes: "Consumo stimato ~500kcal.",
    icon: 'Dumbbell',
    highlight: true
  },
  {
    id: 9,
    time: "13:45",
    phase: "Pranzo",
    items: "Riso + Panino + Proteina + Budino",
    substance: "Carbo + Proteine (Caseine)",
    qty: "Variabile",
    notes: "Pasto Massa (Riso+Pane).",
    icon: 'Utensils',
    highlight: true
  },
  {
    id: 10,
    time: "13:50",
    phase: "Post-WK",
    items: "Creatina (Dose 2)",
    substance: "Creatina Monoidrato",
    qty: "3.5 g",
    notes: "Recupero scorte ATP post-fatica.",
    icon: 'Zap',
    highlight: true
  },
  {
    id: 11,
    time: "15:45",
    phase: "Shaker",
    items: "Whey + Farina d'Avena",
    substance: "Siero Latte + Carbo Complessi",
    qty: "35g + 35g",
    notes: "Surplus calorico (400ml H2O).",
    icon: 'Zap',
    highlight: true
  },
  {
    id: 12,
    time: "15:45",
    phase: "Digestione",
    items: "Bromelina",
    substance: "Enzima Proteolitico",
    qty: "1 compressa",
    notes: "Digerisce Proteine/Avena.",
    icon: 'ShieldPlus',
    highlight: true
  },
  {
    id: 13,
    time: "19:15",
    phase: "Repair",
    items: "OptiMSM",
    substance: "Metilsulfonilmetano (Zolfo)",
    qty: "3 capsule",
    notes: "Riparazione tendinea notturna.",
    icon: 'ShieldPlus',
    highlight: true
  },
  {
    id: 14,
    time: "20:30",
    phase: "Cena",
    items: "Pasta + Proteina + Olio",
    substance: "Carbo + Proteine + Lipidi",
    qty: "100g + 200g",
    notes: "Recupero glicogeno notturno.",
    icon: 'Moon',
    highlight: true
  }
];
