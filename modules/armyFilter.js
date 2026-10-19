/**
 * Módulo 4: Filtro de Ejército
 * Mantiene solo las unidades seleccionadas con 10 HP (vida completa)
 */
export const ArmyFilterModule = {
  id: "armyFilter",
  name: "Filtrar Ejército (Solo 10 HP)",
  active: true,

  // Lista de tipos de unidades a conservar
  allowedUnits: [
    "overclock_orbiter",
    "harpoon_grenadier",
    "abyssal_glider",
    "power_dragon",
    "rogue"
  ],

  /**
   * Transforma el objeto responseData de ArmyUnitManagementService
   */
  transformArmy: function(responseData, logger) {
    if (!this.active || !responseData || !Array.isArray(responseData.units)) return false;

    const totalAntes = responseData.units.length;
    responseData.units = responseData.units.filter(unit => {
      return this.allowedUnits.includes(unit.unitTypeId) && unit.currentHitpoints === 10;
    });

    logger(`Ejército: Reducido de ${totalAntes} a ${responseData.units.length} unidades`);
    return true;
  },

  init: function(logger) {
    this.active = true;
    logger("Filtro de Ejército activado (Solo unidades clave y 10 HP)");
  },

  stop: function(logger) {
    this.active = false;
    logger("Filtro de Ejército desactivado (Cierra y abre el menú para ver todas)");
  }
};