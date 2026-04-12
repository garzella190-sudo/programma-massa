# 🏋️ Allenamenti Manu (PWA)

Benvenuto in **Allenamenti Manu**, la tua applicazione PWA (Progressive Web App) definitiva per il tracking degli allenamenti di forza e la gestione dei tuoi piani alimentari.

## ✨ Funzionalità

- **🔥 Allenamento Live**: Interfaccia interattiva per eseguire le tue schede in palestra con timer di recupero automatico.
- **📊 Gestione Schede**: Crea e modifica le tue schede di allenamento con supporto per serie multiple e pesi storici automatici.
- **🍎 Piani Alimentari & Integrazione**: Organizza la tua dieta e i tuoi integratori con tabelle eleganti e supporto AI per i dubbi nutrizionali.
- **⌚ Integrazione Amazfit/Xiaomi**: Monitora il tuo battito cardiaco in tempo reale durante l'allenamento tramite Web Bluetooth.
- **🧠 Assistente AI**: Integrato con Google Gemini per rispondere a domande su esercizi, nutrizione e integrazione.
- **📱 PWA Ready**: Installa l'app sulla home del tuo iPhone o Android per un'esperienza fluida e veloce.

## 🚀 Stack Tecnologico

- **Framework**: Next.js 16 (App Router)
- **Database / Auth**: Supabase
- **Styling**: Tailwind CSS 4 (Premium Dark UI)
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa
- **AI**: Google Gemini API

## 🛠️ Configurazione Sviluppo

### Installazione Dipendenze
```bash
npm install
```

### Variabili d'Ambiente
Crea un file `.env.local` con le tue credenziali Supabase e Gemini:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
```

### Avvio Server di Sviluppo
```bash
npm run dev
```

---

## 🗺️ Regole Sviluppo
Si prega di seguire le linee guida architettoniche descritte in `PROJECT_RULES.md` per mantenere la coerenza del codice e della UI.

---
Creato con ❤️ da Manuele Garzella. All Rights Reserved 2026.
