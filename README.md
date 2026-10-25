# 🧑 Iván Pou

Juego web móvil (HTML5 / CSS3 / Vanilla JS, sin frameworks ni proceso de build) para cuidar, alimentar, asear y jugar con **Iván** en su vida diaria y en su trabajo en **Reymogasa (Alcoa)**. Optimizado para pantallas táctiles móviles y listo para jugar en [GitHub Pages](https://miguelopez5702.github.io/ivanpou/).

---

## 🎮 Características Principales

* **Fidelidad y foto real de Iván**: Iván aparece siempre con su imagen original y nítida ("tal cual"), con físicas reactivas, sombras en perspectiva y expresiones de estado.
* **Perspectiva 3D en todas las habitaciones**:
  * 🍳 **Cocina**: Pared de azulejos tipo metro, estantería rústica con especias, suelo de terracota en espiga, nevera navegable con flechas y tienda de suministros oficiales (Nestea, Cigarros, Gallina, Patatas Vila, Nutella).
  * 🛁 **Baño**: Alicatado cerámico celeste con brillo, espejo cromado biselado, esponja con jabón interactivo y ducha para quitar la carbonilla de Alcoa.
  * 🛏️ **Dormitorio**: Papel pintado azul noche, suelo de tarima de roble, póster de *Rainbow Six Siege: Burela Ops* y modo noche con constelaciones. Incluye la opción de **Farlopa con Chochi**, donde Iván se aparta y Chochi aparece con gafas de sol pidiendo su parte con bocadillo animado.
  * 🕹️ **Juegos**: Loft industrial con letrero de neón animado `🕹️ ALCOA ARCADE ⚡` y suelo de goma con tachones.
* **Sonido Procedimental (Web Audio API)**: Efectos sonoros sintetizados en tiempo real sin necesidad de descargar archivos de audio pesados.

---

## 🕹️ Minijuegos de Alcoa Arcade

1. 👨‍🏭 **Soldador Alcoa**: Simulación de soldadura por electrodo en Reymogasa, control de pulso, velocidad y dictamen de calidad del cordón.
2. 🚀 **Salto de Vigas**: Motor atmosférico por altitud con 4 zonas de ascenso progresivo (interior de nave Alcoa con cerchas metálicas, tejados al atardecer sobre Burela, nubes altas y firmamento cósmico con luna creciente).
3. 🕊️ **Flappy Iván**: Vuelo horizontal entre tuberías y chimeneas industriales con parallax multicapa de 3 niveles, humo procedural y franja de seguridad en movimiento continuo.
4. 🍗 **Atrapa la Comida**: Iván se desplaza recogiendo alimentos al vuelo mientras esquiva el IRPF bajo un foco cenital con motas de polvo ambiental.

---

## 📁 Estructura del Proyecto

```
ivanpou/
├── index.html            # Interfaz principal (Pared, Suelo, Chochi, Iván, HUD)
├── manifest.json         # PWA: ejecución a pantalla completa en dispositivos móviles
├── css/style.css         # Estilos responsive mobile-first, perspectiva 3D y animaciones
├── js/
│   ├── config.js         # Configuración de Iván: frases gallegas, comidas y farlopa
│   ├── state.js          # Persistencia automática en localStorage y desgaste en tiempo real
│   ├── audio.js          # Motor de sintetizador de audio procedimental
│   ├── main.js           # Lógica central, navegación entre estancias y hub de juegos
│   ├── welding.js        # Minijuego de soldadura industrial en Reymogasa
│   ├── minigame.js       # Minijuego: Atrapa la comida y esquiva el IRPF
│   └── games/
│       ├── ui.js         # Lienzo retina unificado, botón salir y tarjetas de récords
│       ├── flappy.js     # Minijuego: Flappy Iván con parallax
│       └── skyjump.js    # Minijuego: Salto de vigas y atmósfera vertical
└── assets/               # Fotos originales de Iván, Chochi y catálogo de productos
```

---

## 🚀 Cómo jugar

### En local (PC o Móvil en red local):
```bash
python -m http.server 8000 --bind 0.0.0.0
```
Abre en tu navegador o en el móvil conectado a la misma red: `http://TU_IP_LOCAL:8000`

### En GitHub Pages:
Activa GitHub Pages en `Settings → Pages → Branch: main / (root)` y accede directamente desde:
**`https://miguelopez5702.github.io/ivanpou/`**
*(Pulsa en el navegador móvil en "Añadir a pantalla de inicio" para jugarlo como app nativa).*
