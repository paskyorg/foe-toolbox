/**
 * FoE Toolbox - Orquestador Principal (main.js)
 */
import { NegotiationModule } from "./modules/negotiation.js";
import { FpCalculatorModule } from "./modules/fpCalculator.js";
import { QuestCleanerModule } from "./modules/questCleaner.js";
import { ArmyFilterModule } from "./modules/armyFilter.js";
import { QuestTrackerModule } from "./modules/questTracker.js";
import { NetworkInterceptor } from "./core/network.js";
import { UIManager } from "./core/ui.js";

// Gestor de persistencia en localStorage
const StateManager = {
  key: "foe_toolbox_config",
  getAll: function() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "{}");
    } catch (e) {
      return {};
    }
  },
  get: function(prop, defaultVal) {
    const data = this.getAll();
    return data[prop] !== undefined ? data[prop] : defaultVal;
  },
  set: function(prop, val) {
    const data = this.getAll();
    data[prop] = val;
    localStorage.setItem(this.key, JSON.stringify(data));
  }
};

// Carga automática del archivo CSS desde la misma ruta base
function loadStyles(baseUrl) {
  const cssId = "foe-toolbox-style";
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link");
    link.id = cssId;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = baseUrl + "css/style.css";
    document.head.appendChild(link);
  }
}

// Inicialización de la aplicación
export function initToolbox(baseUrl = "./") {
  loadStyles(baseUrl);

  const modules = {
    negotiation: NegotiationModule,
    fpCalculator: FpCalculatorModule,
    questCleaner: QuestCleanerModule,
    armyFilter: ArmyFilterModule,
    questTracker: QuestTrackerModule
  };

  // 1. Ejecutar configuraciones fijas obligatorias
  NegotiationModule.init((msg, type) => UIManager.log(msg, type));

  // 2. Instalar el interceptor de red unificado
  NetworkInterceptor.init(modules, (msg, type) => UIManager.log(msg, type));

  // 3. Renderizar el panel flotante
  UIManager.renderPanel(modules, StateManager);
}