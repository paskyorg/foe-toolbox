/**
 * Módulo 2: Cálculo de PFs en Gran Edificio
 * Observa la tabla #OwnPartTable y resta el valor de peligro (danger)
 */
export const FpCalculatorModule = {
  id: "fpCalculator",
  name: "Cálculo FP en GE",
  observer: null,
  active: false,

  procesarFila: function(tr) {
    const fpElem = tr.querySelector(".copy-fp");
    const dangerElem = tr.querySelector(".error");
    if (!fpElem || !dangerElem) return;

    let fpRaw = fpElem.dataset.copy || fpElem.textContent;
    const fp = parseInt(fpRaw, 10);
    const dangerText = dangerElem.textContent.trim();
    const match = dangerText.match(/\((\d+)FP\)/);
    if (!match) return;

    const dangerValue = parseInt(match[1], 10);
    if (isNaN(fp) || isNaN(dangerValue)) return;
    if (dangerElem.dataset.modified === "1") return;

    dangerElem.dataset.modified = "1";
    const diff = fp - dangerValue;
    const nuevo = document.createElement("strong");
    nuevo.className = "success copy-fp clickable";
    nuevo.dataset.copy = diff;
    nuevo.textContent = " " + diff;
    dangerElem.appendChild(nuevo);
  },

  procesarTabla: function() {
    const tbody = document.querySelector("#OwnPartTable tbody");
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach(tr => this.procesarFila(tr));
  },

  init: function(logger) {
    this.active = true;
    this.procesarTabla();
    this.observer = new MutationObserver(() => {
      if (this.active) this.procesarTabla();
    });
    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    logger("Calculadora FP activa en tablas de GE");
  },

  stop: function(logger) {
    this.active = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    logger("Calculadora FP desactivada");
  }
};