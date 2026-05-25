/**
 * Don Chucho — Asistente turístico de Armenia 2026
 * Arriero quindiano con sombrero aguadeño
 * Chatbot local sin API externa: responde con datos de pois.json y pautas.json
 */

(function () {
  "use strict";

  /* ─── Constantes ─────────────────────────────────────────── */
  const AVATAR_SVG = `<img src="avatar_chucho/don-chucho-bust.png" alt="Don Chucho" width="40" height="40" style="border-radius:50%;display:block;object-fit:cover;object-position:center top;" />`;
  const AVATAR_BTN = `<img src="avatar_chucho/don-chucho-bust.png" alt="Don Chucho" width="52" height="52" style="border-radius:50%;display:block;object-fit:cover;object-position:center top;" />`;

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

  /* ─── Base de conocimiento local ─────────────────────────── */
  let _pois = [];
  let _pautas = [];

  function setPoisData(pois) { _pois = pois || []; }
  function setPautasData(pautas) { _pautas = pautas || []; }

  /* ─── Motor de respuestas ─────────────────────────────────── */
  const INTENTS = [
    {
      keys: ["hola", "buenas", "buenos", "hey", "ey", "saludos", "buen día", "buenas tardes"],
      reply: () => aleatorio([
        "¡Buenas, parce! ¿En qué le ayudo hoy?",
        "¡Ey, paisano! Cuénteme qué quiere conocer.",
        "¡Bienvenido! Aquí Don Chucho, listo pa' guiarlo.",
      ]),
      chips: ["¿Qué visitar?", "¿Dónde comer?", "¿Dónde comprar?"],
    },
    {
      keys: ["visitar", "turismo", "turístico", "turistico", "atractivo", "lugar", "sitio", "ver", "conocer", "pasear"],
      reply: () => buildPoiList("turistico"),
      chips: ["Plaza de Bolívar", "Museo del Oro", "Parque de la Vida", "¿Dónde comer?"],
    },
    {
      keys: ["comer", "gastronomía", "gastronomia", "restaurante", "café", "cafe", "comida", "almorzar", "desayunar", "cenar"],
      reply: () => buildPoiList("gastronomico"),
      chips: ["Anatolia", "Sol de Café", "¿Dónde comprar?", "¿Qué visitar?"],
    },
    {
      keys: ["comprar", "comercial", "tienda", "centro comercial", "shopping", "mercado"],
      reply: () => buildPoiList("comercial"),
      chips: ["Portal del Quindío", "Unicentro", "¿Dónde comer?", "¿Qué visitar?"],
    },
    {
      keys: ["pauta", "pautas", "anunciante", "patrocinador", "publicidad"],
      reply: () => buildPautasList(),
      chips: ["Anatolia", "Diana Seguros", "Quindío Travel"],
    },
    {
      keys: ["llegar", "cómo llegar", "como llegar", "ruta", "dirección", "direccion", "ubicación", "ubicacion", "mapa", "google maps"],
      reply: () => "Para llegar a cualquier lugar, haga clic en el marcador del mapa y luego en <strong>«Cómo llegar»</strong>. ¡Lo lleva directo a Google Maps, parce!",
      chips: ["¿Qué visitar?", "¿Dónde comer?"],
    },
    {
      keys: ["anatolia"],
      reply: () => buildPautaDetalle("anatolia"),
      chips: ["¿Dónde comer?", "Quindío Travel", "Diana Seguros"],
    },
    {
      keys: ["diana", "seguros", "diana seguros"],
      reply: () => buildPautaDetalle("diana_seguros"),
      chips: ["Anatolia", "Quindío Travel", "¿Dónde comprar?"],
    },
    {
      keys: ["quindío travel", "quindio travel", "travel", "tours", "tour", "ecoturismo", "aventura"],
      reply: () => buildPautaDetalle("quindio_travel"),
      chips: ["Anatolia", "¿Qué visitar?", "¿Cómo llegar?"],
    },
    {
      keys: ["plaza", "bolívar", "bolivar", "catedral"],
      reply: () => buildPoiDetalle("plaza-bolivar"),
      chips: ["Museo del Oro", "Parque Sucre", "¿Dónde comer?"],
    },
    {
      keys: ["museo", "oro", "quimbaya"],
      reply: () => buildPoiDetalle("museo-oro"),
      chips: ["Plaza de Bolívar", "Parque de la Vida", "¿Dónde comer?"],
    },
    {
      keys: ["parque vida", "parque de la vida"],
      reply: () => buildPoiDetalle("parque-vida"),
      chips: ["Plaza de Bolívar", "¿Dónde comer?", "Quindío Travel"],
    },
    {
      keys: ["fundadores", "parque fundadores", "los fundadores"],
      reply: () => buildPoiDetalle("parque-fundadores"),
      chips: ["Plaza de Bolívar", "Museo del Oro", "¿Dónde comer?"],
    },
    {
      keys: ["sucre", "parque sucre"],
      reply: () => buildPoiDetalle("parque-sucre"),
      chips: ["Plaza de Bolívar", "¿Dónde comer?", "¿Dónde comprar?"],
    },
    {
      keys: ["sol de café", "sol de cafe", "sol cafe"],
      reply: () => buildPoiDetalle("sol-cafe"),
      chips: ["Anatolia", "¿Dónde comer?", "¿Qué visitar?"],
    },
    {
      keys: ["portal", "portal quindío", "portal quindio"],
      reply: () => buildPoiDetalle("portal-quindio"),
      chips: ["Unicentro", "¿Dónde comer?", "¿Qué visitar?"],
    },
    {
      keys: ["unicentro"],
      reply: () => buildPoiDetalle("unicentro"),
      chips: ["Portal del Quindío", "¿Dónde comer?", "¿Qué visitar?"],
    },
    {
      keys: ["armenia", "ciudad milagro", "quindío", "quindio", "colombia", "cafetera", "eje cafetero"],
      reply: () => "Armenia es la <strong>Ciudad Milagro</strong> del Quindío, corazón del Eje Cafetero colombiano. Fundada en 1889, combina historia, gastronomía y naturaleza. ¿Qué quiere explorar?",
      chips: ["¿Qué visitar?", "¿Dónde comer?", "¿Dónde comprar?"],
    },
    {
      keys: ["gracias", "muchas gracias", "gracia", "chévere", "chevere", "bacano", "genial", "perfecto"],
      reply: () => aleatorio([
        "¡Con mucho gusto, parce! Pa' lo que necesite, aquí estoy.",
        "¡Eso es! Que disfrute Armenia. ¿Algo más le cuento?",
        "¡A la orden, paisano! ¿Quiere saber algo más?",
      ]),
      chips: ["¿Qué visitar?", "¿Dónde comer?", "¿Dónde comprar?"],
    },
    {
      keys: ["adiós", "adios", "chao", "hasta luego", "bye", "nos vemos"],
      reply: () => "¡Hasta luego, parce! Que disfrute Armenia y el Quindío. ¡Vuelva pronto! ☕",
      chips: [],
    },
  ];

  /* ─── Helpers de respuesta ───────────────────────────────── */
  function aleatorio(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function buildPoiList(category) {
    const labels = { turistico: "turísticos", comercial: "comerciales", gastronomico: "gastronómicos" };
    const items = _pois.filter((p) => p.category === category);
    if (!items.length) return "No encontré lugares en esa categoría por ahora.";
    const lista = items
      .map((p) => `• <button class="cafeto-poi-link" data-poi-id="${p.id}">${p.name}</button>`)
      .join("<br>");
    return `Aquí los lugares <strong>${labels[category]}</strong> en el mapa:<br><br>${lista}<br><br>Haga clic en el nombre para verlo en el mapa.`;
  }

  function buildPoiDetalle(id) {
    const poi = _pois.find((p) => p.id === id);
    if (!poi) return "No encontré ese lugar, parce. ¿Me da más detalles?";
    let html = `<strong>${poi.name}</strong><br>${poi.description}`;
    if (poi.address) html += `<br><em>📍 ${poi.address}</em>`;
    if (poi.telefono) html += `<br>📞 ${poi.telefono}`;
    if (poi.horario) html += `<br>🕐 ${poi.horario}`;
    html += `<br><br><button class="cafeto-poi-link" data-poi-id="${poi.id}">Ver en el mapa →</button>`;
    return html;
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
    if (p.horario) html += `<br>🕐 ${p.horario}`;
    if (p.telefono) html += `<br>📞 ${p.telefono}`;
    if (p.whatsapp) {
      const num = p.whatsapp.replace(/\D/g, "");
      const msg = encodeURIComponent(p.whatsappMensaje || `Hola, vi ${p.nombre} en el Mapa Armenia 2026.`);
      html += `<br><br><a href="https://wa.me/${num}?text=${msg}" target="_blank" rel="noopener" class="cafeto-poi-link">💬 Escribir por WhatsApp</a>`;
    }
    html += `<br><button class="cafeto-poi-link" data-poi-id="${p.poiId}">Ver en el mapa →</button>`;
    return html;
  }

  function processMessage(text) {
    const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const intent of INTENTS) {
      if (intent.keys.some((k) => {
        const kn = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return q.includes(kn);
      })) {
        return { reply: intent.reply(), chips: intent.chips || [] };
      }
    }
    // Fallback
    return {
      reply: aleatorio([
        "Mmm, no le entendí bien, parce. ¿Me pregunta sobre turismo, gastronomía o comercio en Armenia?",
        "Eso sí me cogió fuera de la ruta. ¿Me pregunta sobre lugares, comida o cómo llegar?",
        "No le caché, paisano. Pruebe con una de estas opciones:",
      ]),
      chips: ["¿Qué visitar?", "¿Dónde comer?", "¿Dónde comprar?", "Pautas del mapa"],
    };
  }

  /* ─── DOM helpers ────────────────────────────────────────── */
  function escHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function scrollBottom(el) {
    el.scrollTop = el.scrollHeight;
  }

  /* ─── Construcción del widget ────────────────────────────── */
  function buildWidget() {
    // Botón flotante
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

    // Ventana
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
          autocomplete="off" maxlength="200"
          aria-label="Mensaje para Don Chucho" />
        <button type="button" class="cafeto-send-btn" id="dc-send" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
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
      // Chips van dentro del bubble del bot
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

  /* ─── Lógica principal ───────────────────────────────────── */
  function initDonChucho() {
    const { btn, win } = buildWidget();
    const messages = win.querySelector("#dc-messages");
    const input = win.querySelector("#dc-input");
    const sendBtn = win.querySelector("#dc-send");
    const closeBtn = win.querySelector(".cafeto-close-btn");

    let isOpen = false;
    let greeted = false;

    /* Abrir / cerrar */
    function openChat() {
      isOpen = true;
      win.removeAttribute("hidden");
      win.classList.add("cafeto-opening");
      btn.setAttribute("aria-expanded", "true");
      // Quitar badge
      const badge = btn.querySelector(".cafeto-btn-badge");
      if (badge) badge.style.display = "none";

      setTimeout(() => win.classList.remove("cafeto-opening"), 350);
      input.focus();

      if (!greeted) {
        greeted = true;
        const saludo = aleatorio(SALUDOS);
        setTimeout(() => {
          addMessage(messages, "bot", saludo, CHIPS_INICIO);
        }, 300);
      }
    }

    function closeChat() {
      isOpen = false;
      win.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }

    btn.addEventListener("click", () => (isOpen ? closeChat() : openChat()));
    closeBtn.addEventListener("click", closeChat);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closeChat();
    });

    /* Enviar mensaje */
    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";

      addMessage(messages, "user", text);

      const typing = showTyping(messages);
      const delay = 600 + Math.random() * 500;

      setTimeout(() => {
        typing.remove();
        const { reply, chips } = processMessage(text);
        const msgEl = addMessage(messages, "bot", reply, chips);

        // Chips → enviar como mensaje
        msgEl.querySelectorAll(".cafeto-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            chip.closest(".cafeto-chips")?.remove();
            sendChip(chip.textContent);
          });
        });

        // POI links → enfocar en mapa
        msgEl.querySelectorAll(".cafeto-poi-link[data-poi-id]").forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            const id = link.dataset.poiId;
            if (typeof focusPoi === "function") {
              focusPoi(id);
              closeChat();
            }
          });
        });
      }, delay);
    }

    function sendChip(label) {
      addMessage(messages, "user", label);
      const typing = showTyping(messages);
      setTimeout(() => {
        typing.remove();
        const { reply, chips } = processMessage(label);
        const msgEl = addMessage(messages, "bot", reply, chips);

        msgEl.querySelectorAll(".cafeto-chip").forEach((chip) => {
          chip.addEventListener("click", () => {
            chip.closest(".cafeto-chips")?.remove();
            sendChip(chip.textContent);
          });
        });

        msgEl.querySelectorAll(".cafeto-poi-link[data-poi-id]").forEach((link) => {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            if (typeof focusPoi === "function") {
              focusPoi(link.dataset.poiId);
              closeChat();
            }
          });
        });
      }, 600 + Math.random() * 400);
    }

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Chips iniciales en mensajes ya renderizados (delegación)
    messages.addEventListener("click", (e) => {
      const chip = e.target.closest(".cafeto-chip");
      if (chip) {
        chip.closest(".cafeto-chips")?.remove();
        sendChip(chip.textContent);
      }
      const poiLink = e.target.closest(".cafeto-poi-link[data-poi-id]");
      if (poiLink) {
        e.preventDefault();
        if (typeof focusPoi === "function") {
          focusPoi(poiLink.dataset.poiId);
          closeChat();
        }
      }
    });
  }

  /* ─── API pública ────────────────────────────────────────── */
  window.DonChucho = { setPoisData, setPautasData, init: initDonChucho };

})();
