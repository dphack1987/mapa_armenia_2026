/**
 * Don Chucho — Asistente turístico de Armenia 2026
 * Arriero quindiano con poncho y carriel
 * Respuestas locales para POIs/pautas + Gemini vía Cloudflare Worker
 */

(function () {
  "use strict";

  const _cfg = () => window.DON_CHUCHO_CONFIG || {};
  const WORKER_URL =
    _cfg().WORKER_URL || "https://don-chucho-proxy.parraprietodavid87.workers.dev";
  const GEMINI_MODEL = _cfg().GEMINI_MODEL || "gemini-2.5-flash";

  /* ─── Constantes UI ──────────────────────────────────────── */
  const AVATAR_SVG = `<img src="avatar_chucho/don-chucho-bust.png" alt="Don Chucho" width="40" height="40" style="border-radius:50%;display:block;object-fit:cover;object-position:center top;" />`;

  const SALUDOS = [
    "¡Buenas, mijo! Soy Don Chucho, tu arriero digital con poncho y carriel. ¿Por dónde empezamos a explorar Armenia? ☕",
    "¡Ey, paisano! ¡Qué gusto tenerte por la Ciudad Milagro! Soy Don Chucho, tu guía. ¿Qué quieres conocer primero?",
    "¡Holaaaa! Don Chucho a la orden. ¿Listo para descubrir lo mejor del Quindío? ☕",
    "¡Ay, qué chévere! Ya llegaste. Soy Don Chucho, tu arriero virtual. ¿Por dónde empezamos?",
    "¡Buenas tardes, mijo! Don Chucho aquí para guiarte por Armenia. ¿Qué te apetece hacer?",
    "¡Ey, qué tal! ¡Contento de tenerte aquí! Soy Don Chucho. ¿Querés ver sitios, comer o comprar?",
    "¡Bienvenido a Armenia, capital del Quindío! Soy Don Chucho, tu arriero. Vamos a explorar juntos! ☕",
    "¡Hola, paisano! Don Chucho a tus órdenes. ¿Por dónde quieres comenzar nuestra aventura?",
  ];

  const CHIPS_INICIO = [
    "¿Qué visitar?",
    "¿Dónde comer?",
    "¿Dónde comprar?",
    "Qué hay cerca?",
    "Armar ruta",
  ];

  const ROUTE_MODES = {
    cafe: {
      label: "Ruta café",
      color: "#8d5a2b",
      chips: ["Ruta cultural", "Ruta exprés", "Qué hay cerca?"],
    },
    familiar: {
      label: "Ruta familiar",
      color: "#198754",
      chips: ["Ruta café", "Ruta exprés", "¿Qué visitar?"],
    },
    cultural: {
      label: "Ruta cultural",
      color: "#0f5132",
      chips: ["Ruta café", "Ruta familiar", "Qué hay cerca?"],
    },
    express: {
      label: "Ruta exprés",
      color: "#d35400",
      chips: ["Ruta café", "Ruta cultural", "¿Dónde comer?"],
    },
    compras: {
      label: "Ruta de compras",
      color: "#f1c40f",
      chips: ["Ruta exprés", "¿Dónde comprar?", "¿Dónde comer?"],
    },
  };

  /* ─── Datos del mapa ─────────────────────────────────────── */
  let _pois = [];
  let _pautas = [];
  const _visitorProfile = {
    interests: [],
    companions: null,
    budget: null,
    pace: null,
    duration: null,
  };

  function setPoisData(pois)   { _pois   = pois   || []; }
  function setPautasData(p)    { _pautas = p      || []; }

  function uniqueList(items) {
    return [...new Set((items || []).filter(Boolean))];
  }

  function mergeVisitorProfile(next) {
    if (!next) return false;
    let changed = false;

    if (next.interests?.length) {
      const merged = uniqueList([..._visitorProfile.interests, ...next.interests]);
      if (merged.join("|") !== _visitorProfile.interests.join("|")) {
        _visitorProfile.interests = merged;
        changed = true;
      }
    }

    ["companions", "budget", "pace", "duration"].forEach((key) => {
      if (next[key] && _visitorProfile[key] !== next[key]) {
        _visitorProfile[key] = next[key];
        changed = true;
      }
    });

    return changed;
  }

  /* ─── System prompt para Gemini ──────────────────────────── */
  function buildSystemPrompt() {
    const poisResumen = _pois.map((p) =>
      `- ${p.name} (${p.category}): ${p.description}${p.address ? " · " + p.address : ""}${p.horario ? " · " + p.horario : ""}`
    ).join("\n");

    const pautasResumen = _pautas.map((p) =>
      `- ${p.nombre}: ${p.ficha?.descripcion || p.slogan || ""}. Tel: ${p.telefono || "N/A"}. Horario: ${p.horario || "N/A"}`
    ).join("\n");

    return `Eres Don Chucho, un arriero quindiano con poncho y carriel, personaje típico de la región cafetera de Colombia. Eres el guía turístico virtual del Mapa Digital de Armenia 2026.

PERSONALIDAD:
- Hablas con calidez y humor paisa: usas "mijo", "paisano", "bacano", "chévere", "a la orden", "eso es", "pa'" en vez de "para"
- Eres orgulloso de Armenia, el Quindío y el Eje Cafetero
- Conoces la cultura cafetera, la gastronomía, la historia y las tradiciones quindianas
- Eres amable, servicial y siempre invitas a explorar más
- Terminas muchas respuestas con ☕ o con una invitación a seguir explorando

REGLAS:
- Responde SIEMPRE en español
- Sé conciso pero completo (máximo 4-5 oraciones por respuesta)
- Si preguntan por lugares del mapa, menciona que pueden hacer clic en el mapa para verlos
- Si no sabes algo específico de Armenia, di que no tienes esa info pero sugiere alternativas
- No inventes datos de contacto, horarios ni precios que no estén en el contexto
- No respondas temas que no tengan relación con turismo, gastronomía, cultura o Armenia/Quindío

LUGARES EN EL MAPA (Armenia 2026):
${poisResumen}

ANUNCIANTES DEL MAPA:
${pautasResumen}

CONTEXTO GENERAL:
Armenia es la capital del departamento del Quindío, Colombia. Conocida como "La Ciudad Milagro", fue fundada el 14 de octubre de 1889. Es el corazón del Eje Cafetero, Patrimonio de la Humanidad UNESCO. Tiene clima templado (~18-22°C), es famosa por el café, la arquitectura de bahareque, el paisaje cultural cafetero, el Parque Nacional del Café, el Jardín Botánico del Quindío y la amabilidad de su gente.`;
  }

  function getMapApi() {
    return window.ArmeniaMap || null;
  }

  function getVisitorLocation() {
    const api = getMapApi();
    if (!api?.getUserLocation) return null;
    return api.getUserLocation();
  }

  function buildProfileSummary() {
    const parts = [];
    if (_visitorProfile.interests.length) {
      parts.push(`intereses: ${_visitorProfile.interests.join(", ")}`);
    }
    if (_visitorProfile.companions) {
      parts.push(`viaje: ${_visitorProfile.companions}`);
    }
    if (_visitorProfile.budget) {
      parts.push(`presupuesto: ${_visitorProfile.budget}`);
    }
    if (_visitorProfile.pace) {
      parts.push(`ritmo: ${_visitorProfile.pace}`);
    }
    if (_visitorProfile.duration) {
      parts.push(`tiempo: ${_visitorProfile.duration}`);
    }
    return parts;
  }

  function extractVisitorSignals(text) {
    const q = normText(text);
    const patch = { interests: [] };

    if (/cafe|cafecito|tinto|cafetera/.test(q)) patch.interests.push("cafe");
    if (/comer|comida|restaurante|gastronom|almorzar|cenar/.test(q)) patch.interests.push("gastronomia");
    if (/comprar|shopping|tienda|centro comercial|mercado/.test(q)) patch.interests.push("compras");
    if (/museo|histori|catedral|plaza|cultural|patrimonio/.test(q)) patch.interests.push("cultura");
    if (/parque|naturaleza|jardin|sendero|aire libre|ecoturismo/.test(q)) patch.interests.push("naturaleza");
    if (/aventura|adrenalina|tour|recorrido/.test(q)) patch.interests.push("aventura");
    if (/relax|tranquilo|descansar|suave/.test(q)) patch.interests.push("relax");

    if (/ninos|niños|familia|familiar|con mis hijos|con los ninos|con los niños/.test(q)) {
      patch.companions = "familia";
    } else if (/pareja|novi[ao]s|romantico|romántico/.test(q)) {
      patch.companions = "pareja";
    } else if (/amigos|parceros|grupo/.test(q)) {
      patch.companions = "amigos";
    } else if (/solo|sola|por mi cuenta/.test(q)) {
      patch.companions = "solo";
    }

    if (/economico|econ[oó]mico|barato|baratica|baratico|ahorrar/.test(q)) {
      patch.budget = "economico";
    } else if (/premium|lujo|exclusivo|especial/.test(q)) {
      patch.budget = "premium";
    }

    if (/rapido|r[aá]pido|express|poco tiempo/.test(q)) {
      patch.pace = "rapido";
    } else if (/tranquilo|relajado|sin afan|sin af[aá]n|despacio/.test(q)) {
      patch.pace = "tranquilo";
    }

    if (/una hora|1 hora|dos horas|2 horas|poquito tiempo|corto/.test(q)) {
      patch.duration = "corta";
    } else if (/medio dia|media jornada/.test(q)) {
      patch.duration = "media";
    } else if (/todo el dia|todo el día|jornada completa/.test(q)) {
      patch.duration = "larga";
    }

    patch.interests = uniqueList(patch.interests);
    if (!patch.interests.length) delete patch.interests;
    if (!patch.companions) delete patch.companions;
    if (!patch.budget) delete patch.budget;
    if (!patch.pace) delete patch.pace;
    if (!patch.duration) delete patch.duration;
    return patch;
  }

  function hasVisitorSignals(patch) {
    return Boolean(
      patch &&
      ((patch.interests && patch.interests.length) ||
        patch.companions ||
        patch.budget ||
        patch.pace ||
        patch.duration)
    );
  }

  function buildVisitorContext(userText) {
    const location = getVisitorLocation();
    const profile = buildProfileSummary();
    if (!location && !profile.length) return userText;

    const lines = [userText, "", "Contexto del visitante:"];

    if (location) {
      lines.push("- El turista compartió su ubicación actual.");
      lines.push(`- Latitud: ${location.latitude}`);
      lines.push(`- Longitud: ${location.longitude}`);
      lines.push("- Usa esa cercanía para priorizar recomendaciones, rutas y lugares del mapa.");
    }

    if (profile.length) {
      lines.push("- Perfil del visitante:");
      profile.forEach((item) => lines.push(`- ${item}`));
    }

    return lines.join("\n").trim();
  }

  /* ─── Historial de conversación para Gemini ─────────────── */
  const _history = []; // [{role:"user"|"model", parts:[{text}]}]
  let _systemSent = false;
  const FETCH_TIMEOUT_MS = 45000;

  function extractGeminiText(data) {
    if (data?.error?.message) {
      const e = new Error(data.error.message);
      e.code = data.error.code;
      throw e;
    }
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      throw new Error("Respuesta bloqueada por seguridad");
    }
    const parts = candidate?.content?.parts || [];
    return parts.map((p) => p.text).filter(Boolean).join("").trim();
  }

  function buildGeminiBody() {
    const body = {
      contents: _history.slice(),
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 512,
        topP: 0.9,
        thinkingConfig: { thinkingBudget: 0 },
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    };
    if (!_systemSent) {
      body.system_instruction = { parts: [{ text: buildSystemPrompt() }] };
      _systemSent = true;
    }
    return body;
  }

  async function fetchGeminiJson(url, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const e = new Error(msg);
        e.code = data?.error?.code || res.status;
        throw e;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  function geminiModelsToTry() {
    const list = _cfg().GEMINI_MODELS_FALLBACK || [GEMINI_MODEL, "gemini-2.0-flash-lite"];
    const primary = _cfg().GEMINI_MODEL || GEMINI_MODEL;
    return [...new Set([primary, ...list])];
  }

  async function askGeminiViaWorker(body) {
    const models = geminiModelsToTry();
    let lastErr;
    for (const model of models) {
      try {
        const payload = { ...body, _model: model };
        return extractGeminiText(await fetchGeminiJson(WORKER_URL, payload));
      } catch (e) {
        lastErr = e;
        if (e.code !== 429 && e.code !== 503) throw e;
      }
    }
    throw lastErr || new Error("Servicio de IA no disponible");
  }

  async function askGeminiDirect(body) {
    const key = (_cfg().GEMINI_KEY || "").trim();
    if (!key) throw new Error("Sin GEMINI_KEY");
    const model = _cfg().GEMINI_MODEL || GEMINI_MODEL;
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      key;
    return extractGeminiText(await fetchGeminiJson(url, body));
  }

  function offlineFallback(userText) {
    const local = checkLocalIntent(userText);
    if (local) return { html: local.reply, chips: local.chips };
    
    const q = normText(userText);
    
    if (q.length < 3) {
      return {
        html: "¡Ey, mijo! ¡No seas tímido! Pregúntame algo sobre Armenia — ¿qué visitar, dónde comer, cómo llegar? ☕",
        chips: CHIPS_INICIO,
      };
    }
    
    const respuestasFallback = [
    "¡Ay, mijo! La IA se fue a tomar un tinto calentito — pero Don Chucho está aquí para ayudarte! ☕ ¿Por dónde empezamos? ¿Querés ver sitios turísticos, dónde comer o conocer las pautas? ¡Toque un botón!",
    "¡Ey, paisano! La IA está descansando un poquito, pero yo soy tu arriero digital! 😊 Vamos a explorar Armenia juntos — ¿qué te apetece? ¿Visitar, comer o comprar? ¡Toca los chips!",
    "¡Listo para guiarte por la Ciudad Milagro! La IA está fuera un rato, pero Don Chucho no se va a ningún lado. ☕ ¿Por dónde empezamos? ¡Elige una opción de abajo!",
    "¡Ay, qué chévere! Aunque la IA está descansando, yo te ayudo a descubrir lo mejor de Armenia. ¿Querés ver parques, restaurantes o tiendas? ¡Toque un botón y vamos!",
    "¡Ey, mijo! La IA se tomó un descanso para tomar café, pero yo estoy aquí para vos. Vamos a explorar el mapa — ¿qué querés hacer primero? ☕",
  ];
    
    let chipsSugeridos = [...CHIPS_INICIO];
    if (/comer|comida|hambre|almorzar|cenar/.test(q)) {
      chipsSugeridos = ["¿Dónde comer?", "¿Qué visitar?", "Pautas del mapa", "¿Dónde comprar?"];
    } else if (/visitar|turismo|lugares|ver|parque/.test(q)) {
      chipsSugeridos = ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"];
    } else if (/comprar|tiendas|compras|shopping/.test(q)) {
      chipsSugeridos = ["¿Dónde comprar?", "¿Dónde comer?", "¿Qué visitar?"];
    }
    
    return {
      html: aleatorio(respuestasFallback),
      chips: chipsSugeridos,
    };
  }

  async function askGemini(userText) {
    const local = checkLocalIntent(userText);
    if (local) {
      return { text: null, fallback: { html: local.reply, chips: local.chips || [] } };
    }

    _history.push({ role: "user", parts: [{ text: buildVisitorContext(userText) }] });
    const body = buildGeminiBody();
    const hasKey = Boolean((_cfg().GEMINI_KEY || "").trim());
    const preferDirect = hasKey && _cfg().PREFER_DIRECT !== false;
    let text = "";
    const errors = [];

    const tryDirect = () => askGeminiDirect(body);
    const tryWorker = () => askGeminiViaWorker(body);

    try {
      if (preferDirect) {
        try {
          text = await tryDirect();
        } catch (e1) {
          errors.push(e1);
          text = await tryWorker();
        }
      } else {
        try {
          text = await tryWorker();
        } catch (e1) {
          errors.push(e1);
          if (hasKey) text = await tryDirect();
          else throw e1;
        }
      }
    } catch (e2) {
      errors.push(e2);
      console.warn("Don Chucho: sin respuesta de IA", errors);
      _history.pop();
      const fb = offlineFallback(userText);
      return { text: null, fallback: fb };
    }

    if (!text) {
      _history.pop();
      const fb = offlineFallback(userText);
      return { text: null, fallback: fb };
    }

    _history.push({ role: "model", parts: [{ text }] });
    while (_history.length > 8) _history.splice(0, 2);

    return { text, fallback: null };
  }

  function normText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function getCategoryFromText(text) {
    const q = normText(text);
    if (/comer|comida|restaurante|almorzar|cenar|cafe|tinto/.test(q)) return ["gastronomico"];
    if (/comprar|shopping|tienda|comercial|mercado/.test(q)) return ["comercial"];
    if (/visitar|turismo|parque|museo|naturaleza|plan|hacer/.test(q)) return ["turistico"];
    return null;
  }

  function inferCategoriesFromProfile() {
    const cats = [];
    if (_visitorProfile.interests.includes("gastronomia") || _visitorProfile.interests.includes("cafe")) {
      cats.push("gastronomico");
    }
    if (_visitorProfile.interests.includes("compras")) {
      cats.push("comercial");
    }
    if (
      _visitorProfile.interests.includes("cultura") ||
      _visitorProfile.interests.includes("naturaleza") ||
      _visitorProfile.interests.includes("aventura") ||
      _visitorProfile.interests.includes("relax")
    ) {
      cats.push("turistico");
    }
    return uniqueList(cats);
  }

  function resolvePreferredCategories(text) {
    const direct = getCategoryFromText(text);
    if (direct?.length) return direct;
    const profileCats = inferCategoriesFromProfile();
    return profileCats.length ? profileCats : null;
  }

  function detectRouteMode(text) {
    const q = normText(text);
    if (/ruta cafe|ruta de cafe|cafetera|tinto|cafecito/.test(q)) return "cafe";
    if (/ruta familiar|familia|ninos|niños|con mis hijos/.test(q)) return "familiar";
    if (/ruta cultural|cultura|museo|historia|plaza|catedral/.test(q)) return "cultural";
    if (/ruta expres|ruta express|express|expr[eé]s|poco tiempo|rapido|r[aá]pido/.test(q)) return "express";
    if (/ruta compras|compras|shopping|tiendas|centro comercial/.test(q)) return "compras";
    return null;
  }

  function distanceMeters(aLat, aLng, bLat, bLng) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * y;
  }

  function getPoiTags(poi) {
    const text = normText(`${poi.name} ${poi.description} ${poi.address || ""}`);
    const tags = new Set([poi.category]);

    if (/cafe|cafetera|tinto/.test(text)) tags.add("cafe");
    if (/restaurante|comida|gastronom|arepas|empanadas/.test(text)) tags.add("gastronomia");
    if (/parque|sendero|lago|cascada|jardin|jardin|verde|aire libre/.test(text)) tags.add("naturaleza");
    if (/museo|histor|catedral|monumento|cultural|plaza|gobernacion/.test(text)) tags.add("cultura");
    if (/tienda|comercial|marcas|shopping|casino|locales/.test(text)) tags.add("compras");
    if (/tour|ecoturismo|aventura/.test(text)) tags.add("aventura");
    if (/parque infantil|familia|familiar/.test(text)) tags.add("familia");

    if (poi.category === "turistico") {
      tags.add("cultura");
      tags.add("naturaleza");
    }
    if (poi.category === "gastronomico") {
      tags.add("gastronomia");
    }
    if (poi.category === "comercial") {
      tags.add("compras");
    }

    return tags;
  }

  function scorePoiForProfile(poi, requestedCategories) {
    let score = 0;
    const tags = getPoiTags(poi);

    if (requestedCategories?.includes(poi.category)) score += 30;

    _visitorProfile.interests.forEach((interest) => {
      if (tags.has(interest)) score += 22;
      if (interest === "relax" && tags.has("naturaleza")) score += 10;
      if (interest === "cafe" && poi.category === "gastronomico") score += 8;
    });

    if (_visitorProfile.companions === "familia" && (tags.has("familia") || tags.has("naturaleza"))) score += 16;
    if (_visitorProfile.companions === "pareja" && (tags.has("cafe") || tags.has("naturaleza") || tags.has("cultura"))) score += 12;
    if (_visitorProfile.companions === "amigos" && (tags.has("compras") || tags.has("gastronomia") || tags.has("aventura"))) score += 10;
    if (_visitorProfile.companions === "solo" && (tags.has("cultura") || tags.has("cafe"))) score += 8;

    if (_visitorProfile.budget === "economico" && poi.category !== "comercial") score += 6;
    if (_visitorProfile.budget === "premium" && (poi.id === "anatolia" || poi.id === "portal-quindio" || poi.id === "unicentro")) score += 10;

    return score;
  }

  function scorePoiForRouteMode(tags, poi, mode) {
    if (!mode) return 0;

    if (mode === "cafe") {
      return (tags.has("cafe") ? 28 : 0) + (poi.category === "gastronomico" ? 10 : 0);
    }
    if (mode === "familiar") {
      return (tags.has("familia") ? 18 : 0) + (tags.has("naturaleza") ? 12 : 0);
    }
    if (mode === "cultural") {
      return (tags.has("cultura") ? 26 : 0) + (poi.category === "turistico" ? 8 : 0);
    }
    if (mode === "express") {
      return 12;
    }
    if (mode === "compras") {
      return (tags.has("compras") ? 28 : 0) + (poi.category === "comercial" ? 10 : 0);
    }

    return 0;
  }

  function planSmartRoute(text, mode = null) {
    const location = getVisitorLocation();
    if (!location) return [];

    const routeMode = mode || detectRouteMode(text);
    const requestedCategories =
      routeMode === "cafe" ? ["gastronomico"] :
      routeMode === "familiar" ? ["turistico", "gastronomico"] :
      routeMode === "cultural" ? ["turistico"] :
      routeMode === "express" ? resolvePreferredCategories(text) :
      routeMode === "compras" ? ["comercial", "gastronomico"] :
      resolvePreferredCategories(text);

    const candidates = _pois
      .filter((poi) => !requestedCategories || requestedCategories.includes(poi.category))
      .map((poi) => {
        const tags = getPoiTags(poi);
        return {
          poi,
          score: scorePoiForProfile(poi, requestedCategories) + scorePoiForRouteMode(tags, poi, routeMode),
          baseDistance: distanceMeters(location.latitude, location.longitude, poi.lat, poi.lng),
        };
      })
      .sort((a, b) => (b.score - a.score) || (a.baseDistance - b.baseDistance))
      .slice(0, 7);

    const maxStops =
      routeMode === "express" ? 2 :
      _visitorProfile.duration === "corta" ? 2 :
      _visitorProfile.duration === "larga" ? 4 : 3;

    const route = [];
    let currentLat = location.latitude;
    let currentLng = location.longitude;
    const remaining = candidates.slice();

    while (remaining.length && route.length < maxStops) {
      let bestIndex = 0;
      let bestValue = -Infinity;

      remaining.forEach((candidate, index) => {
        const leg = distanceMeters(currentLat, currentLng, candidate.poi.lat, candidate.poi.lng);
        const value = candidate.score - leg / 180;
        if (value > bestValue) {
          bestValue = value;
          bestIndex = index;
        }
      });

      const picked = remaining.splice(bestIndex, 1)[0];
      const legDistance = distanceMeters(currentLat, currentLng, picked.poi.lat, picked.poi.lng);
      route.push({ ...picked, legDistance });
      currentLat = picked.poi.lat;
      currentLng = picked.poi.lng;
    }

    return route;
  }

  function buildRouteProfileText() {
    const parts = buildProfileSummary();
    if (!parts.length) return "";
    return `<br><br><em>Perfil detectado:</em> ${parts.join(" · ")}.`;
  }

  function buildSmartRouteHtml(route, mode = null) {
    const api = getMapApi();
    const formatDistance = api?.formatDistance || ((meters) => `${Math.round(meters)} m`);
    const buildDirectionsUrl = api?.buildPoiDirectionsUrl || (() => "");
    const modeConfig = mode ? ROUTE_MODES[mode] : null;

    if (!route.length) {
      return "Todavía no logré armar una ruta personalizada, mijo. Compárteme tu ubicación o dime si prefieres café, cultura, compras o naturaleza. ☕";
    }

    const steps = route
      .map((item, index) => {
        const url = buildDirectionsUrl(item.poi.id, getVisitorLocation());
        const llegar = url
          ? ` · <a href="${url}" target="_blank" rel="noopener" class="cafeto-poi-link">Cómo llegar</a>`
          : "";
        return `${index + 1}. <button class="cafeto-poi-link" data-poi-id="${item.poi.id}">${item.poi.name}</button> · tramo ${formatDistance(item.legDistance)}${llegar}`;
      })
      .join("<br>");

    const title = modeConfig ? modeConfig.label : "ruta inteligente";
    return `¡Eso es, mijo! Te armé una <strong>${title.toLowerCase()}</strong> con base en tu ubicación y tu perfil de viaje.${buildRouteProfileText()}<br><br>${steps}<br><br>Además, ya te la dejé marcada en el mapa para seguirla mejor. ☕`;
  }

  function buildProfileAcknowledgement() {
    const parts = buildProfileSummary();
    if (!parts.length) return null;
    return {
      html:
        `¡Listo, mijo! Ya entendí mejor tu estilo de viaje.<br><br>` +
        `<strong>Lo tendré en cuenta:</strong> ${parts.join(" · ")}.<br><br>` +
        `Ahora sí puedo recomendarte lugares más a tu medida o armarte una ruta personalizada. ☕`,
      chips: ["Qué hay cerca?", "Armar ruta", "¿Qué visitar?"],
    };
  }

  function shouldReplyWithProfileOnly(text, patch) {
    if (!hasVisitorSignals(patch)) return false;
    const q = normText(text);
    return !(
      /ruta|cerca|ubicacion|ubicación|visitar|comer|comprar|hola|buenas|quien eres|como te llamas|gracias|adios|chao|pauta|anatolia|quindio travel|diana/.test(q)
    );
  }

  function buildNearbyHtml(items, title, intro) {
    const api = getMapApi();
    const formatDistance = api?.formatDistance || ((meters) => `${Math.round(meters)} m`);
    const buildDirectionsUrl = api?.buildPoiDirectionsUrl || (() => "");

    if (!items.length) {
      return `${intro}<br><br>No encontré lugares cercanos en esa categoría por ahora. Pruebe con otra búsqueda o explore el mapa. ☕`;
    }

    const lista = items
      .map((poi) => {
        const rutaUrl = buildDirectionsUrl(poi.id, getVisitorLocation());
        const llegar = rutaUrl
          ? ` · <a href="${rutaUrl}" target="_blank" rel="noopener" class="cafeto-poi-link">Cómo llegar</a>`
          : "";
        return `• <button class="cafeto-poi-link" data-poi-id="${poi.id}">${poi.name}</button> · a ${formatDistance(poi.distanceMeters)}${llegar}`;
      })
      .join("<br>");

    return `${intro}<br><br><strong>${title}</strong><br><br>${lista}<br><br>Puede tocar el nombre para verlo en el mapa. ☕`;
  }

  async function handleGeoIntent(text) {
    const q = normText(text);
    const wantsNearby =
      /usar mi ubicacion|usar mi ubicacion actual|que hay cerca|que tengo cerca|cerca de mi|cerca mio|alrededor de mi|alrededor mio|por aqui|por aca|sitios cerca|lugares cerca/.test(q);
    const wantsRoute =
      /armar ruta|crear ruta|ruta|recorrido|itinerario|plan de ruta|ruta personalizada|ruta desde aqui|ruta desde aqui/.test(q);
    const wantsLocationStatus =
      /donde estoy|donde estoy ubicado|mi ubicacion|mi ubicacion actual/.test(q);

    if (!wantsNearby && !wantsRoute && !wantsLocationStatus) return null;

    const api = getMapApi();
    if (!api?.ensureUserLocation || !api?.getNearestPois) {
      return {
        html: "Todavía no tengo conexión con la ubicación del mapa, mijo. En cuanto esté activa, te recomendaré sitios cercanos y rutas personalizadas. ☕",
        chips: ["¿Qué visitar?", "¿Dónde comer?", "¿Dónde comprar?"],
      };
    }

    try {
      const location = await api.ensureUserLocation({ center: true });
      const categories = resolvePreferredCategories(text);

      if (wantsLocationStatus) {
        return {
          html:
            `Ya tomé tu ubicación actual, mijo.<br><br>` +
            `📍 Lat: ${location.latitude.toFixed(5)}<br>` +
            `📍 Lng: ${location.longitude.toFixed(5)}<br><br>` +
            `Con esto ya puedo recomendarte sitios cercanos y armarte rutas personalizadas. ☕`,
          chips: ["Qué hay cerca?", "Armar ruta", "¿Dónde comer?"],
        };
      }

      if (wantsRoute) {
        const routeMode = detectRouteMode(text);
        const route = planSmartRoute(text, routeMode);
        if (route.length) {
          api?.drawSuggestedRoute?.(route, routeMode ? ROUTE_MODES[routeMode] : { label: "Ruta inteligente", color: "#198754" });
        }
        return {
          html: buildSmartRouteHtml(route, routeMode),
          chips: route.length
            ? (routeMode ? ROUTE_MODES[routeMode].chips : route.map((item) => item.poi.name).slice(0, 3))
            : ["¿Qué visitar?", "¿Dónde comer?"],
        };
      }

      const nearby = api.getNearestPois(4, categories);
      return {
        html: buildNearbyHtml(
          nearby,
          "Servicios y lugares cerca de ti",
          "¡Listo, mijo! Con tu ubicación real ya puedo recomendarte opciones mucho más personalizadas."
        ),
        chips: nearby.length
          ? nearby.map((poi) => poi.name).slice(0, 3)
          : ["¿Qué visitar?", "¿Dónde comer?"],
      };
    } catch (err) {
      return {
        html:
          "Para darte recomendaciones cercanas y rutas en tiempo real necesito permiso de ubicación. Toca `Mi ubicación` o acepta el permiso del navegador y te guío mejor. ☕",
        chips: ["Qué hay cerca?", "Armar ruta", "¿Cómo llegar?"],
      };
    }
  }

  const CHIP_REPLIES = {
    "que visitar?": () => ({ reply: buildPoiList("turistico"), chips: ["Plaza de Bolívar", "¿Dónde comer?", "Pautas del mapa"] }),
    "donde comer?": () => ({ reply: buildPoiList("gastronomico"), chips: ["Anatolia", "¿Qué visitar?", "Pautas del mapa"] }),
    "donde comprar?": () => ({ reply: buildPoiList("comercial"), chips: ["Portal del Quindío", "¿Dónde comer?"] }),
    "pautas del mapa": () => ({ reply: buildPautasList(), chips: ["Anatolia", "Diana Seguros", "Quindío Travel"] }),
    "como llegar?": () => ({
      reply:
        "Para llegar a <strong>Armenia</strong>, mijo:<br><br>" +
        "✈️ <strong>Aeropuerto El Edén</strong> (AXM) ~20 min del centro.<br>" +
        "🚌 Buses desde Pereira, Bogotá y Medellín.<br>" +
        "🚗 Vía Panamericana / Eje Cafetero.<br><br>¿Le muestro sitios o restaurantes? ☕",
      chips: CHIPS_INICIO,
    }),
    "que hay cerca?": () => null,
    "armar ruta": () => null,
    "ruta cafe": () => null,
    "ruta familiar": () => null,
    "ruta cultural": () => null,
    "ruta expres": () => null,
  };

  /* ─── Intents locales (respuesta inmediata con botones del mapa) ── */
  const LOCAL_INTENTS = [
    {
      keys: ["visitar", "turismo", "turístico", "turistico", "atractivo", "sitio turístico", "lugares", "que ver", "qué ver", "recomendar", "recomiendas", "me gusta", "me gustaria", "me gustaría", "quiero ver", "ver sitios", "ver lugares", "que hay pa hacer", "qué hay para hacer", "qué hacer", "que hacer", "que hacer en armenia", "qué hacer en armenia", "actividades", "que actividades", "qué actividades", "entretenimiento", "divertirse", "divertirme", "pasar el rato", "pasar el dia", "pasar el día", "sitios emblemáticos", "sitios emblematicos", "lugares turísticos", "lugares turisticos", "turísticos", "turisticos", "qué me recomiendas", "que me recomiendas", "qué recomendaciones", "que recomendaciones"],
      reply: () => buildPoiList("turistico"),
      chips: ["Plaza de Bolívar", "Museo del Oro", "Parque de la Vida", "¿Dónde comer?"],
    },
    {
      keys: ["comer", "gastronomía", "gastronomia", "restaurante", "comida", "almorzar", "cenar", "donde comer", "dónde comer", "comer bien", "comida típica", "comida tipica", "restaurantes", "hambre", "tengo hambre", "donde almorzar", "dónde almorzar", "donde cenar", "dónde cenar", "comer rico", "donde hay comida", "dónde hay comida", "sitios para comer", "lugares para comer", "comidas típicas", "comidas tipicas", "gastronomia local", "gastronomía local"],
      reply: () => buildPoiList("gastronomico"),
      chips: ["Anatolia", "Sol de Café", "¿Dónde comprar?", "¿Qué visitar?"],
    },
    {
      keys: ["comprar", "comercial", "centro comercial", "shopping", "tiendas", "donde comprar", "dónde comprar", "compras", "mercado", "ir de compras", "de compras", "comprar algo", "que comprar", "qué comprar"],
      reply: () => buildPoiList("comercial"),
      chips: ["Portal del Quindío", "Unicentro", "¿Dónde comer?"],
    },
    {
      keys: ["pauta", "pautas", "anunciante", "patrocinador", "patrocinio", "publicidad", "sponsor"],
      reply: () => buildPautasList(),
      chips: ["Anatolia", "Diana Seguros", "Quindío Travel"],
    },
    {
      keys: ["anatolia"],
      reply: () => buildPautaDetalle("anatolia"),
      chips: ["¿Dónde comer?", "Quindío Travel"],
    },
    {
      keys: ["diana seguros", "diana_seguros", "diana"],
      reply: () => buildPautaDetalle("diana_seguros"),
      chips: ["Anatolia", "Quindío Travel"],
    },
    {
      keys: ["quindío travel", "quindio travel", "quindio"],
      reply: () => buildPautaDetalle("quindio_travel"),
      chips: ["Anatolia", "¿Qué visitar?"],
    },
    {
      keys: ["llegar", "llegada", "como llegar", "cómo llegar", "transporte", "aeropuerto", "bus", "terminal", "taxi", "cómo ir", "como ir", "ir a armenia", "llegar a armenia", "venir a armenia"],
      reply: () =>
        "Para llegar a <strong>Armenia</strong>, mijo:<br><br>" +
        "✈️ <strong>Aeropuerto El Edén</strong> (AXM) está a ~20 min del centro.<br>" +
        "🚌 Desde Pereira, Bogotá o Medellín hay buses frecuentes al terminal de Armenia.<br>" +
        "🚗 Por carretera: vía Panamericana y conexión con el Eje Cafetero.<br><br>" +
        "¿Quiere ver sitios turísticos o dónde comer cuando llegue? ☕",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "ey", "hello", "qué tal", "que tal", "cómo estás", "como estas", "holi", "buen día", "buen dia", "qué onda", "que onda", "qué hubo", "que hubo"],
      reply: () => aleatorio(SALUDOS),
      chips: CHIPS_INICIO,
    },
    {
      keys: ["café", "cafe", "tinto", "cafetera", "finca cafetera", "finca de café", "café quindío", "cafe quindio", "café armenia", "tomar café", "tomar un tinto", "un tinto", "cafecito", "cafecito"],
      reply: () =>
        "¡El café es la identidad del Quindío, mijo! ☕<br><br>" +
        "Le recomiendo visitar fincas cafeteras alrededor de Armenia, probar un tinto en el centro o conocer el <strong>Parque Nacional del Café</strong>.<br><br>" +
        "Use los chips para ver lugares en el mapa. ¿Qué más le cuento?",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["clima", "tiempo", "lluvia", "sol", "nublado", "temperatura", "qué clima", "que clima", "hace frío", "hace calor", "va a llover", "qué tiempo", "que tiempo", "como está el clima", "cómo está el clima", "que tiempo hace", "qué tiempo hace"],
      reply: () =>
        "En Armenia el clima es <strong>templado perfecto</strong>, entre 18 y 22 °C todo el año. ☀️<br><br>" +
        "Lleve chaqueta ligera para las noches y paraguas por si llueve — ¡es el Eje Cafetero!<br><br>" +
        "¿Quiere ver sitios para disfrutar este clima? ☕",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["armenia", "quindio", "quindío", "eje cafetero", "ciudad milagro", "ciudad milagro", "qué es armenia", "que es armenia", "info armenia", "informacion armenia", "información armenia", "de que se trata", "de qué se trata", "cuéntame", "cuentame", "háblame", "hablame de armenia"],
      reply: () =>
        "<strong>Armenia</strong> es la capital del Quindío, conocida como <em>La Ciudad Milagro</em>. 🌆<br><br>" +
        "Fundada en 1889, corazón del Eje Cafetero (Patrimonio UNESCO), famosa por el café, la arquitectura de bahareque y la amabilidad de su gente.<br><br>" +
        "Use los chips para explorar el mapa — ¡hay mucho que ver! ☕",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["gracias", "muchas gracias", "vale", "ok", "bueno", "perfecto", "excelente", "genial", "chévere", "chevere", "bacano", "muy bien", "super", "muy buena", "muy buena", "listo", "de acuerdo", "deacuerdo"],
      reply: () =>
        "¡De nada, mijo! ¡Es un placer ayudarte a explorar Armenia y el Quindío! ☕<br><br>" +
        "Si necesitas algo más, ¡solo pregúntame! ¿Qué más quieres saber?",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["parque", "parques", "jardín", "jardin", "naturaleza", "aire libre", "pasear", "caminar", "dar una vuelta", "dar una caminata", "salir a caminar", "salir a pasear", "ver naturaleza"],
      reply: () => {
        const items = _pois.filter((p) => p.category === "turistico");
        const parques = items.filter((p) => 
          p.name.toLowerCase().includes("parque") || 
          p.name.toLowerCase().includes("jardín") || 
          p.name.toLowerCase().includes("jardin")
        );
        if (parques.length) {
          const lista = parques
            .map((p) => `• <button class="cafeto-poi-link" data-poi-id="${p.id}">${p.name}</button>`)
            .join("<br>");
          return `Aquí los <strong>parques y espacios naturales</strong> del mapa:<br><br>${lista}<br><br>Haga clic en el nombre para verlo en el mapa. ☕`;
        }
        return buildPoiList("turistico");
      },
      chips: ["Parque de la Vida", "Jardín Botánico", "¿Qué visitar?", "¿Dónde comer?"],
    },
    {
      keys: ["hotel", "hoteles", "hostal", "hostales", "alojamiento", "dónde dormir", "donde dormir", "dormir", "hospedaje", "alojarse", "donde alojarse", "dónde alojarse", "hotel barato", "hostal barato", "hotel economico", "hotel económico"],
      reply: () =>
        "Para alojamiento en Armenia, mijo:<br><br>" +
        "Hay opciones para todos los presupuestos: hoteles en el centro, hostales y fincas cafeteras con hospedaje.<br><br>" +
        "Use los chips para explorar el mapa — muchos lugares están cerca de opciones de alojamiento. ☕",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["no", "nada", "nada más", "nada mas", "no gracias", "no, gracias", "por ahora no", "por el momento no", "no quiero", "no quiero nada"],
      reply: () =>
        "¡Perfecto, mijo! Si después necesitas algo, ¡aquí estoy! 😊<br><br>Siempre puedes abrir el chat y preguntarme de nuevo. ¡Disfruta Armenia! ☕",
      chips: [],
    },
    {
      keys: ["ayuda", "ayúdame", "ayudame", "qué puedo hacer", "que puedo hacer", "cómo te uso", "como te uso", "qué hago", "que hago", "instrucciones", "cómo funciona", "como funciona"],
      reply: () =>
        "¡Claro que sí, mijo! Don Chucho te ayuda así:<br><br>" +
        "🔍 <strong>Pregunta</strong> por lugares, comida, compras o cómo llegar<br>" +
        "👆 <strong>Toca</strong> los chips para respuestas rápidas<br>" +
        "🗺️ <strong>Ver en el mapa</strong>: los botones te llevan al punto<br><br>" +
        "¿Por dónde empezamos? ☕",
      chips: CHIPS_INICIO,
    },
    {
      keys: ["cómo estás", "como estas", "cómo te va", "como te va", "qué tal", "que tal", "qué tal tu día", "que tal tu día", "cómo te sientes", "como te sientes"],
      reply: () => aleatorio([
        "¡Ay, mijo! Estoy de maravilla, listo para guiarte por Armenia y el Quindío! ☕ ¿Y vos? ¿Listo para explorar?",
        "¡Muy bien, gracias por preguntar! Con este clima templado y un tinto calentito, no se puede pedir más. ¿Y vos? ¿Qué querés hacer hoy?",
        "¡Excelente, paisano! Contento de tenerte aquí. ¿Listo para descubrir lo mejor de la Ciudad Milagro? ☕",
      ]),
      chips: CHIPS_INICIO,
    },
    {
      keys: ["quién eres", "quien eres", "qué eres", "que eres", "quien es don chucho", "quién es don chucho", "presentate", "presentarte", "cómo te llamas", "como te llamas", "cual es tu nombre", "cuál es tu nombre", "tu nombre", "tu nombre es"],
      reply: () =>
        "¡Ay, qué buena pregunta! Yo soy <strong>Don Chucho</strong>, tu arriero quindiano con poncho y carriel. 🧢<br><br>" +
        "Soy el guía turístico virtual del Mapa Digital de Armenia 2026. Conozco la región cafetera como la palma de mi mano — el café, las tradiciones, los mejores sitios para visitar, comer y comprar.<br><br>" +
        "¿Listo para explorar juntos? ☕",
      chips: CHIPS_INICIO,
    },
    {
      keys: ["te quiero", "te amo", "eres genial", "eres bacano", "eres chévere", "me gustas", "tu eres genial", "tú eres genial", "buen trabajo", "muy bien"],
      reply: () => aleatorio([
        "¡Ay, mijo! ¡Qué lindo! Me hace muy feliz poder ayudarte. ¡Gracias por tus palabras! ☕ ¿Qué más quieres saber?",
        "¡Ey, qué chévere! Me alegra que te guste. Don Chucho siempre a la orden. ¿Por dónde seguimos?",
        "¡Muchas gracias, paisano! Eso me motiva mucho para seguir guiarte por Armenia. ¿Qué hacemos ahora? ☕",
      ]),
      chips: CHIPS_INICIO,
    },
    {
      keys: ["adiós", "adios", "chao", "hasta luego", "hasta pronto", "nos vemos", "me voy", "ya me voy"],
      reply: () => aleatorio([
        "¡Hasta luego, mijo! ¡Que tengas un día bacano en Armenia y el Quindío! Si necesitas algo más, ¡ya sabes dónde encontrarme! ☕",
        "¡Chao, paisano! ¡Disfruta mucho la Ciudad Milagro! Siempre puedes volver y preguntarme lo que quieras. ¡Hasta pronto!",
        "¡Nos vemos! ¡Que tengas una aventura chévere! Don Chucho estará aquí cuando necesites. ☕",
      ]),
      chips: [],
    },
    {
      keys: ["buenos dias", "buenos días", "buenas tardes", "buenas noches"],
      reply: (text) => {
        const q = normText(text);
        if (q.includes("buenos dias") || q.includes("buenos días")) {
          return aleatorio([
            "¡Buenos días, mijo! ¡Qué linda mañana para explorar Armenia! ☕ ¿Por dónde empezamos?",
            "¡Buen día! Con este sol y un tinto calentito, no hay mejor momento para conocer la Ciudad Milagro. ¿Qué te apetece?",
          ]);
        } else if (q.includes("buenas tardes")) {
          return aleatorio([
            "¡Buenas tardes, paisano! Listo para descubrir lo mejor de Armenia en esta tarde? ☕ ¿Qué hacemos?",
            "¡Buenas tardes! Perfecto para ir a conocer un parque, tomar un café o explorar el centro. ¿Por dónde empezamos?",
          ]);
        } else {
          return aleatorio([
            "¡Buenas noches, mijo! Aunque sea de noche, Don Chucho está aquí para ayudarte. ¿Listo para planificar tu día de mañana? ☕",
            "¡Buenas noches! Siempre es buen momento para explorar el mapa y planificar tu aventura por Armenia. ¿Qué querés saber?",
          ]);
        }
      },
      chips: CHIPS_INICIO,
      needsText: true,
    },
  ];

  function checkLocalIntent(text) {
    const q = normText(text);
    const chipFn = CHIP_REPLIES[q];
    if (chipFn) return chipFn();

    for (const intent of LOCAL_INTENTS) {
      if (intent.keys.some((k) => {
        const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return q.includes(kn);
      })) {
        const replyText = intent.needsText ? intent.reply(text) : intent.reply();
        return { reply: replyText, chips: intent.chips || [] };
      }
    }
    return null;
  }

  /* ─── Builders de respuesta local ───────────────────────── */
  function aleatorio(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function buildPoiList(category) {
    const labels = { turistico: "turísticos", comercial: "comerciales", gastronomico: "gastronómicos" };
    const items = _pois.filter((p) => p.category === category);
    if (!items.length) return "No encontré lugares en esa categoría por ahora.";
    const lista = items
      .map((p) => `• <button class="cafeto-poi-link" data-poi-id="${p.id}">${p.name}</button>`)
      .join("<br>");
    return `Aquí los lugares <strong>${labels[category]}</strong> en el mapa:<br><br>${lista}<br><br>Haga clic en el nombre para verlo en el mapa. ☕`;
  }

  function buildPautasList() {
    if (!_pautas.length) return "No hay pautas registradas por ahora.";
    const lista = _pautas
      .map((p) => `• <button class="cafeto-poi-link" data-poi-id="${p.poiId}">${p.nombre}</button> — ${p.slogan || ""}`)
      .join("<br>");
    return `Estos son nuestros <strong>anunciantes</strong> en el mapa:<br><br>${lista}<br><br>Haga clic para ver su ubicación.`;
  }

  function buildPautaDetalle(id) {
    const p = _pautas.find((x) => x.id === id);
    if (!p) return "No encontré esa pauta, mijo.";
    let html = `<strong>${p.nombre}</strong><br><em>${p.slogan || ""}</em>`;
    if (p.ficha?.descripcion) html += `<br><br>${p.ficha.descripcion}`;
    if (p.direccion) html += `<br><br>📍 ${p.direccion}`;
    if (p.horario)   html += `<br>🕐 ${p.horario}`;
    if (p.telefono)  html += `<br>📞 ${p.telefono}`;
    if (p.whatsapp) {
      const num = p.whatsapp.replace(/\D/g, "");
      const msg = encodeURIComponent(p.whatsappMensaje || `Hola, vi ${p.nombre} en el Mapa Armenia 2026.`);
      html += `<br><br><a href="https://wa.me/${num}?text=${msg}" target="_blank" rel="noopener" class="cafeto-poi-link">💬 Escribir por WhatsApp</a>`;
    }
    html += `<br><button class="cafeto-poi-link" data-poi-id="${p.poiId}">Ver en el mapa →</button>`;
    return html;
  }

  /* ─── DOM helpers ────────────────────────────────────────── */
  function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Convierte saltos de línea y **negrita** básica del texto de Gemini a HTML
  function formatGeminiText(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function scrollBottom(el) { el.scrollTop = el.scrollHeight; }

  /* ─── Widget HTML ────────────────────────────────────────── */
  function buildWidget() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cafeto-btn";
    btn.setAttribute("aria-label", "Abrir asistente Don Chucho — Guía turístico de Armenia");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `
      <div class="cafeto-btn-figure" aria-hidden="true">
        <img src="avatar_chucho/don-chucho-bust.png" alt="" />
      </div>
      <div class="cafeto-btn-card">
        <span class="cafeto-btn-name">Don Chucho</span>
        <span class="cafeto-btn-role">☕ Guía turístico · Armenia</span>
        <span class="cafeto-btn-cta">¡Pregúntame algo!</span>
        <span class="cafeto-btn-badge" aria-hidden="true"></span>
      </div>
    `;

    const win = document.createElement("div");
    win.className = "cafeto-window";
    win.setAttribute("hidden", "");
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-modal", "false");
    win.setAttribute("aria-label", "Don Chucho — Asistente turístico");
    win.innerHTML = `
      <div class="cafeto-header">
        <div class="cafeto-header-avatar" aria-hidden="true">${AVATAR_SVG}</div>
        <div class="cafeto-header-info">
          <p class="cafeto-header-name">Don Chucho</p>
          <p class="cafeto-header-role">Arriero quindiano · Guía turístico</p>
          <p class="cafeto-header-status">En línea · Armenia 2026</p>
        </div>
        <button type="button" class="cafeto-close-btn" aria-label="Cerrar asistente">✕</button>
      </div>
      <div class="cafeto-messages" id="dc-messages" aria-live="polite" aria-atomic="false"></div>
      <form class="cafeto-input-area" id="dc-form">
        <input type="text" class="cafeto-input" id="dc-input"
          placeholder="Pregúntele a Don Chucho…"
          autocomplete="off" maxlength="300"
          enterkeyhint="send"
          aria-label="Mensaje para Don Chucho" />
        <button type="submit" class="cafeto-send-btn" id="dc-send" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(win);
    return { btn, win };
  }

  /* ─── Mensajes ───────────────────────────────────────────── */
  function addMessage(container, role, html, chips) {
    const wrap = document.createElement("div");
    wrap.className = `cafeto-msg cafeto-msg--${role}`;

    if (role === "bot") {
      wrap.innerHTML = `
        <div class="cafeto-msg-avatar" aria-hidden="true">${AVATAR_SVG}</div>
        <div class="cafeto-msg-bubble">${html}</div>
      `;
    } else {
      wrap.innerHTML = `<div class="cafeto-msg-bubble">${escHtml(html)}</div>`;
    }

    container.appendChild(wrap);

    if (chips && chips.length) {
      const chipsWrap = document.createElement("div");
      chipsWrap.className = "cafeto-chips";
      chips.forEach((label) => {
        const c = document.createElement("button");
        c.type = "button";
        c.className = "cafeto-chip";
        c.textContent = label;
        chipsWrap.appendChild(c);
      });
      wrap.querySelector(".cafeto-msg-bubble")?.appendChild(chipsWrap);
    }

    requestAnimationFrame(() => scrollBottom(container));
    return wrap;
  }

  function showTyping(container) {
    const wrap = document.createElement("div");
    wrap.className = "cafeto-msg cafeto-msg--bot cafeto-typing-wrap";
    wrap.innerHTML = `
      <div class="cafeto-msg-avatar" aria-hidden="true">${AVATAR_SVG}</div>
      <div class="cafeto-msg-bubble">
        <div class="cafeto-typing" aria-label="Don Chucho está escribiendo">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container.appendChild(wrap);
    scrollBottom(container);
    return wrap;
  }

  /* ─── Bind de eventos en mensaje del bot ────────────────── */
  function bindMsgEvents(msgEl, closeChat) {
    msgEl.querySelectorAll(".cafeto-poi-link[data-poi-id]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof focusPoi === "function") { focusPoi(link.dataset.poiId); closeChat(); }
      });
    });
  }

  /* ─── Lógica principal ───────────────────────────────────── */
  function initDonChucho() {
    const { btn, win } = buildWidget();
    const messages = win.querySelector("#dc-messages");
    const input    = win.querySelector("#dc-input");
    const sendBtn  = win.querySelector("#dc-send");
    const form     = win.querySelector("#dc-form");
    const closeBtn = win.querySelector(".cafeto-close-btn");

    let isOpen  = false;
    let greeted = false;
    let busy    = false; // evita doble envío mientras espera Gemini

    /* ── Abrir / cerrar ── */
    function openChat() {
      isOpen = true;
      win.removeAttribute("hidden");
      win.classList.add("cafeto-opening", "cafeto-window--open");
      btn.classList.add("cafeto-btn--hidden");
      document.body.classList.add("cafeto-chat-open");
      btn.setAttribute("aria-expanded", "true");
      const badge = btn.querySelector(".cafeto-btn-badge");
      if (badge) badge.style.display = "none";
      setTimeout(() => {
        win.classList.remove("cafeto-opening");
        layoutMobileChat();
      }, 350);
      requestAnimationFrame(layoutMobileChat);
      input.focus({ preventScroll: true });
      if (!greeted) {
        greeted = true;
        setTimeout(() => addMessage(messages, "bot", aleatorio(SALUDOS), CHIPS_INICIO), 300);
      }
    }

    function isMobileChat() {
      return window.matchMedia("(max-width: 768px)").matches;
    }

    function resetMobileLayout() {
      win.style.top = "";
      win.style.left = "";
      win.style.right = "";
      win.style.width = "";
      win.style.height = "";
      win.style.bottom = "";
    }

    function layoutMobileChat() {
      if (!isOpen || !isMobileChat() || !window.visualViewport) return;
      const vv = window.visualViewport;
      win.style.top = vv.offsetTop + "px";
      win.style.left = "0";
      win.style.right = "0";
      win.style.width = "100%";
      win.style.height = vv.height + "px";
      win.style.bottom = "auto";
      scrollBottom(messages);
    }

    function closeChat() {
      isOpen = false;
      win.setAttribute("hidden", "");
      win.classList.remove("cafeto-window--open");
      btn.classList.remove("cafeto-btn--hidden");
      document.body.classList.remove("cafeto-chat-open");
      resetMobileLayout();
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }

    if (window.visualViewport) {
      const onViewport = () => layoutMobileChat();
      window.visualViewport.addEventListener("resize", onViewport);
      window.visualViewport.addEventListener("scroll", onViewport);
    }

    window.addEventListener("resize", () => {
      if (isOpen) layoutMobileChat();
    });

    btn.addEventListener("click", () => (isOpen ? closeChat() : openChat()));
    closeBtn.addEventListener("click", closeChat);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeChat(); });

    /* ── Enviar mensaje (texto libre → Gemini o local) ── */
    async function sendMessage(text) {
      text = (text || input.value).trim();
      if (!text || busy) return;
      input.value = "";
      busy = true;
      sendBtn.disabled = true;
      input.disabled   = true;

      addMessage(messages, "user", text);
      const typing = showTyping(messages);

      try {
        const profilePatch = extractVisitorSignals(text);
        const profileChanged = mergeVisitorProfile(profilePatch);

        const geoReply = await handleGeoIntent(text);
        if (geoReply) {
          await new Promise((r) => setTimeout(r, 350));
          typing.remove();
          const msgEl = addMessage(messages, "bot", geoReply.html, geoReply.chips);
          bindMsgEvents(msgEl, closeChat);
        } else {
          const profileReply = profileChanged && shouldReplyWithProfileOnly(text, profilePatch)
            ? buildProfileAcknowledgement()
            : null;

          if (profileReply) {
            await new Promise((r) => setTimeout(r, 350));
            typing.remove();
            const msgEl = addMessage(messages, "bot", profileReply.html, profileReply.chips);
            bindMsgEvents(msgEl, closeChat);
          } else {
          // 1. Intentar respuesta local (POIs / pautas con botones del mapa)
            const local = checkLocalIntent(text);
            if (local) {
              await new Promise((r) => setTimeout(r, 500)); // pequena pausa natural
              typing.remove();
              const msgEl = addMessage(messages, "bot", local.reply, local.chips);
              bindMsgEvents(msgEl, closeChat);
            } else {
              const result = await askGemini(text);
              typing.remove();
              if (result.fallback) {
                const msgEl = addMessage(messages, "bot", result.fallback.html, result.fallback.chips);
                bindMsgEvents(msgEl, closeChat);
              } else {
                const html = formatGeminiText(result.text);
                const msgEl = addMessage(messages, "bot", html, CHIPS_INICIO);
                bindMsgEvents(msgEl, closeChat);
              }
            }
          }
        }
        requestAnimationFrame(() => scrollBottom(messages));
      } catch (err) {
        typing.remove();
        console.error("Don Chucho error:", err);
        const fb = offlineFallback(text);
        const msgEl = addMessage(messages, "bot", fb.html, fb.chips);
        bindMsgEvents(msgEl, closeChat);
      } finally {
        busy = false;
        sendBtn.disabled = false;
        input.disabled   = false;
        layoutMobileChat();
        requestAnimationFrame(() => scrollBottom(messages));
      }
    }

    input.addEventListener("focus", () => {
      setTimeout(layoutMobileChat, 350);
    });

    messages.addEventListener("click", (e) => {
      const chip = e.target.closest(".cafeto-chip");
      if (chip) {
        e.preventDefault();
        chip.closest(".cafeto-chips")?.remove();
        sendMessage(chip.textContent);
        return;
      }
      const poiLink = e.target.closest(".cafeto-poi-link[data-poi-id]");
      if (poiLink) {
        e.preventDefault();
        if (typeof focusPoi === "function") { focusPoi(poiLink.dataset.poiId); closeChat(); }
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  /* ─── API pública ────────────────────────────────────────── */
  window.DonChucho = { setPoisData, setPautasData, init: initDonChucho, getVisitorLocation };

})();
