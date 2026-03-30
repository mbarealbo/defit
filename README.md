# Defit

Defit è un'app web open source per il tracciamento del deficit calorico giornaliero. Registra pasti e allenamenti, calcola il deficit rispetto al tuo TDEE e monitora i progressi nel tempo.

## Funzionalità

- **Inserimento alimenti** — testo libero, foto o ricerca su OpenFoodFacts. L'AI stima calorie e macro (carboidrati, proteine, grassi).
- **Inserimento workout** — registra le calorie bruciate.
- **Dashboard** — anelli interattivi con il deficit del giorno in tempo reale.
- **Timeline** — lista degli inserimenti con drag & drop e modifica inline.
- **Calendario** — storico giornaliero del deficit.
- **Misurazioni** — tracciamento peso e misure corporee.
- **Profilo** — configurazione TDEE e obiettivi di deficit (min/max).

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
