# Defit

Defit e un'app web open source focalizzata su un'unica cosa: mostrarti il tuo **deficit calorico in tempo reale**, aggiornato a ogni pasto e allenamento che registri.

Niente grafici inutili, niente funzionalita superflue. Solo la risposta alla domanda che conta: *sto mangiando nel range giusto oggi?*

### Come funziona

Scrivi cosa hai mangiato in linguaggio naturale, scatta una foto del piatto, o cerca l'alimento. L'AI analizza l'input, stima calorie e macronutrienti, e aggiorna il deficit istantaneamente. Se la descrizione e ambigua ti chiede un chiarimento, altrimenti registra tutto in un colpo solo.

L'obiettivo e ridurre al minimo il tempo che passi a tracciare, per concentrarti sull'obiettivo.

## Funzionalita

- **Inserimento AI** - descrivi il pasto a parole o con una foto. L'AI estrae calorie e macro senza che tu debba cercare nulla.
- **Ricerca OpenFoodFacts** - per gli alimenti confezionati, ricerca per nome e seleziona la quantita in grammi.
- **Inserimento manuale** - se preferisci inserire i valori a mano.
- **Deficit in tempo reale** - la dashboard si aggiorna a ogni inserimento mostrando quanto sei lontano dal tuo obiettivo.
- **Workout** - registra le calorie bruciate e vedi come cambia il deficit.
- **Timeline** - lista degli inserimenti del giorno con drag & drop e modifica inline.
- **Calendario** - storico giornaliero del deficit.
- **Misurazioni** - tracciamento peso e misure corporee.
- **Profilo** - configura TDEE e obiettivi di deficit minimo e massimo.

## Stack tecnico

- **Frontend** — React + TypeScript + Vite + Tailwind CSS
- **Stato** — Zustand
- **Backend / Auth / DB** — Supabase (PostgreSQL + Edge Functions)
- **AI** — OpenAI (modello configurabile via variabile d'ambiente)
- **Dati nutrizionali** — OpenFoodFacts API

---

## Setup

### 1. Crea un progetto Supabase

Vai su [supabase.com](https://supabase.com), crea un nuovo progetto e copia l'URL e la chiave anonima.

### 2. Configura le variabili d'ambiente

Copia il file di esempio e compila i valori:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Aggiungi i secrets alle Edge Functions

Nella dashboard Supabase → **Edge Functions → Secrets**, aggiungi:

| Nome | Valore |
|------|--------|
| `OPENAI_API_KEY` | La tua chiave OpenAI da [platform.openai.com](https://platform.openai.com) |
| `OPENAI_MODEL` | Il modello da usare (es. `gpt-4.1`, `o3`). Default: `gpt-4.1` |

> **Nota:** al momento il progetto supporta solo OpenAI come provider AI. Il supporto ad altri provider (Anthropic, Google, ecc.) potrebbe essere aggiunto in futuro tramite contributi della community.

### 4. Deploya le Edge Functions

```bash
supabase functions deploy analyze-entry
supabase functions deploy refine-entry
```

### 5. Avvia in locale

```bash
npm install
npm run dev
```

---

## Contribuire

Pull request benvenute. Apri una issue per discutere modifiche importanti prima di implementarle.

## Licenza

MIT
