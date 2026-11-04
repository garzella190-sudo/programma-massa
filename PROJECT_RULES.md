# 🗺️ Project Architecture & Rules - Allenamenti Manu

Questo documento definisce la struttura, le regole e le logiche core dell'applicazione **Allenamenti Manu**
(PWA per il tracking di allenamenti, alimentazione e integrazione).

> 🎨 **Il design system è in [`DESIGN_HEVY.md`](./DESIGN_HEVY.md)** (stile Hevy, dark-only).
> Ogni nuova UI **deve** usare i token e le classi `h-*` definiti lì e in `src/app/globals.css`.

---

## 📂 STRUTTURA CARTELLE

Next.js 16 (App Router) + Supabase + Tailwind CSS 4.

```text
src/
├── actions/            # Server Actions
│   ├── alimentazione.ts  # Piani alimentari/integrazione + righe + migrazione
│   ├── workout.ts        # Schede, esercizi, sessioni
│   ├── ai.ts             # Gemini (schede, piano dieta, suggerimenti)
│   ├── auth.ts
│   └── profile.ts
├── app/
│   ├── (protected)/      # Area autenticata (layout + BottomNav)
│   │   ├── schede/       # Elenco e gestione schede
│   │   ├── allenamento/  # Sessione live (LiveWorkout)
│   │   ├── esercizi/     # Catalogo esercizi + ricerca
│   │   ├── dieta/        # Alimentazione & integrazione
│   │   └── profilo/      # Dati biometrici e impostazioni
│   ├── login/            # Autenticazione
│   └── auth/callback/    # Callback Supabase
├── components/
│   ├── diet/             # Modulo alimentazione
│   │   ├── DietSchedule.tsx    # Contenitore: tab, azioni, lista piani
│   │   ├── DietPlanCard.tsx    # Card piano (rinomina, PDF, abbinamento)
│   │   ├── DietPlanTable.tsx   # Tabella righe editabili
│   │   ├── DietAssistant.tsx   # Pannello "Chiedi all'AI"
│   │   ├── DietRowAiModal.tsx  # Modale AI su singola voce
│   │   └── ExportPdfButton.tsx # Esporta PDF del piano
│   ├── workout/          # LiveWorkout + modali schede + picker esercizi
│   └── ui/               # BottomNav, Select, Toast, ConfirmBubble, Icon
├── hooks/                # useHeartRate
├── lib/
│   ├── utils.ts          # cn()
│   └── pdf/pianoAlimentare.ts  # Generazione PDF (jsPDF, on-demand)
├── types/
│   ├── workout.ts        # Tipi allenamento
│   └── diet.ts           # Tipi piani/righe + helper tabella
└── utils/supabase/       # Client browser/server + auth helper
```

---

## 🗄️ DATABASE (SCHEMA CORE)

- **Allenamento**
  - `schede_allenamento`: schede (es. Spinta, Trazione). FK `user_id`, flag `attiva`.
  - `esercizi_scheda`: una riga per **serie** (appiattita).
  - `esercizi_catalogo`: anagrafica esercizi.
- **Alimentazione**
  - `piani_alimentazione`: piani con `tipo` = `alimentazione` | `integrazione`,
    FK `integrazione_abbinata_id` (un piano alimentare può mostrare un piano integrativo).
  - `righe_piano`: voci del piano (`orario`, `voce`, `quantita`, `note`, `ordine`).

---

## 🧩 LOGICHE CRITICHE

### Numerazione serie
Le serie sono appiattite nel DB: la sequenza va calcolata dall'indice dell'array e salvata in `serie`.

### Pesi storici
Selezionando un esercizio in `NewPlanModal`/`EditPlanModal` il sistema cerca l'ultima occorrenza
e applica peso, reps e recupero a **tutte** le serie del gruppo.

### Sessione live (`LiveWorkout`)
Timer di recupero, battito cardiaco (Web Bluetooth) e caricamento schede attive.
Gli esercizi vengono raggruppati per `nome` in visualizzazione.

### Alimentazione
- Un piano alimentare può avere un piano di **integrazione abbinato**; le sue righe vengono
  mostrate in coda (tinta `accent`) e sono in sola lettura.
- Le righe si modificano **inline** (click sulla cella → input → Invio/Esc).
- I piani possono essere creati a mano, generati dall'IA (CSV `Orario | Voce | Quantità | Note`)
  o migrati dal vecchio `programma_giornaliero` (bottone "Migra Piano Massa").

### Esportazione PDF
`src/lib/pdf/pianoAlimentare.ts` genera un PDF A4 con header blu, tabella compatta e sezione
"integrazione abbinata". jsPDF è caricato **on-demand** al primo click (`await import('jspdf')`),
così non pesa sul bundle iniziale. L'API pubblica è `esportaPianoPdf(piano, { integrazione })`
e va invocata da componenti client.

---

## 🎨 DESIGN SYSTEM

Riferimento completo: [`DESIGN_HEVY.md`](./DESIGN_HEVY.md).

- **Tema**: dark-only (nessun `dark:`), canvas `#0E1116`.
- **Accento unico**: Hevy Blue `#1E6FFF` (`bg-accent`, `text-accent`).
- **Semantici**: `done` verde per completato, `pr` oro per record, `danger` rosso per distruttivo.
- **Numeri** sempre con `tnum` (tabular figures).
- **Classi pronte** (`globals.css`): `h-title`, `h-section`, `h-item`, `h-metric`, `h-cell`,
  `h-card-title`, `h-caption`, `h-label`, `h-card`, `h-btn` + varianti, `h-icon-btn`, `h-field`,
  `h-chip`, `h-segmented`, `h-row`, `pb-nav`.
- **Feedback**: `ConfirmBubble` per azioni distruttive, `Toast` per successo/errore.

---

## 📝 WORKFLOW SVILUPPO

1. **Type safety**: evitare `any`; i tipi condivisi vivono in `@/types/`.
2. **Revalidation**: usare `revalidatePath` **dentro** le server actions (mai a livello di modulo).
3. **Server actions**: un solo helper di autenticazione per file; errori lanciati con `throw`.
4. **PWA**: ogni nuovo componente deve essere mobile-first (viewport, touch target ≥ 44px).
5. **Verifica**: `npx tsc --noEmit` e `npm run lint` prima di ogni commit.

---

## ⌚ INTEGRAZIONE HARDWARE

- **Frequenza cardiaca**: standard Web Bluetooth (Amazfit/Xiaomi). Supporto limitato
  ai browser abilitati (es. Bluefy su iOS).
