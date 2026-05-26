/**
 * Cloudflare Worker: proxy seguro hacia Gemini para Don Chucho.
 * Secret requerido: GEMINI_KEY
 * Variable opcional: GEMINI_MODEL (default gemini-2.0-flash-lite)
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

    const model = env.GEMINI_MODEL || "gemini-2.0-flash-lite";
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      env.GEMINI_KEY;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();

    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: { "Content-Type": "application/json", ...cors },
    });
  },
};
