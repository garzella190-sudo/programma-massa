# 🎨 DESIGN SYSTEM — Hevy Style (Allenamenti Manu)

> Fonte di verità visiva dell'app. Ogni componente **deve** usare i token e le classi definiti qui.
> Ispirato al design system di Hevy (workout logger): dark-first, un solo colore d'azione, numeri tabulari.

---

## 1. Principi

1. **Dark-first, senza eccezioni.** Non esiste light mode. Canvas `#0E1116` (near-black blu-cool, mai `#000000`).
2. **Un solo colore d'azione:** Hevy Blue `#1E6FFF`. Bottoni primari, tab attiva, titoli esercizio, link, timer.
3. **I numeri sono l'elemento più forte**: sempre `tabular-nums` (classe `tnum`).
4. **Profondità = scala di superfici + bordi 1px**, non ombre pesanti.
5. **Densità dove serve**: righe compatte, target touch ≥ 44px, testo ≥ 13px.
6. **Motion funzionale e veloce**: 120–320ms, `ease-out`. Niente animazioni decorative.

---

## 2. Token colore (definiti in `globals.css` → `@theme`)

| Token | Tailwind | Hex | Uso |
|---|---|---|---|
| Canvas | `bg-canvas` | `#0E1116` | Sfondo app |
| Card | `bg-card` | `#161B22` | Card, righe lista, sheet |
| Field | `bg-field` | `#1F2630` | Input, celle, segmented track |
| Raised | `bg-raised` | `#283040` | Chip, thumbnail, riga premuta |
| Line | `border-line` | `#262C36` | Hairline / divisori |
| Accent | `text-accent` `bg-accent` | `#1E6FFF` | Azione primaria (unica) |
| Accent pressed | `bg-accent-pressed` | `#1857CC` | `:active` dei primari |
| Accent soft | `bg-accent-soft` | `#14233F` | Riempimento tonale, glow selezionato |
| Ink | `text-ink` | `#F2F4F8` | Testo primario / numeri |
| Ink 2 | `text-ink-2` | `#9BA3B0` | Label, caption, header colonne |
| Ink 3 | `text-ink-3` | `#5E6675` | Placeholder, disabled, icone inattive |
| Done | `text-done` `bg-done` | `#2FBF71` | Set completato, successo |
| PR | `text-pr` `bg-pr` | `#F5B83D` | Record, badge oro |
| Danger | `text-danger` `bg-danger` | `#F1545B` | Distruttivo / errore |
| Warn | `text-warn` | `#F5A623` | Avvisi, modifiche non salvate |

Opacità con modificatore Tailwind: `bg-done/16` (wash riga completata), `bg-pr/18` (badge PR), `bg-accent/16` (tab attiva).

---

## 3. Tipografia

Font unico: **Inter** (`--font-inter`, applicato al `body`). Fallback system.

| Ruolo | Classe repo | Specifica |
|---|---|---|
| Screen title | `.h-title` | 32px / 800 / -0.6px / `text-ink` |
| Section title | `.h-section` | 22px / 700 / -0.3px |
| Exercise / item name | `.h-item` | 18px / 700 / `text-accent` |
| Metric / timer | `.h-metric` | 17px / 700 / `tnum` |
| Body | `.h-body` | 16px / 400 / 1.5 |
| Cell value | `.h-cell` | 15px / 600 / `tnum` |
| Card title | `.h-card-title` | 15px / 600 |
| Caption | `.h-caption` | 13px / 500 / `text-ink-2` |
| Column label | `.h-label` | 11px / 600 / uppercase / 0.5px / `text-ink-2` |
| Badge | `.h-badge` | 10px / 800 / uppercase / 0.3px |
| Tab label | `.h-tab-label` | 10px / 600 |

Regola: uppercase **solo** per micro-label (colonne, badge, tab). Mai per titoli o body.

---

## 4. Ricette componenti (classi pronte in `globals.css`)

```tsx
// Card
<div className="h-card p-3.5">…</div>

// Bottone primario (Finish / Salva / CTA)
<button className="h-btn h-btn-primary">…</button>

// Bottone outline (Aggiungi…)
<button className="h-btn h-btn-outline">…</button>

// Bottone tonale (+ Aggiungi riga, azioni inline)
<button className="h-btn h-btn-tonal">…</button>

// Bottone icona 44px
<button className="h-icon-btn">…</button>

// Input / cella
<input className="h-field" />
<select className="h-field" />

// Campo riga tabella: celle editabili
<div className="h-cell-box">…</div>

// Divider
<div className="h-divider" />

// Chip / badge
<span className="h-chip">…</span>
<span className="h-badge bg-pr/18 text-pr">★ NEW PR</span>
```

### Righe / tabelle (pattern Hevy)
- Header colonne: `h-label`, altezza compatta, `border-b border-line`.
- Riga: `flex items-center gap-2 px-3 py-2` con `border-b border-line/60`.
- Riga completata: `bg-done/16` + check `bg-done text-white`.
- Celle numeriche: `h-cell tnum text-ink`; `Previous` in `text-ink-3 h-caption`.
- Tap target minimo 44px: usare `h-11` o `py-2.5` sui bottoni icona.

---

## 5. Navigazione

**Bottom tab bar** (5 voci, altezza 68px + safe-area):
- Sfondo `bg-canvas/94` + `backdrop-blur`, bordo superiore `border-line`.
- Icona 22px, label `h-tab-label` **sempre visibile**.
- Attiva: icona `text-accent` + riempimento soft `bg-accent/16`; inattiva `text-ink-3`.
- **Nessuna pillola di tint**: lo stato attivo è solo colore icona + soft fill su icona/label.

**Header schermata**: titolo `.h-title` a sinistra, azione icona a destra; `pb-4`, inset orizzontale 16–18px.

**Sheet / modale**: `bg-card`, `rounded-[20px]`, bordo `border-line`, ombra `0 -10px 32px rgba(0,0,0,.6)` per i bottom sheet; scrim `bg-black/55`.

---

## 6. Do / Don't

**Do**
- Canvas `#0E1116`, card `#161B22`, field `#1F2630` — scala di superfici per la profondità.
- `tnum` su ogni numero (pesi, reps, serie, volumi, timer, quantità).
- Nome esercizio/pasto bold **e** blu (heading + affordance).
- Verde `#2FBF71` a 16% per le righe completate, oro `#F5B83D` per i record.
- Bordi 1px `#262C36` come separatore primario.

**Don't**
- ❌ secondo colore di brand (viola/emerald/amber sparsi) → tutto passa da `accent`.
- ❌ `#000000` puro come canvas.
- ❌ ombre grandi e colorate (`shadow-blue-500/30`) → solo ombre neutre per i layer flottanti.
- ❌ angoli `rounded-[32px]` giganti ovunque: massimo 16px card, 20px sheet.
- ❌ testo grigio chiaro su campo chiaro: usare la scala `ink` / `ink-2` / `ink-3`.
- ❌ light mode (`dark:` duplicato): l'app è dark-only.

---

## 7. Mappatura rapida dal vecchio stile

| Prima | Ora |
|---|---|
| `bg-[#f4f4f4] dark:bg-[#09090b]` | `bg-canvas` |
| `bg-white dark:bg-zinc-900` | `bg-card` |
| `bg-zinc-100 dark:bg-zinc-800` | `bg-field` |
| `text-zinc-900 dark:text-white` | `text-ink` |
| `text-zinc-400 dark:text-zinc-500` | `text-ink-2` |
| `text-zinc-300 dark:text-zinc-600` | `text-ink-3` |
| `border-zinc-200 dark:border-zinc-800` | `border-line` |
| `bg-blue-600` / `text-blue-600` | `bg-accent` / `text-accent` |
| `bg-purple-600` / `emerald` / `violet` | `accent` (o `done` solo per successo) |
| `rounded-[32px]` / `rounded-3xl` | `rounded-[16px]` (card) / `rounded-[20px]` (sheet) |
| `rounded-[20px]` bottoni | `rounded-[12px]` |
| `shadow-xl shadow-blue-500/30` | nessuna ombra / `shadow-[0_8px_24px_rgba(0,0,0,0.5)]` |
