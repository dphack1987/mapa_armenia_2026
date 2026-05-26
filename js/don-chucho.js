/**
 * Don Chucho — Asistente turístico de Armenia 2026
 * Arriero quindiano con sombrero aguadeño
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
    "¡Buenas, parce! Soy Don Chucho, su arriero digital. ¿Qué quiere conocer de Armenia?",
    "¡Bienvenido a la Ciudad Milagro! Soy Don Chucho. ¿Lo llevo a algún rincón del Quindío?",
    "¡Ey, paisano! Don Chucho a sus órdenes. ¿Qué le cuento de Armenia 2026?",
  ];

  const CHIPS_INICIO = [
    "¿Qué visitar?",
    "¿Dónde comer?",
    "¿Dónde comprar?",
    "Pautas del mapa",
    "¿Cómo llegar?",
  ];

  /* ─── Datos del mapa ─────────────────────────────────────── */
  let _pois = [];
  let _pautas = [];

  function setPoisData(pois)   { _pois   = pois   || []; }
  function setPautasData(p)    { _pautas = p      || []; }

  /* ─── System prompt para Gemini ──────────────────────────── */
  function buildSystemPrompt() {
    const poisResumen = _pois.map((p) =>
      `- ${p.name} (${p.category}): ${p.description}${p.address ? " · " + p.address : ""}${p.horario ? " · " + p.horario : ""}`
    ).join("\n");

    const pautasResumen = _pautas.map((p) =>
      `- ${p.nombre}: ${p.ficha?.descripcion || p.slogan || ""}. Tel: ${p.telefono || "N/A"}. Horario: ${p.horario || "N/A"}`
    ).join("\n");

    return `Eres Don Chucho, un arriero quindiano con sombrero aguadeño, personaje típico de la región cafetera de Colombia. Eres el guía turístico virtual del Mapa Digital de Armenia 2026.

PERSONALIDAD:
- Hablas con calidez y humor paisa: usas "parce", "paisano", "bacano", "chévere", "a la orden", "eso es", "pa'" en vez de "para"
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

  async function askGeminiViaWorker(body) {
    return extractGeminiText(await fetchGeminiJson(WORKER_URL, body));
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
    const q = userText.toLowerCase();
    if (/caf[eé]|cafe/.test(q)) {
      return {
        html:
          "Por acá el café es cultura, parce. Le recomiendo visitar fincas en el Quindío y probar el tinto en el centro de Armenia. Use el chip <strong>¿Qué visitar?</strong> para ver lugares en el mapa. ☕",
        chips: CHIPS_INICIO,
      };
    }
    if (/clima|tiempo|lluvia/.test(q)) {
      return {
        html: "En Armenia el clima es templado, entre 18 y 22 °C. Lleve chaqueta ligera y paraguas por si acaso. ☕",
        chips: CHIPS_INICIO,
      };
    }
    return {
      html:
        "Parce, en este momento no tengo conexión con la IA, pero el mapa sí le ayuda. Elija una opción de abajo o pregunte por restaurantes, sitios turísticos o pautas. ☕",
      chips: CHIPS_INICIO,
    };
  }

  async function askGemini(userText) {
    _history.push({ role: "user", parts: [{ text: userText }] });
    const body = buildGeminiBody();
    const preferDirect = _cfg().PREFER_DIRECT !== false && (_cfg().GEMINI_KEY || "").trim();
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
          text = await tryDirect();
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
    while (_history.length > 12) _history.splice(0, 2);

    return { text, fallback: null };
  }

  /* ─── Intents locales (respuesta inmediata con botones del mapa) ── */
  const LOCAL_INTENTS = [
    {
      keys: ["visitar", "turismo", "turístico", "turistico", "atractivo", "sitio turístico"],
      reply: () => buildPoiList("turistico"),
      chips: ["Plaza de Bolívar", "Museo del Oro", "Parque de la Vida", "¿Dónde comer?"],
    },
    {
      keys: ["comer", "gastronomía", "gastronomia", "restaurante", "comida", "almorzar", "cenar"],
      reply: () => buildPoiList("gastronomico"),
      chips: ["Anatolia", "Sol de Café", "¿Dónde comprar?", "¿Qué visitar?"],
    },
    {
      keys: ["comprar", "comercial", "centro comercial", "shopping"],
      reply: () => buildPoiList("comercial"),
      chips: ["Portal del Quindío", "Unicentro", "¿Dónde comer?"],
    },
    {
      keys: ["pauta", "pautas", "anunciante", "patrocinador"],
      reply: () => buildPautasList(),
      chips: ["Anatolia", "Diana Seguros", "Quindío Travel"],
    },
    {
      keys: ["anatolia"],
      reply: () => buildPautaDetalle("anatolia"),
      chips: ["¿Dónde comer?", "Quindío Travel"],
    },
    {
      keys: ["diana seguros", "diana_seguros"],
      reply: () => buildPautaDetalle("diana_seguros"),
      chips: ["Anatolia", "Quindío Travel"],
    },
    {
      keys: ["quindío travel", "quindio travel"],
      reply: () => buildPautaDetalle("quindio_travel"),
      chips: ["Anatolia", "¿Qué visitar?"],
    },
    {
      keys: ["llegar", "llegada", "como llegar", "cómo llegar", "transporte", "aeropuerto", "bus"],
      reply: () =>
        "Para llegar a <strong>Armenia</strong>, parce:<br><br>" +
        "✈️ <strong>Aeropuerto El Edén</strong> (AXM) está a ~20 min del centro.<br>" +
        "🚌 Desde Pereira, Bogotá o Medellín hay buses frecuentes al terminal de Armenia.<br>" +
        "🚗 Por carretera: vía Panamericana y conexión con el Eje Cafetero.<br><br>" +
        "¿Quiere ver sitios turísticos o dónde comer cuando llegue? ☕",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "Pautas del mapa"],
    },
    {
      keys: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "ey", "hello"],
      reply: () => aleatorio(SALUDOS),
      chips: CHIPS_INICIO,
    },
  ];

  function checkLocalIntent(text) {
    const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const intent of LOCAL_INTENTS) {
      if (intent.keys.some((k) => {
        const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return q.includes(kn);
      })) {
        return { reply: intent.reply(), chips: intent.chips || [] };
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
    if (!p) return "No encontré esa pauta, parce.";
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
      <div class="cafeto-input-area">
        <input type="text" class="cafeto-input" id="dc-input"
          placeholder="Pregúntele a Don Chucho…"
          autocomplete="off" maxlength="300"
          aria-label="Mensaje para Don Chucho" />
        <button type="button" class="cafeto-send-btn" id="dc-send" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
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

    scrollBottom(container);
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
    msgEl.querySelectorAll(".cafeto-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.closest(".cafeto-chips")?.remove();
        // Re-dispatch como si el usuario lo escribiera
        chip.dispatchEvent(new CustomEvent("dc:chip", { bubbles: true, detail: chip.textContent }));
      });
    });
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
        // 1. Intentar respuesta local (POIs / pautas con botones del mapa)
        const local = checkLocalIntent(text);
        if (local) {
          await new Promise((r) => setTimeout(r, 500)); // pequeña pausa natural
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
        input.focus({ preventScroll: true });
        layoutMobileChat();
      }
    }

    input.addEventListener("focus", () => {
      setTimeout(layoutMobileChat, 300);
    });

    /* ── Chips ── */
    messages.addEventListener("dc:chip", (e) => sendMessage(e.detail));
    messages.addEventListener("click", (e) => {
      // Delegación para chips y poi-links en mensajes ya renderizados
      const chip = e.target.closest(".cafeto-chip");
      if (chip) {
        chip.closest(".cafeto-chips")?.remove();
        sendMessage(chip.textContent);
      }
      const poiLink = e.target.closest(".cafeto-poi-link[data-poi-id]");
      if (poiLink) {
        e.preventDefault();
        if (typeof focusPoi === "function") { focusPoi(poiLink.dataset.poiId); closeChat(); }
      }
    });

    /* ── Input ── */
    sendBtn.addEventListener("click", () => sendMessage());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  /* ─── API pública ────────────────────────────────────────── */
  window.DonChucho = { setPoisData, setPautasData, init: initDonChucho };

})();
