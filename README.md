# 🏋️ Allenamenti Manu (PWA)

**Allenamenti Manu** è la PWA personale per il tracking degli allenamenti di forza, la gestione
dei piani alimentari e dell'integrazione. Interfaccia **dark-first ispirata a Hevy**.

## ✨ Funzionalità

- **🔥 Allenamento Live**: esecuzione delle schede con timer di recupero e log serie compatto.
- **📊 Gestione Schede**: creazione/modifica con serie multiple, pesi storici automatici e duplicazione.
- **🍎 Piani Alimentari & Integrazione**: piani con righe editabili inline, abbinamento
  alimentazione ↔ integrazione e **esportazione PDF** del piano.
- **⌚ Integrazione Amazfit/Xiaomi**: battito cardiaco in tempo reale via Web Bluetooth.
- **🧠 Assistente AI**: Google Gemini per schede, piano alimentare automatico, alternative e
  spiegazioni nutrizionali.
- **📱 PWA Ready**: installabile su iOS/Android, funziona anche offline per le parti già caricate.

## 🧱 Stack

- **Framework**: Next.js 16 (App Router) · React 19
- **Database / Auth**: Supabase
- **Styling**: Tailwind CSS 4 (design system Hevy — vedi `DESIGN_HEVY.md`)
- **Icons**: Lucide React
- **PDF**: jsPDF (caricato on-demand)
- **AI**: Google Gemini API
- **PWA**: `@ducanh2912/next-pwa`

## 🛠️ Configurazione

```bash
npm install
```

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

```bash
npm run dev      # sviluppo
npm run build    # build produzione
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## 📚 Documentazione

| File | Contenuto |
|---|---|
| `DESIGN_HEVY.md` | Design system (token, tipografia, componenti, do/don't) |
| `PROJECT_RULES.md` | Architettura, schema DB, logiche critiche, workflow |
| `APPOINTMENT_MANAGER_RULES.md` | Regole del progetto gemello "Appointment Manager" |

### Struttura rapida

```text
src/
├── actions/     # server actions (alimentazione, workout, ai, auth, profile)
├── app/         # route: login, (protected)/schede|allenamento|esercizi|dieta|profilo
├── components/  # diet/ · workout/ · ui/
├── lib/         # utils + pdf/
├── types/       # workout.ts, diet.ts
└── hooks/       # useHeartRate
```

---

Creato con ❤️ da Manuele Garzella. All Rights Reserved 2026.
