/**
 * Módulo 5: Contadores visuales de misiones en la barra superior
 */
export const QuestTrackerModule = {
  id: "questTracker",
  name: "Contadores de Misión en Barra",
  active: true,
  elementId: "fh-custom-quest-tracker",

  getShortLabel: function(desc) {
    const d = (desc || "").toLowerCase();
    if (d.includes("taberna") || d.includes("plata")) return "Taberna";
    if (d.includes("motiva") || d.includes("embellece") || d.includes("ayuda")) return "Motivar";
    if (d.includes("suministro")) return "Suministros";
    if (d.includes("moneda")) return "Monedas";
    if (d.includes("forge point") || (d.includes("gasta") && (d.includes("fp") || d.includes("punto")))) return "Gastar FP";
    if (d.includes("producción") || d.includes("produce") || d.includes("hora") || d.includes("minuto")) return "Producción";
    if (d.includes("batalla") || d.includes("ejército") || d.includes("derrota") || d.includes("unidad")) return "Batallas";
    if (d.includes("bien") || d.includes("mercancía")) return "Bienes";
    if (d.includes("incidente")) return "Incidentes";
    if (d.includes("negociaci")) return "Negociación";
    if (d.includes("recluta")) return "Reclutar";
    return (desc || "Cond.").substring(0, 8);
  },

  getContainer: function() {
    let el = document.getElementById(this.elementId);
    if (!el) {
      el = document.createElement("div");
      el.id = this.elementId;
      const hammerBar = document.getElementById("hammerBar");
      if (hammerBar) {
        hammerBar.appendChild(el);
      } else {
        el.style.position = "fixed";
        el.style.top = "2px";
        el.style.left = "550px";
        el.style.zIndex = "1000";
        document.body.appendChild(el);
      }
    }
    return el;
  },

  update: function(quests) {
    if (!this.active || !Array.isArray(quests)) return;
    const container = this.getContainer();
    if (!container) return;

    const cards = [];

    quests.forEach(q => {
      if (!q.windowTitle || !q.windowTitle.includes("Recurrente")) return;
      const isCollect = (q.state === "collectReward" || q.state === "collect");
      const isAccepted = (q.state === "accepted");
      if (!isCollect && !isAccepted) return;

      const condParts = [];
      let hasAnyDone = false;

      if (Array.isArray(q.successConditions)) {
        q.successConditions.forEach(cond => {
          const max = cond.maxProgress || 1;
          const cur = isCollect ? max : (cond.currentProgress || 0);
          const label = this.getShortLabel(cond.description);
          const done = isCollect || (cur >= max);
          if (done) hasAnyDone = true;

          const color = done ? "#57ef57" : "#ffcc00";
          const txt = `${done ? "✔ " : ""}${label}: <b style="color:${color}">${cur.toLocaleString("es-ES")}/${max.toLocaleString("es-ES")}</b>`;
          condParts.push(`<span title="${(cond.description || "").replace(/"/g, '&quot;')}">${txt}</span>`);
        });
      }

      if (condParts.length > 0) {
        const cardClass = (isCollect || hasAnyDone) ? "foe-tracker-card ready" : "foe-tracker-card pending";
        const sep = ' <span style="color:#e0b84c;font-size:0.7rem;font-weight:bold;">ó</span> ';
        cards.push(`<div class="${cardClass}">${condParts.join(sep)}</div>`);
      }
    });

    container.innerHTML = cards.join("");
  },

  init: function(logger) {
    this.active = true;
    this.getContainer().style.display = "flex";
    logger("Contadores superiores de misiones activados");
  },

  stop: function(logger) {
    this.active = false;
    const el = document.getElementById(this.elementId);
    if (el) el.style.display = "none";
    logger("Contadores superiores ocultados");
  }
};