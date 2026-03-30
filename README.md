# Defit

Defit è un'app web per il tracciamento del deficit calorico giornaliero. Permette di registrare pasti e allenamenti, calcolare il deficit rispetto al proprio TDEE e monitorare i progressi nel tempo.

## Funzionalità principali

- **Inserimento alimenti** — testo libero, foto o ricerca su OpenFoodFacts. L'AI analizza l'input e stima calorie e macronutrienti (carboidrati, proteine, grassi).
- **Inserimento workout** — registra le calorie bruciate durante l'allenamento.
- **Dashboard** — anelli interattivi che mostrano il deficit del giorno in tempo reale.
- **Timeline** — lista degli inserimenti del giorno, con drag & drop per riordinare e possibilità di modifica.
- **Calendario** — storico giornaliero con andamento del deficit nel tempo.
- **Misurazioni** — tracciamento del peso corporeo e altre misure.
- **Profilo** — configurazione di TDEE e obiettivi di deficit (min/max).
- **Onboarding** — wizard iniziale per impostare i dati personali.

## Stack tecnico

- **Frontend** — React + TypeScript + Vite
- **Styling** — Tailwind CSS
- **Stato** — Zustand
- **Backend / Auth / DB** — Supabase (PostgreSQL + Edge Functions)
- **AI** — OpenAI GPT-5.4-pro per l'analisi degli alimenti e il raffinamento delle voci
- **Dati nutrizionali** — OpenFoodFacts API

## Variabili d'ambiente

Crea un file `.env` nella root del progetto:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Avvio in locale

```bash
npm install
npm run dev
```

## Deploy delle Edge Functions

```bash
supabase functions deploy analyze-entry
supabase functions deploy refine-entry
```
