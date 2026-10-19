# ⚔️ FoE Toolbox

Mini-extensión modular para Forge of Empires cargada mediante un único Bookmarklet ligero desde GitHub.

---

## 🚀 Características incluidas

1. **Negociaciones GBG:** Configura automáticamente `Negotiation.CONST_Context_GBG = "KK"` de forma fija al arrancar.
2. **Calculadora FP en GE:** Detecta valores de peligro (`danger (XX FP)`) en tablas de Grandes Edificios y calcula la cuota real automáticamente.
3. **Misiones Recurrentes:**
   - Oculta misiones completas no deseadas por su ID (ej. Titán ID `17400`).
   - Compacta las recurrentes cambiando el diálogo extenso por `"Hacked!"` y vaciando `hints`.
   - Elimina condiciones secundarias no deseadas (negociaciones complejas, producciones, etc.).
   - *Activable y desactivable desde el panel.*
4. **Filtro de Ejército (10 HP):**
   - Oculta el 95% de las tropas irrelevantes.
   - Conserva solo unidades clave (`overclock_orbiter`, `harpoon_grenadier`, `abyssal_glider`, `power_dragon`, `rogue`) con salud completa (`currentHitpoints === 10`).
   - *Activable y desactivable desde el panel.*
5. **Contadores de Misión en Barra:** Muestra contadores visuales y compactos de los objetivos de tus misiones recurrentes en la barra superior junto al castillo.
6. **Panel de Control Flotante:**
   - Arrastrable libremente por la pantalla.
   - Botón para minimizar y cerrar.
   - Interruptores (*toggles*) para cada funcionalidad con guardado automático en `localStorage`.
   - **Zona de Mensajes (Log):** Área interactiva para supervisar las acciones del script en tiempo real.

---

## 📂 Estructura de archivos

```text
foe-toolbox/
├── css/
│   └── style.css            # Estilos del panel, botones, contadores de barra y ventana
├── modules/
│   ├── negotiation.js       # Módulo 1: Configuración fija de negociaciones
│   ├── fpCalculator.js      # Módulo 2: Calculadora de PFs en Gran Edificio
│   ├── questCleaner.js      # Módulo 3: Ocultar misiones y recortar recurrentes
│   ├── armyFilter.js        # Módulo 4: Filtro de unidades y 10 HP
│   └── questTracker.js      # Módulo 5: Contadores visuales en la barra superior
├── core/
│   ├── network.js           # Interceptor central único para XMLHttpRequest
│   └── ui.js                # Ventana flotante, arrastre, interruptores y zona de mensajes
├── main.js                  # Punto de entrada orquestador (versión modular)
├── bundle.js                # Versión autocontenida para ejecución directa sin CORS
├── loader.js                # Código fuente del Bookmarklet cargador
└── README.md
```

---

## 🛠️ Cómo ponerlo en marcha con GitHub

1. Sube esta carpeta a un nuevo repositorio en tu GitHub (por ejemplo: `foe-toolbox`).
2. En GitHub entra en: **Settings** -> **Pages** (menú lateral izquierdo).
3. En **Branch**, selecciona `main` (o `master`), carpeta `/ (root)` y pulsa **Save**.
4. En un par de minutos, GitHub te dará tu URL pública, que será:
   `https://TU_USUARIO.github.io/foe-toolbox/bundle.js`
5. Crea un nuevo marcador en tu navegador y ponle como URL:

```javascript
javascript:(function(){var s=document.createElement("script");s.src="https://TU_USUARIO.github.io/foe-toolbox/bundle.js?v="+Date.now();document.head.appendChild(s);})();
```

*(Recuerda sustituir `TU_USUARIO` por tu nombre de usuario en GitHub).*

---

## 💡 Cómo añadir nuevos módulos en el futuro

En `modules/` puedes crear un nuevo archivo (o añadirlo al objeto `modules` en `bundle.js`) siguiendo esta estructura simple:

```javascript
miNuevoModulo: {
  id: "miNuevoModulo",
  name: "Nombre visible en el Panel",
  active: true,
  init: function() {
    // Código al activarse
    UI.log("Mi nuevo módulo activado");
  },
  stop: function() {
    // Código al desactivarse
    UI.log("Mi nuevo módulo desactivado");
  }
}
```

El panel lo detectará y le creará automáticamente su interruptor y guardado de estado.