# 🗺️ Project Architecture & Rules - Allenamenti Manu

Questo documento definisce la struttura, le regole e le logiche core dell'applicazione "Allenamenti Manu" (PWA per il tracking di allenamenti e dieta).

---

## 📂 STRUTTURA CARTELLE
L'applicazione utilizza **Next.js (App Router)** e **Supabase**.

```text
src/
├── actions/        # Server Actions (workout.ts, alimentazione.ts, ai.ts)
├── app/            # App Router (allenamento, schede, dieta, login)
├── components/     # UI
│   ├── workout/    # LiveWorkout, Modal per schede, Picker esercizi
│   └── ui/         # Componenti base (Select, Toast, ConfirmBubble)
├── hooks/          # Custom hooks (useHeartRate, useAuth)
├── lib/            # Utilities (utils.ts, supabase client)
└── types/          # Definizioni TypeScript (workout.ts)
```

---

## 🗄️ DATABASE (SCHEMA CORE)
Utilizziamo Supabase con le seguenti tabelle principali:

- **Allenamento**:
  - `schede_allenamento`: Elenco delle schede (es. Spinta, Trazione). FK: `user_id`.
  - `esercizi_scheda`: Singole serie di ogni esercizio. Ogni record è una serie.
- **Alimentazione**:
  - `piani_alimentazione`: Piani (es. Massa da 93kg). Tipo: `alimentazione` o `integrazione`.
  - `righe_piano`: Singole voci del piano (orario, voce, quantità).

---

## 🧩 LOGICHE CRITICHE

### Numerazione Serie
Le serie negli esercizi sono **appiattite** nel database. La sequenza corretta deve essere calcolata tramite l'indice dell'array nel form e salvata nel campo `serie` (1, 2, 3...).

### Pesi Storici
Quando si seleziona un esercizio in `NewPlanModal` o `EditPlanModal`, il sistema cerca l'ultima occorrenza di quell'esercizio e applica automaticamente peso, reps e recupero a **tutte le serie** del gruppo corrente.

### Sessione Live (`LiveWorkout`)
Gestisce il timer di recupero, il battito cardiaco (Web Bluetooth) e il caricamento delle schede attive. Gli esercizi vengono raggruppati per `nome` durante la visualizzazione.

---

## 🎨 DESIGN SYSTEM (AESTHETICS)
- **Framework**: Tailwind CSS 4.
- **Stile**: "Premium Dark Mode First". Sfondi `#09090b`, accenti blu (`blue-600`) e superfici `zinc-900`.
- **Geometrie**:
  - **Cards/Input**: `rounded-[24px]` o `rounded-3xl`.
  - **Modali/Sezioni Core**: `rounded-[32px]` per un look moderno e morbido.
- **Feedback**: Utilizzare sempre `ConfirmBubble` per azioni distruttive e `Toast` per notifiche di successo/errore.

---

## 📝 WORKFLOW SVILUPPO
1. **Type Safety**: Evitare `any`. Utilizzare le interfacce definite in `@/types/` o esportate dalle actions.
2. **Revalidation**: Usare `revalidatePath` nelle server actions per aggiornare la UI istantaneamente.
3. **PWA**: Assicurarsi che ogni nuovo componente sia compatibile con l'uso mobile (viewport, touch targets).

---

## ⌚ INTEGRAZIONE HARDWARE
- **Frequenza Cardiaca**: Utilizza lo standard Web Bluetooth per connettersi a dispositivi ( Amazfit/Xiaomi). Il supporto è limitato ai browser abilitati (es. Bluefy su iOS).
