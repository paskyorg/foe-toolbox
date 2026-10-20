/**
 * ============================================================================
 * FoE Toolbox - Script Principal Unificado
 * ============================================================================
 */
(function() {
    // Evitar doble inyección si se pulsa varias veces el bookmarklet
    if (window.__foeToolboxLoaded) {
        if (typeof window.__foeShowToast === "function") {
            window.__foeShowToast("FoE Toolbox ya está activo", "#f39c12");
        }
        var p = document.getElementById("foe-toolbox-panel");
        if (p) p.style.display = p.style.display === "none" ? "block" : "none";
        return;
    }
    window.__foeToolboxLoaded = true;

    // ========================================================================
    // 0. SISTEMA DE TOAST (NOTIFICACIONES)
    // ========================================================================
    window.__foeShowToast = function(msg, color) {
        var d = document.createElement("div");
        d.textContent = msg;
        d.style.cssText = "position:fixed;top:10px;right:10px;z-index:999999;background:rgba(0,0,0,0.85);color:" + 
                          (color || "#2ecc71") + ";padding:7px 12px;border-radius:4px;font-size:12px;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.5);transition:opacity 0.5s ease;";
        document.body.appendChild(d);
        setTimeout(function() {
            d.style.opacity = "0";
            setTimeout(function() { d.remove(); }, 500);
        }, 1800);
    };

    // ========================================================================
    // 1. CONFIGURACIONES BÁSICAS Y FIJAS
    // ========================================================================
    // Negociaciones CBG
    try {
        if (typeof Negotiation !== "undefined") {
            Negotiation.CONST_Context_GBG = "KK";
        }
    } catch(e) {}

    // Estados de módulos (Persistentes en localStorage)
    window.__foeConfig = {
        fpHelper: localStorage.getItem("foe_fp_helper") !== "0",
        questCleaner: localStorage.getItem("foe_quest_cleaner") !== "0",
        questTracker: localStorage.getItem("foe_quest_tracker") !== "0",
        armyFilter: localStorage.getItem("foe_army_filter") !== "0",
        marketSort: localStorage.getItem("foe_market_sort") !== "0",
        marketHideUnfair: localStorage.getItem("foe_market_hide_unfair") === "1"
    };

    // ========================================================================
    // 2. CÁLCULO DE PFs (CALCULADORA DE GE)
    // ========================================================================
    function procesarFilaFP(tr) {
        if (!window.__foeConfig.fpHelper) return;
        const fpElem = tr.querySelector(".copy-fp");
        const dangerElem = tr.querySelector(".error");
        if (!fpElem || !dangerElem) return;

        let fpRaw = fpElem.dataset.copy;
        if (!fpRaw || !fpRaw.trim()) fpRaw = fpElem.textContent;
        const fp = parseInt(fpRaw, 10);

        const dangerText = dangerElem.textContent.trim();
        const match = dangerText.match(/\((\d+)FP\)/);
        if (!match) return;

        const dangerValue = parseInt(match[1], 10);
        if (isNaN(fp) || isNaN(dangerValue)) return;

        const diff = fp - dangerValue;
        if (dangerElem.dataset.modified === "1") return;
        dangerElem.dataset.modified = "1";

        const nuevo = document.createElement("strong");
        nuevo.className = "success copy-fp clickable";
        nuevo.dataset.copy = diff;
        nuevo.textContent = " " + diff;
        dangerElem.appendChild(nuevo);
    }

    function procesarTablaFP() {
        if (!window.__foeConfig.fpHelper) return;
        const tbody = document.querySelector("#OwnPartTable tbody");
        if (!tbody) return;
        tbody.querySelectorAll("tr").forEach(procesarFilaFP);
    }

    procesarTablaFP();
    new MutationObserver(function() {
        procesarTablaFP();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    // ========================================================================
    // 3. MISIONES RECURRENTES (REDUCIR Y OCULTAR)
    // ========================================================================
    var QUESTS_CONDITIONS_TO_REMOVE = {
        933145: [2],
        933147: [2, 4],
        933151: [2],
        933152: [2]
    };
    var QUESTS_TO_HIDE = [17400];

    function limpiarMisiones(quests) {
        if (!Array.isArray(quests) || !window.__foeConfig.questCleaner) return false;
        var modificado = false;

        // Ocultar misiones por ID (ej. 17400)
        var filtradas = quests.filter(function(q) {
            return QUESTS_TO_HIDE.indexOf(q.id) === -1;
        });
        if (filtradas.length !== quests.length) {
            quests.length = 0;
            filtradas.forEach(function(item) { quests.push(item); });
            modificado = true;
        }

        quests.forEach(function(t) {
            if ((t.windowTitle && t.windowTitle.indexOf("Recurrente") !== -1) || t.type === "generic" || QUESTS_CONDITIONS_TO_REMOVE[t.id]) {
                modificado = true;
                t.description = "Hacked!";
                t.headline = "";

                if (Array.isArray(t.successConditions)) {
                    t.successConditions.forEach(function(c) { c.hint = ""; });
                }

                var r = QUESTS_CONDITIONS_TO_REMOVE[t.id];
                if (r && r.length) {
                    if (Array.isArray(t.successConditions)) {
                        t.successConditions = t.successConditions.filter(function(c) {
                            return r.indexOf(c.id) === -1;
                        });
                    }
                    if (Array.isArray(t.successConditionGroups)) {
                        t.successConditionGroups.forEach(function(g) {
                            if (Array.isArray(g.conditionIds)) {
                                g.conditionIds = g.conditionIds.filter(function(cid) {
                                    return r.indexOf(cid) === -1;
                                });
                            }
                        });
                        t.successConditionGroups = t.successConditionGroups.filter(function(g) {
                            return g.conditionIds && g.conditionIds.length > 0;
                        });
                    }
                }
            }
        });

        return modificado;
    }

    // ========================================================================
    // 4. FILTRAR EJÉRCITO
    // ========================================================================
    var ALLOWED_UNITS = ["overclock_orbiter", "harpoon_grenadier", "abyssal_glider", "power_dragon", "rogue"];

    function filtrarEjercito(data) {
        if (!window.__foeConfig.armyFilter || !data || !Array.isArray(data.units)) return false;
        var antes = data.units.length;
        data.units = data.units.filter(function(u) {
            return ALLOWED_UNITS.indexOf(u.unitTypeId) !== -1 && u.currentHitpoints === 10;
        });
        console.log("[ArmyCleaner] Unidades reducidas de " + antes + " a " + data.units.length);
        return true;
    }

    // ========================================================================
    // 5. TRACKER DE MISIONES EN LA BARRA SUPERIOR
    // ========================================================================
    var TRACKER_ID = "fh-custom-quest-tracker";

    function asegurarContenedorTracker() {
        var existing = document.getElementById(TRACKER_ID);
        if (existing) {
            existing.style.display = window.__foeConfig.questTracker ? "flex" : "none";
            return existing;
        }
        var hammerBar = document.getElementById("hammerBar");
        var tracker = document.createElement("div");
        tracker.id = TRACKER_ID;
        tracker.className = "game-cursor barItem";
        tracker.style.cssText = "display:" + (window.__foeConfig.questTracker ? "flex" : "none") + ";align-items:center;gap:6px;padding:0;white-space:nowrap;user-select:none;";
        tracker.innerHTML = "<div style='background:rgba(20,20,20,0.6);border:1px solid rgba(212,175,55,0.4);border-radius:3px;padding:2px 6px;font-size:0.75rem;color:#bbb;'>...</div>";

        if (hammerBar) {
            hammerBar.appendChild(tracker);
        } else {
            tracker.style.position = "fixed";
            tracker.style.top = "2px";
            tracker.style.left = "550px";
            tracker.style.zIndex = "1000";
            document.body.appendChild(tracker);
        }
        return tracker;
    }

    function getShortLabel(desc) {
        var d = (desc || "").toLowerCase();
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
    }

    function procesarQuestTracker(quests) {
        if (!Array.isArray(quests) || !window.__foeConfig.questTracker) return;
        var el = asegurarContenedorTracker();
        if (!el) return;

        var cards = [];
        quests.forEach(function(q) {
            if (!q.windowTitle || q.windowTitle.indexOf("Recurrente") === -1) return;
            var isCollect = (q.state === "collectReward" || q.state === "collect");
            var isAccepted = (q.state === "accepted");
            if (!isCollect && !isAccepted) return;

            var condParts = [];
            var hasAnyDone = false;

            if (q.successConditions) {
                q.successConditions.forEach(function(cond) {
                    var max = cond.maxProgress || 1;
                    var cur = isCollect ? max : (cond.currentProgress || 0);
                    var label = getShortLabel(cond.description);
                    var done = isCollect || (cur >= max);
                    if (done) hasAnyDone = true;
                    var color = done ? "#57ef57" : "#ffcc00";
                    var txt = (done ? "✔ " : "") + label + ": <b style='color:" + color + "'>" + cur.toLocaleString('es-ES') + "/" + max.toLocaleString('es-ES') + "</b>";
                    condParts.push("<span title='" + (cond.description || "").replace(/'/g, "") + "'>" + txt + "</span>");
                });
            }

            if (condParts.length > 0) {
                var boxStyle = (isCollect || hasAnyDone)
                    ? "display:flex;align-items:center;gap:5px;background:rgba(20,80,30,0.7);border:1px solid #2ecc71;border-radius:3px;padding:2px 6px;font-size:0.75rem;color:#7bf388;"
                    : "display:flex;align-items:center;gap:5px;background:rgba(30,24,14,0.7);border:1px solid #c99c37;border-radius:3px;padding:2px 6px;font-size:0.75rem;color:#ffeb9c;";
                var sep = " <span style='color:#e0b84c;font-size:0.7rem;font-weight:bold;'>ó</span> ";
                cards.push("<div style='" + boxStyle + "'>" + condParts.join(sep) + "</div>");
            }
        });

        el.innerHTML = cards.join("");
    }

    // ========================================================================
    // 6. MÓDULO MERCADO (PESOS DE BIENES, ORDENAMIENTO Y RATIO)
    // ========================================================================
    var GOODS_WEIGHTS = {
        // BronzeAge (1)
        wine:1, dye:1, alabaster:1, cypress:1, sandstone:1,
        // IronAge (2)
        gems:2, cloth:2, lead:2, ebony:2, limestone:2,
        // EarlyMiddleAge (4)
        gold:4, honey:4, marble:4, granite:4, bronze:4,
        // HighMiddleAge (8)
        glass:8, salt:8, ropes:8, brick:8, herbs:8,
        // LateMiddleAge (16)
        silk:16, gunpowder:16, brass:16, basalt:16, talc:16,
        // ColonialAge (32)
        tar:32, porcelain:32, wire:32, coffee:32, paper:32,
        // IndustrialAge (64)
        fertilizer:64, whaleoil:64, textiles:64, rubber:64, coke:64,
        // ProgressiveEra (128)
        explosives:128, tinplate:128, machineparts:128, petroleum:128, asbestos:128,
        // ModernEra (256)
        ferroconcrete:256, flavorants:256, luxury_materials:256, packaging:256, convenience_food:256,
        // PostModernEra (512)
        renewable_resources:512, steel:512, semiconductors:512, filters:512, dna_data:512,
        // ContemporaryEra (1024)
        electromagnets:1024, gas:1024, plastics:1024, robots:1024, bionics:1024,
        // TomorrowEra (2048)
        translucent_concrete:2048, smart_materials:2048, papercrete:2048, preservatives:2048, nutrition_research:2048,
        // FutureEra (4096)
        biogeochemical_data:4096, purified_water:4096, algae:4096, superconductors:4096, nanoparticles:4096,
        // ArcticFuture (8192)
        nanowire:8192, transester_gas:8192, ai_data:8192, paper_batteries:8192, bioplastics:8192,
        // OceanicFuture (16384)
        pearls:16384, artificial_scales:16384, corals:16384, biolight:16384, plankton:16384,
        // VirtualFuture (32768)
        tea_silk:32768, data_crystals:32768, golden_rice:32768, nanites:32768, cryptocash:32768,
        // SpaceAgeMars (65536)
        superalloys:65536, biotech_crops:65536, lubricants:65536, mars_microbes:65536, fusion_reactors:65536,
        // SpaceAgeAsteroidBelt (131072)
        bromine:131072, compound_fluid:131072, nickel:131072, platinum_crystals:131072, processed_material:131072,
        // SpaceAgeVenus (262144)
        soy_proteins:262144, microgreen_supplement:262144, herbal_snack:262144, sugar_crystals:262144, glowing_seaweed:262144,
        // SpaceAgeJupiterMoon (524288)
        red_algae:524288, bio_creatures:524288, topological_records:524288, enhanced_porifera:524288, advanced_dna_data:524288,
        // SpaceAgeTitan (1048576)
        compressed_matter_capsule:1048576, isolated_molecules:1048576, experimental_data:1048576, liquid_binder:1048576, upcycled_hydrocarbons:1048576,
        // SpaceAgeSpaceHub (2097152)
        silver_crystals:2097152, dark_energy_battery:2097152, oxygen_pills:2097152, deep_space_data:2097152, hypersleep_modules:2097152,
        // StellarAgeDiscovery (4194304)
        stel_xenocrystals:4194304, stel_glyph_circuits:4194304, stel_metamorphic_alloys:4194304, stel_resonance_cores:4194304, stel_psionic_conduits:4194304
    };

    function procesarOfertasMercado(offers) {
        if (!Array.isArray(offers) || !window.__foeConfig.marketSort) return offers;

        offers.forEach(function(item) {
            var wOffer = GOODS_WEIGHTS[item.offer ? item.offer.good_id : ""] || 1;
            var wNeed = GOODS_WEIGHTS[item.need ? item.need.good_id : ""] || 1;

            var valOffer = (item.offer ? item.offer.value : 0) * wOffer;
            var valNeed = (item.need ? item.need.value : 0) * wNeed;

            var ratio = valNeed > 0 ? (valOffer / valNeed) : 1;
            item._tradeRatio = ratio;

            if (item.merchant && item.merchant.name) {
                if (!item._origMerchantName) {
                    item._origMerchantName = item.merchant.name;
                }

                var pct = Math.round(ratio * 100);
                var badge = "";

                if (ratio >= 1.03) {
                    badge = "🟢 [+" + (pct - 100) + "%]";
                } else if (ratio >= 0.98) {
                    badge = "🟡 [100%]";
                } else {
                    badge = "🔴 [" + pct + "%]";
                }

                item.merchant.name = badge + " " + item._origMerchantName;
            }
        });

        var res = offers;
        if (window.__foeConfig.marketHideUnfair) {
            res = res.filter(function(item) {
                return item._tradeRatio >= 0.98;
            });
        }

        res.sort(function(a, b) {
            return (b._tradeRatio || 0) - (a._tradeRatio || 0);
        });

        return res;
    }

    // ========================================================================
    // 7. INTERCEPTOR XHR CENTRAL UNIFICADO
    // ========================================================================
    if (!window.__foeXhrCentralPatched) {
        window.__foeXhrCentralPatched = true;

        var origResponseText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");
        var origResponse = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response");

        function procesarRespuestaXHR(xhr) {
            if (xhr._foeInterceptedCache !== undefined) return xhr._foeInterceptedCache;

            try {
                var raw = origResponseText.get.call(xhr);
                if (!raw || typeof raw !== "string") return null;

                // Si no contiene ninguno de nuestros servicios objetivo, pasamos de largo
                if (raw.indexOf("QuestService") === -1 && 
                    raw.indexOf("ArmyUnitManagementService") === -1 && 
                    raw.indexOf("TradeService") === -1) {
                    return null;
                }

                var data = JSON.parse(raw);
                if (!Array.isArray(data)) return null;

                var modificado = false;

                data.forEach(function(item) {
                    if (!item || !item.requestClass) return;

                    // Misiones (QuestService -> getUpdates)
                    if (item.requestClass === "QuestService" && item.requestMethod === "getUpdates" && Array.isArray(item.responseData)) {
                        // Limpiar / reducir misiones
                        if (limpiarMisiones(item.responseData)) {
                            modificado = true;
                        }
                        // Actualizar tracker en pantalla
                        procesarQuestTracker(item.responseData);
                    }

                    // Ejército (ArmyUnitManagementService -> getArmyInfo)
                    if (item.requestClass === "ArmyUnitManagementService" && item.requestMethod === "getArmyInfo" && item.responseData) {
                        if (filtrarEjercito(item.responseData)) {
                            modificado = true;
                        }
                    }

                    // Mercado (TradeService -> getTradeOffers)
                    if (item.requestClass === "TradeService" && item.requestMethod === "getTradeOffers" && Array.isArray(item.responseData)) {
                        if (window.__foeConfig.marketSort) {
                            item.responseData = procesarOfertasMercado(item.responseData);
                            modificado = true;
                        }
                    }
                });

                if (modificado) {
                    xhr._foeInterceptedCache = JSON.stringify(data);
                    return xhr._foeInterceptedCache;
                }
            } catch(e) {}

            return null;
        }

        Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
            get: function() {
                var m = procesarRespuestaXHR(this);
                return m !== null ? m : origResponseText.get.call(this);
            },
            configurable: true
        });

        Object.defineProperty(XMLHttpRequest.prototype, "response", {
            get: function() {
                var m = procesarRespuestaXHR(this);
                return m !== null ? m : origResponse.get.call(this);
            },
            configurable: true
        });
    }

    // ========================================================================
    // 8. PANEL DE CONTROL FLOTANTE (ARRASTRABLE Y MODULAR)
    // ========================================================================
    (function construirPanel() {
        var existingPanel = document.getElementById("foe-toolbox-panel");
        if (existingPanel) {
            existingPanel.style.display = "block";
            return;
        }

        var panel = document.createElement("div");
        panel.id = "foe-toolbox-panel";
        panel.style.cssText = "position:fixed;top:70px;right:25px;width:260px;background:rgba(25,20,15,0.95);border:2px solid #a67c38;border-radius:6px;box-shadow:0 4px 15px rgba(0,0,0,0.8);z-index:999999;font-family:sans-serif;color:#f0e2be;font-size:12px;user-select:none;";

        // Header arrastrable
        var header = document.createElement("div");
        header.style.cssText = "background:#3b2d1d;padding:7px 10px;cursor:move;font-weight:bold;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #755523;border-radius:4px 4px 0 0;";
        header.innerHTML = "<span>🛠️ FoE Toolbox</span><span id='foe-panel-close' style='cursor:pointer;font-size:14px;padding:0 4px;'>✖</span>";
        panel.appendChild(header);

        // Movimiento de la ventana
        var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
        header.onmousedown = function(e) {
            e.preventDefault();
            p3 = e.clientX; p4 = e.clientY;
            document.onmouseup = function() { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = function(e) {
                e.preventDefault();
                p1 = p3 - e.clientX; p2 = p4 - e.clientY;
                p3 = e.clientX; p4 = e.clientY;
                panel.style.top = (panel.offsetTop - p2) + "px";
                panel.style.left = (panel.offsetLeft - p1) + "px";
            };
        };

        // Contenedor de opciones
        var body = document.createElement("div");
        body.style.cssText = "padding:10px;display:flex;flex-direction:column;gap:8px;";

        function createOption(id, labelText, checked, onChange) {
            var lbl = document.createElement("label");
            lbl.style.cssText = "display:flex;align-items:center;gap:7px;cursor:pointer;";
            var chk = document.createElement("input");
            chk.type = "checkbox";
            chk.id = id;
            chk.checked = checked;
            chk.addEventListener("change", onChange);
            var span = document.createElement("span");
            span.textContent = labelText;
            lbl.appendChild(chk);
            lbl.appendChild(span);
            return lbl;
        }

        // 1. FP Helper
        body.appendChild(createOption("chk-foe-fp", "Calculadora PFs (GEs)", window.__foeConfig.fpHelper, function(e) {
            window.__foeConfig.fpHelper = e.target.checked;
            localStorage.setItem("foe_fp_helper", e.target.checked ? "1" : "0");
        }));

        // 2. Misiones recurrentes reducidas
        body.appendChild(createOption("chk-foe-quests", "Misiones: Reducir y ocultar", window.__foeConfig.questCleaner, function(e) {
            window.__foeConfig.questCleaner = e.target.checked;
            localStorage.setItem("foe_quest_cleaner", e.target.checked ? "1" : "0");
        }));

        // 3. Tracker de misiones en la barra
        body.appendChild(createOption("chk-foe-tracker", "Tracker de misiones en barra", window.__foeConfig.questTracker, function(e) {
            window.__foeConfig.questTracker = e.target.checked;
            localStorage.setItem("foe_quest_tracker", e.target.checked ? "1" : "0");
            asegurarContenedorTracker();
        }));

        // 4. Filtrar ejército
        body.appendChild(createOption("chk-foe-army", "Ejército: Tipos clave (10 HP)", window.__foeConfig.armyFilter, function(e) {
            window.__foeConfig.armyFilter = e.target.checked;
            localStorage.setItem("foe_army_filter", e.target.checked ? "1" : "0");
        }));

        // Separador para Mercado
        var sep = document.createElement("div");
        sep.style.cssText = "border-top:1px solid #554024;margin-top:2px;padding-top:4px;";
        body.appendChild(sep);

        // 5. Mercado: Priorizar
        body.appendChild(createOption("chk-foe-market", "Mercado: Priorizar y valorar", window.__foeConfig.marketSort, function(e) {
            window.__foeConfig.marketSort = e.target.checked;
            localStorage.setItem("foe_market_sort", e.target.checked ? "1" : "0");
        }));

        // 6. Mercado: Ocultar injustas
        var optHide = createOption("chk-foe-market-hide", "Ocultar injustas (<100%)", window.__foeConfig.marketHideUnfair, function(e) {
            window.__foeConfig.marketHideUnfair = e.target.checked;
            localStorage.setItem("foe_market_hide_unfair", e.target.checked ? "1" : "0");
        });
        optHide.style.marginLeft = "14px";
        body.appendChild(optHide);

        panel.appendChild(body);
        document.body.appendChild(panel);

        document.getElementById("foe-panel-close").onclick = function() {
            panel.style.display = "none";
        };
    })();

    asegurarContenedorTracker();
    window.__foeShowToast("FoE Toolbox cargado con éxito", "#2ecc71");
    console.log("[FoE Toolbox] Todos los módulos activos e inicializados.");
})();