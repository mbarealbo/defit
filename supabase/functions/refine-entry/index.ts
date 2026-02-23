import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EntryState {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface RequestPayload {
  currentEntry: EntryState;
  userPrompt: string;
}

interface RefinedEntry {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { currentEntry, userPrompt } = (await req.json()) as RequestPayload;

    if (!currentEntry || !userPrompt) {
      return new Response(
        JSON.stringify({ error: "currentEntry and userPrompt are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Sei un nutrizionista AI esperto. L'utente sta modificando una voce alimentare esistente. Riceverai i valori nutrizionali attuali e la modifica richiesta dall'utente. DEVI ricalcolare le nuove calorie totali esatte, carboidrati, proteine e grassi combinando i dati esistenti con la nuova richiesta. Restituisci SOLO un oggetto JSON con i campi aggiornati: name (aggiornalo per riflettere le modifiche, es. 'Pasta + Olio'), kcal, carbs, protein, fat. Non aggiungere testo al di fuori del JSON. IMPORTANTE: Devi restituire SOLO numeri interi (senza decimali) per kcal, carbs, protein e fat. Arrotonda qualsiasi decimale al numero intero più vicino (es. 0.2 diventa 0, 1.8 diventa 2).`;

    const userMessage = `Voce attuale:
- Nome: ${currentEntry.name}
- Calorie: ${currentEntry.kcal} kcal
- Carboidrati: ${currentEntry.carbs}g
- Proteine: ${currentEntry.protein}g
- Grassi: ${currentEntry.fat}g

Modifica richiesta: ${userPrompt}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 512,
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      let detail = `OpenAI returned ${openaiResponse.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        detail = parsed?.error?.message || detail;
      } catch { /* use default */ }

      return new Response(
        JSON.stringify({ error: detail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from OpenAI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw = JSON.parse(content) as RefinedEntry;
    const refined: RefinedEntry = {
      name: raw.name,
      kcal: Math.round(Number(raw.kcal) || 0),
      carbs: Math.round(Number(raw.carbs) || 0),
      protein: Math.round(Number(raw.protein) || 0),
      fat: Math.round(Number(raw.fat) || 0),
    };

    return new Response(JSON.stringify(refined), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
