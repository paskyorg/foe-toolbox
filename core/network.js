/**
 * Core Network: Interceptor unificado de XMLHttpRequest
 * Gestiona todas las transformaciones de datos en una sola pasada limpia y sin duplicidad.
 */
export const NetworkInterceptor = {
  installed: false,

  init: function(modules, logger) {
    if (this.installed) return;
    this.installed = true;

    const rTDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");
    const rDesc = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response");
    const origSend = XMLHttpRequest.prototype.send;

    function processNetworkData(xhr) {
      if (xhr._toolboxMod !== undefined) return xhr._toolboxMod;

      try {
        const raw = rTDesc.get.call(xhr);
        if (!raw || raw.length < 10) return null;

        // Comprobamos si nos interesa este JSON
        const isQuest = raw.includes('"QuestService"') && raw.includes('"getUpdates"');
        const isArmy = raw.includes('"ArmyUnitManagementService"') && raw.includes('"units"');

        if (isQuest || isArmy) {
          const data = JSON.parse(raw);
          let modified = false;

          if (Array.isArray(data)) {
            data.forEach(item => {
              if (!item) return;

              // 1. Misiones (Limpiador/Ocultador)
              if (isQuest && item.requestClass === "QuestService" && item.requestMethod === "getUpdates" && Array.isArray(item.responseData)) {
                if (modules.questCleaner && modules.questCleaner.transformQuests(item.responseData, logger)) {
                  modified = true;
                }
              }

              // 2. Ejército
              if (isArmy && item.requestClass === "ArmyUnitManagementService" && item.responseData && item.responseData.units) {
                if (modules.armyFilter && modules.armyFilter.transformArmy(item.responseData, logger)) {
                  modified = true;
                }
              }
            });
          }

          if (modified) {
            xhr._toolboxMod = JSON.stringify(data);
            return xhr._toolboxMod;
          }
        }
      } catch (err) {
        console.error("[FoE Toolbox] Error en interceptor:", err);
      }
      return null;
    }

    // Sobrescritura de getters en prototipo
    Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
      get: function() {
        const mod = processNetworkData(this);
        return mod !== null ? mod : rTDesc.get.call(this);
      },
      configurable: true
    });

    Object.defineProperty(XMLHttpRequest.prototype, "response", {
      get: function() {
        const mod = processNetworkData(this);
        return mod !== null ? mod : rDesc.get.call(this);
      },
      configurable: true
    });

    // En send enganchamos la actualización pasiva de los contadores en la barra
    XMLHttpRequest.prototype.send = function() {
      const xhr = this;
      xhr.addEventListener("load", function() {
        try {
          if (xhr.responseText && xhr.responseText.includes('"QuestService"')) {
            const data = JSON.parse(xhr.responseText);
            if (Array.isArray(data)) {
              data.forEach(item => {
                if (item && item.requestClass === "QuestService" && Array.isArray(item.responseData)) {
                  if (modules.questTracker && modules.questTracker.active) {
                    modules.questTracker.update(item.responseData);
                  }
                }
              });
            }
          }
        } catch (e) {}
      });
      return origSend.apply(this, arguments);
    };

    logger("Interceptor de red unificado instalado correctamente");
  }
};