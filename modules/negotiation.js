/**
 * Módulo 1: Negociaciones
 * Configuración fija para las negociaciones de GBG
 */
export const NegotiationModule = {
  id: "negotiation",
  name: "Negociaciones GBG",
  isFixed: true, // Configuración fija al arrancar
  init: function(logger) {
    try {
      if (typeof window.Negotiation !== "undefined") {
        window.Negotiation.CONST_Context_GBG = "KK";
        logger("Negociaciones: CONST_Context_GBG fijado en 'KK'");
      } else {
        // En caso de que se cargue antes de que el script declare Negotiation
        Object.defineProperty(window, "Negotiation", {
          configurable: true,
          enumerable: true,
          get: function() { return this._negObj; },
          set: function(val) {
            this._negObj = val;
            if (val && typeof val === "object") {
              val.CONST_Context_GBG = "KK";
              logger("Negociaciones: CONST_Context_GBG interceptado y fijado en 'KK'");
            }
          }
        });
      }
    } catch (e) {
      logger("Error al fijar Negociación: " + e.message, "err");
    }
  }
};