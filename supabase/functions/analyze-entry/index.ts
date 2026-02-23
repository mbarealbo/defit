import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  text: string;
  image?: string;
  type: "food" | "workout";
  previousContext?: string;
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

    const { text, image, type, previousContext } = (await req.json()) as RequestPayload;

    if (!type || !["food", "workout"].includes(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid type. Must be 'food' or 'workout'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Sei l'assistente di Defit. L'utente ha indicato esplicitamente che questo inserimento è di tipo: ${type}.
REGOLE:
1. Se il tipo è 'food', analizza il testo o la foto del cibo. Restituisci le calorie stimate e i macro (carbs, protein, fat). Se la quantità è ambigua (es. 'un piatto di pasta' senza peso), imposta status su 'clarification_needed' e fai una domanda all'utente.
2. Se il tipo è 'workout', analizza il testo o la foto (es. display tapis roulant) per estrarre ESCLUSIVAMENTE le calorie bruciate. Ignora i macro (impostali a 0).
3. IMPORTANTE: Devi restituire SOLO numeri interi (senza decimali) per kcal, carbs, protein e fat. Arrotonda qualsiasi decimale al numero intero più vicino (es. 0.2 diventa 0, 1.8 diventa 2).
4. Rispondi SEMPRE E SOLO in formato JSON con questa struttura:
{
  "status": "success" | "clarification_needed",
  "message": "eventuale messaggio o domanda per l'utente",
  "items": [ { "name": "nome voce", "kcal": 0, "carbs": 0, "protein": 0, "fat": 0 } ],
  "total_kcal": 0
}`;

    if (!text && !image) {
      return new Response(
        JSON.stringify({ error: "Provide at least text or an image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resolvedText = text;
    if (previousContext) {
      resolvedText = `CONTESTO PRECEDENTE: L'utente voleva inserire: "${previousContext}".
DOMANDA FATTA ALL'UTENTE: Hai chiesto chiarimenti sulle quantità.
RISPOSTA DELL'UTENTE: "${text}".

AZIONE RICHIESTA ORA: Ora hai tutte le informazioni. Calcola i valori nutrizionali totali combinando queste informazioni.
DEVI restituire "status": "success", compilare l'array "items" con i valori calcolati e "total_kcal". NON chiedere ulteriori chiarimenti.`;
    }

    let userMessage: string | Array<Record<string, unknown>>;

    if (image) {
      const parts: Array<Record<string, unknown>> = [];
      if (resolvedText) parts.push({ type: "text", text: resolvedText });
      parts.push({
        type: "image_url",
        image_url: { url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}` },
      });
      userMessage = parts;
    } else {
      userMessage = resolvedText;
    }

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
        max_tokens: 1024,
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

    const parsed = JSON.parse(content);

    if (Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item: Record<string, unknown>) => ({
        ...item,
        kcal: Math.round(Number(item.kcal) || 0),
        carbs: Math.round(Number(item.carbs) || 0),
        protein: Math.round(Number(item.protein) || 0),
        fat: Math.round(Number(item.fat) || 0),
      }));
    }
    if (parsed.total_kcal !== undefined) {
      parsed.total_kcal = Math.round(Number(parsed.total_kcal) || 0);
    }

    return new Response(JSON.stringify(parsed), {
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
