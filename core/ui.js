/**
 * Core UI: Interfaz de usuario, panel flotante, logs y drag & drop
 */
export const UIManager = {
  panelId: "foe-toolbox-panel",
  logId: "foe-toolbox-log",

  toast: function(msg, isSuccess = true) {
    const d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = `
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 100001;
      background: rgba(20, 18, 15, 0.95);
      border: 1px solid ${isSuccess ? "#2ecc71" : "#e74c3c"};
      color: ${isSuccess ? "#55efc4" : "#ff7675"};
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-family: sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.7);
      transition: opacity 0.4s ease;
    `;
    document.body.appendChild(d);
    setTimeout(() => {
      d.style.opacity = "0";
      setTimeout(() => d.remove(), 400);
    }, 2200);
  },

  log: function(msg, type = "info") {
    console.log(`[FoE Toolbox] ${msg}`);
    const logBox = document.getElementById(this.logId);
    if (!logBox) return;

    const entry = document.createElement("div");
    entry.className = `log-entry ${type === "warn" ? "log-warn" : type === "err" ? "log-err" : ""}`;
    const time = new Date().toLocaleTimeString("es-ES", { hour12: false });
    entry.textContent = `[${time}] ${msg}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  },

  renderPanel: function(modules, stateManager) {
    let panel = document.getElementById(this.panelId);
    if (panel) {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      return;
    }

    const savedPos = stateManager.get("pos", { top: "80px", left: "calc(100vw - 340px)" });

    panel = document.createElement("div");
    panel.id = this.panelId;
    panel.style.top = savedPos.top;
    panel.style.left = savedPos.left;

    // Header
    const header = document.createElement("div");
    header.id = "foe-toolbox-header";
    header.innerHTML = `
      <div class="title">⚔️ <span>FoE Toolbox</span></div>
      <div class="header-btns">
        <button id="foe-btn-min" title="Minimizar">_</button>
        <button id="foe-btn-close" title="Cerrar">&times;</button>
      </div>
    `;
    panel.appendChild(header);

    // Body
    const body = document.createElement("div");
    body.id = "foe-toolbox-body";

    // Contenedor de módulos (toggles)
    const modulesContainer = document.createElement("div");
    modulesContainer.className = "foe-modules-list";

    Object.keys(modules).forEach(key => {
      const mod = modules[key];
      if (mod.isFixed) return; // Las fijas no necesitan switch

      const isEnabled = stateManager.get(`mod_${mod.id}`, mod.active !== false);
      mod.active = isEnabled;

      const row = document.createElement("div");
      row.className = "foe-tool-row";
      row.innerHTML = `
        <span class="foe-tool-name">${mod.name}</span>
        <label class="foe-switch">
          <input type="checkbox" id="switch-${mod.id}" ${isEnabled ? "checked" : ""}>
          <span class="foe-slider"></span>
        </label>
      `;

      const input = row.querySelector("input");
      input.addEventListener("change", (e) => {
        const val = e.target.checked;
        stateManager.set(`mod_${mod.id}`, val);
        if (val) {
          if (mod.init) mod.init((m, t) => this.log(m, t));
        } else {
          if (mod.stop) mod.stop((m, t) => this.log(m, t));
        }
      });

      modulesContainer.appendChild(row);

      // Si está activo al cargar, ejecutamos init
      if (isEnabled && mod.init) {
        mod.init((m, t) => this.log(m, t));
      }
    });

    body.appendChild(modulesContainer);

    // Zona de Mensajes / Log
    const logHeader = document.createElement("div");
    logHeader.id = "foe-toolbox-log-header";
    logHeader.innerHTML = `
      <span>Zona de Mensajes:</span>
      <span style="cursor:pointer;opacity:0.7;" id="foe-btn-clear-log" title="Limpiar">Limpiar</span>
    `;
    body.appendChild(logHeader);

    const logBox = document.createElement("div");
    logBox.id = this.logId;
    body.appendChild(logBox);

    panel.appendChild(body);
    document.body.appendChild(panel);

    // Eventos de botones
    header.querySelector("#foe-btn-close").addEventListener("click", () => {
      panel.style.display = "none";
    });

    let minimized = false;
    header.querySelector("#foe-btn-min").addEventListener("click", () => {
      minimized = !minimized;
      body.style.display = minimized ? "none" : "flex";
    });

    logHeader.querySelector("#foe-btn-clear-log").addEventListener("click", () => {
      logBox.innerHTML = "";
    });

    // Drag & Drop
    this.setupDrag(panel, header, stateManager);

    this.toast("FoE Toolbox cargado con éxito");
    this.log("FoE Toolbox listo para usar.");
  },

  setupDrag: function(panel, handle, stateManager) {
    let isDragging = false, startX, startY, initLeft, initTop;

    handle.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = panel.offsetLeft;
      initTop = panel.offsetTop;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const newL = initLeft + (ev.clientX - startX);
        const newT = initTop + (ev.clientY - startY);
        panel.style.left = `${newL}px`;
        panel.style.top = `${newT}px`;
      };

      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          stateManager.set("pos", { top: panel.style.top, left: panel.style.left });
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }
};