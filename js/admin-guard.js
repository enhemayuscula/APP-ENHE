/*
EÑE MAYÚSCULA — ADMIN GUARD v1
Objetivo:
- La app principal queda en modo lectura por defecto.
- Todos pueden ver la información.
- Solo el administrador, con PIN, puede guardar, borrar, enviar, importar o ejecutar acciones.
- Si la app llama a Apps Script por fetch(), este guard añade adminPin automáticamente cuando el modo admin está activo.
- Si no hay modo admin, bloquea acciones peligrosas en el navegador.

IMPORTANTE:
- Esto protege la interfaz y evita usos accidentales.
- Para seguridad completa, el backend de Apps Script también debe rechazar escrituras sin PIN.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "enhe_admin_pin";
  const MODE_KEY = "enhe_admin_mode";
  const GUARD_VERSION = "1.0.0";

  const WRITE_WORDS = [
    "guardar", "grabar", "salvar", "editar", "modificar", "actualizar",
    "borrar", "eliminar", "delete", "remove",
    "enviar", "send", "mandar",
    "importar", "import", "sincronizar", "sync",
    "crear", "nuevo", "nueva", "añadir", "agregar", "add", "create",
    "ejecutar", "run", "procesar", "preparar",
    "marcar", "confirmar pago", "pagar",
    "generar borrador", "crear borrador", "borrador",
    "reset", "reemplazar", "sustituir"
  ];

  const READ_WORDS = [
    "buscar", "filtrar", "ver", "abrir", "copiar", "whatsapp",
    "cancelar", "cerrar", "volver", "siguiente", "anterior",
    "limpiar búsqueda", "consultar", "refrescar vista"
  ];

  const WRITE_ACTION_RE = /(save|delete|remove|send|import|update|create|reset|replace|sync|run|guardar|borrar|eliminar|enviar|importar|actualizar|crear|preparar|ejecutar|reemplazar|sustituir|marcar)/i;
  const READ_ACTION_RE = /(data|get|list|read|view|load|consultar|listar|leer|ver|cargar)/i;

  let applying = false;

  function norm(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isAdmin() {
    return localStorage.getItem(MODE_KEY) === "admin" && !!localStorage.getItem(STORAGE_KEY);
  }

  function adminPin() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  function isLikelyWriteText(text) {
    const t = norm(text);
    if (!t) return false;
    if (READ_WORDS.some(w => t.includes(norm(w)))) return false;
    return WRITE_WORDS.some(w => t.includes(norm(w)));
  }

  function isSearchLike(el) {
    const t = norm([
      el.id,
      el.name,
      el.placeholder,
      el.getAttribute("aria-label"),
      el.closest && el.closest("label") ? el.closest("label").textContent : ""
    ].join(" "));
    return /(buscar|busqueda|búsqueda|filtro|filtrar|search|filter)/i.test(t);
  }

  function isWriteElement(el) {
    if (!el || !el.matches) return false;

    const role = el.getAttribute("role") || "";
    const type = el.getAttribute("type") || "";
    const onclick = el.getAttribute("onclick") || "";
    const href = el.getAttribute("href") || "";
    const label = [
      el.textContent,
      el.value,
      el.title,
      el.id,
      el.name,
      el.className,
      onclick,
      href,
      role,
      type
    ].join(" ");

    if (el.dataset && el.dataset.publicAction === "true") return false;
    if (el.dataset && el.dataset.adminAction === "true") return true;

    if (el.matches("button,input[type='button'],input[type='submit'],a,[role='button']")) {
      return isLikelyWriteText(label) || WRITE_ACTION_RE.test(label);
    }

    return false;
  }

  function showNotice(message) {
    let box = document.getElementById("enhe-admin-guard-notice");
    if (!box) {
      box = document.createElement("div");
      box.id = "enhe-admin-guard-notice";
      box.className = "enhe-admin-guard-notice";
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(showNotice._t);
    showNotice._t = setTimeout(() => box.classList.remove("show"), 3500);
  }

  function buildBar() {
    if (document.getElementById("enhe-admin-guard-bar")) return;

    const bar = document.createElement("div");
    bar.id = "enhe-admin-guard-bar";
    bar.className = "enhe-admin-guard-bar";
    bar.innerHTML = `
      <div class="enhe-admin-guard-left">
        <strong>Ñ Mayúscula</strong>
        <span id="enhe-admin-guard-mode"></span>
      </div>
      <div class="enhe-admin-guard-actions">
        <button type="button" id="enhe-admin-guard-login" data-public-action="true">Activar administrador</button>
        <button type="button" id="enhe-admin-guard-logout" data-public-action="true">Salir admin</button>
      </div>
    `;
    document.body.appendChild(bar);

    document.getElementById("enhe-admin-guard-login").addEventListener("click", activateAdmin);
    document.getElementById("enhe-admin-guard-logout").addEventListener("click", deactivateAdmin);
  }

  function activateAdmin() {
    const pin = prompt("PIN de administrador:");
    if (!pin) return;
    localStorage.setItem(STORAGE_KEY, pin.trim());
    localStorage.setItem(MODE_KEY, "admin");
    applyGuard();
    showNotice("Modo administrador activado.");
  }

  function deactivateAdmin() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODE_KEY);
    applyGuard();
    showNotice("Modo lectura activado.");
  }

  function updateBar() {
    const mode = document.getElementById("enhe-admin-guard-mode");
    const login = document.getElementById("enhe-admin-guard-login");
    const logout = document.getElementById("enhe-admin-guard-logout");
    if (!mode || !login || !logout) return;

    if (isAdmin()) {
      mode.textContent = "Modo administrador";
      mode.className = "enhe-admin-mode admin";
      login.style.display = "none";
      logout.style.display = "";
      document.documentElement.classList.add("enhe-is-admin");
      document.documentElement.classList.remove("enhe-is-readonly");
    } else {
      mode.textContent = "Modo lectura";
      mode.className = "enhe-admin-mode readonly";
      login.style.display = "";
      logout.style.display = "none";
      document.documentElement.classList.add("enhe-is-readonly");
      document.documentElement.classList.remove("enhe-is-admin");
    }
  }

  function lockOrUnlockElement(el) {
    if (!el || !el.matches) return;

    const admin = isAdmin();

    if (isWriteElement(el)) {
      el.classList.toggle("enhe-admin-locked", !admin);
      el.setAttribute("data-admin-guard", admin ? "open" : "locked");
      if ("disabled" in el) el.disabled = !admin;
      if (!admin) el.setAttribute("title", "Solo administrador");
      else if (el.getAttribute("title") === "Solo administrador") el.removeAttribute("title");
      return;
    }

    if (el.matches("input,textarea,select")) {
      if (isSearchLike(el)) return;
      const explicitPublic = el.dataset && el.dataset.publicAction === "true";
      const explicitAdmin = el.dataset && el.dataset.adminField === "true";
      const looksEditable = explicitAdmin || !el.readOnly;
      if (explicitPublic) return;

      // En modo lectura, permite ver valores pero evita modificación en campos normales.
      if (!admin && looksEditable) {
        if (el.tagName === "SELECT") el.disabled = true;
        else el.readOnly = true;
        el.classList.add("enhe-admin-field-locked");
        el.setAttribute("data-admin-guard-field", "locked");
      } else if (admin && el.getAttribute("data-admin-guard-field") === "locked") {
        if (el.tagName === "SELECT") el.disabled = false;
        else el.readOnly = false;
        el.classList.remove("enhe-admin-field-locked");
        el.removeAttribute("data-admin-guard-field");
      }
    }
  }

  function applyGuard() {
    if (applying) return;
    applying = true;
    try {
      buildBar();
      updateBar();

      const candidates = document.querySelectorAll(
        "button,input,textarea,select,a,[role='button']"
      );
      candidates.forEach(lockOrUnlockElement);
    } finally {
      applying = false;
    }
  }

  function shouldBlockUrl(url) {
    try {
      const u = new URL(String(url), window.location.href);
      const action = u.searchParams.get("action") || "";
      if (!action) return false;
      if (READ_ACTION_RE.test(action) && !WRITE_ACTION_RE.test(action)) return false;
      return WRITE_ACTION_RE.test(action);
    } catch (e) {
      return WRITE_ACTION_RE.test(String(url));
    }
  }

  function appendPinToUrl(url) {
    try {
      const u = new URL(String(url), window.location.href);
      if (!u.searchParams.get("adminPin")) {
        u.searchParams.set("adminPin", adminPin());
      }
      return u.toString();
    } catch (e) {
      const join = String(url).includes("?") ? "&" : "?";
      return String(url) + join + "adminPin=" + encodeURIComponent(adminPin());
    }
  }

  function patchFetch() {
    if (window.__enheAdminGuardFetchPatched) return;
    window.__enheAdminGuardFetchPatched = true;

    const originalFetch = window.fetch;
    if (!originalFetch) return;

    window.fetch = function guardedFetch(input, init) {
      let url = typeof input === "string" ? input : (input && input.url) || "";

      if (shouldBlockUrl(url)) {
        if (!isAdmin()) {
          showNotice("Acción bloqueada: solo puede ejecutarla el administrador.");
          return Promise.reject(new Error("Acción bloqueada: solo administrador."));
        }

        const newUrl = appendPinToUrl(url);
        if (typeof input === "string") {
          input = newUrl;
        } else if (input && input.url) {
          input = new Request(newUrl, input);
        }
      }

      return originalFetch.call(this, input, init);
    };
  }

  function patchXHR() {
    if (window.__enheAdminGuardXHRPatched) return;
    window.__enheAdminGuardXHRPatched = true;

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (shouldBlockUrl(url)) {
        if (!isAdmin()) {
          showNotice("Acción bloqueada: solo puede ejecutarla el administrador.");
          throw new Error("Acción bloqueada: solo administrador.");
        }
        url = appendPinToUrl(url);
      }
      return originalOpen.apply(this, [method, url].concat([].slice.call(arguments, 2)));
    };
  }

  function installClickGuard() {
    document.addEventListener("click", function (ev) {
      const target = ev.target.closest && ev.target.closest("button,input[type='button'],input[type='submit'],a,[role='button']");
      if (!target) return;

      if (!isAdmin() && isWriteElement(target)) {
        ev.preventDefault();
        ev.stopPropagation();
        showNotice("Solo el administrador puede modificar, enviar o ejecutar acciones.");
        return false;
      }
    }, true);

    document.addEventListener("submit", function (ev) {
      if (!isAdmin()) {
        ev.preventDefault();
        ev.stopPropagation();
        showNotice("Formulario bloqueado: solo administrador.");
        return false;
      }
    }, true);
  }

  function observeDom() {
    const obs = new MutationObserver(() => {
      clearTimeout(observeDom._t);
      observeDom._t = setTimeout(applyGuard, 150);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    patchFetch();
    patchXHR();
    installClickGuard();
    buildBar();
    applyGuard();
    observeDom();
    setTimeout(applyGuard, 1000);
    setTimeout(applyGuard, 2500);

    window.ENHE_ADMIN_GUARD = {
      version: GUARD_VERSION,
      isAdmin,
      activateAdmin,
      deactivateAdmin,
      applyGuard
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
