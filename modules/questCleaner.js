/**
 * Módulo 3: Limpiador y reductor de Misiones
 * - Oculta misiones completas por su ID
 * - Elimina condiciones innecesarias en recurrentes
 * - Recorta diálogo a "Hacked!"
 */
export const QuestCleanerModule = {
  id: "questCleaner",
  name: "Compactar/Ocultar Misiones",
  active: true,

  // Lista de misiones completas a ocultar
  misionesAOcultar: [17400],

  // Misiones específicas y condiciones a eliminar [ID_MISION]: [IDs de condiciones]
  condicionesAEliminar: {
    933145: [2],    // Entrenamiento militar: Quita negociación (2)
    933147: [2, 4], // Espacio profundo: Quita negociación (2) y poríferas (4)
    933151: [2],    // Alternativas: Quita producciones de 5 min (2)
    933152: [2]     // Protección: Quita negociación compleja (2)
  },

  /**
   * Transforma el array responseData del servicio QuestService
   */
  transformQuests: function(responseData, logger) {
    if (!this.active || !Array.isArray(responseData)) return false;
    let modified = false;

    // 1. Ocultar misiones enteras
    const lenAntes = responseData.length;
    const filtradas = responseData.filter(q => !this.misionesAOcultar.includes(q.id));
    if (filtradas.length !== lenAntes) {
      modified = true;
      responseData.length = 0;
      filtradas.forEach(q => responseData.push(q));
      logger(`Misiones: Ocultada(s) ${lenAntes - filtradas.length} misión(es)`);
    }

    // 2. Modificar recurrentes y eliminar condiciones
    responseData.forEach(quest => {
      const esRecurrente = (quest.windowTitle && quest.windowTitle.includes("Recurrente")) ||
                           quest.type === "generic" ||
                           this.condicionesAEliminar[quest.id];

      if (esRecurrente) {
        modified = true;
        quest.description = "Hacked!";
        quest.headline = "";

        if (Array.isArray(quest.successConditions)) {
          quest.successConditions.forEach(c => { c.hint = ""; });
        }

        const toDel = this.condicionesAEliminar[quest.id];
        if (toDel && toDel.length > 0) {
          if (Array.isArray(quest.successConditions)) {
            quest.successConditions = quest.successConditions.filter(c => !toDel.includes(c.id));
          }
          if (Array.isArray(quest.successConditionGroups)) {
            quest.successConditionGroups.forEach(g => {
              if (Array.isArray(g.conditionIds)) {
                g.conditionIds = g.conditionIds.filter(id => !toDel.includes(id));
              }
            });
            quest.successConditionGroups = quest.successConditionGroups.filter(g => g.conditionIds && g.conditionIds.length > 0);
          }
        }
      }
    });

    return modified;
  },

  init: function(logger) {
    this.active = true;
    logger("Misiones: Compactador y filtro activado");
  },

  stop: function(logger) {
    this.active = false;
    logger("Misiones: Compactador desactivado");
  }
};