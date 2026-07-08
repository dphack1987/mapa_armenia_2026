/**
 * Proxy Gemini para Don Chucho.
 * Secrets: GEMINI_KEY
 * Vars:    GEMINI_MODEL (opcional)
 * El cliente puede enviar "_model" en el JSON para forzar el modelo.
 */
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    if (!env.GEMINI_KEY) {
      return Response.json(
        { error: { message: "GEMINI_KEY no configurada en el Worker" } },
        { status: 500, headers: cors }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: cors });
    }

    const model = body._model || env.GEMINI_MODEL || "gemini-2.0-flash-lite";
    delete body._model;

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      env.GEMINI_KEY;

    try {
      // Build the request payload from the parsed `body` and forward it
      // to the Generative Language API. Previously `geminiBody` was
      // referenced but not defined.
      const geminiBody = body;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await geminiRes.json();

      return new Response(JSON.stringify(data), {
        status: geminiRes.status,
        headers: { "Content-Type": "application/json", ...cors },
      });
    } catch (error) {
      console.error("Worker error:", error);
      
      if (error.name === "AbortError") {
        return Response.json(
          { error: { message: "Tiempo de espera agotado", code: 504 } },
          { status: 504, headers: cors }
        );
      }
      
      return Response.json(
        { error: { message: "Error en el servicio de IA", code: 503 } },
        { status: 503, headers: cors }
      );
    }
  },
};
