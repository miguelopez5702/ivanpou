# 🧑 Mi Colega — un "Pou" con la cara de tu colega

Juego web móvil (HTML/CSS/JS puro, sin build) para cuidar, alimentar, vestir y jugar con tu colega en su vida diaria y en su curro en **Reymogasa (Alcoa)**. Listo para jugar en el móvil y subir a GitHub Pages.

## Estructura
```
Colega-Pou/
├── index.html            # Interfaz principal: HUD, habitaciones, acciones, canvas
├── manifest.json         # PWA: pantalla completa e icono en el móvil
├── css/style.css         # Estilos responsive mobile-first, texturas y animaciones
├── js/
│   ├── config.js         # ⭐ PERSONALIZACIÓN: fotos, frases, comidas, catálogo
│   ├── state.js          # Guardado automático en localStorage y desgaste en tiempo real
│   ├── audio.js          # Motor de sonido procedimental sintetizado (Web Audio API)
│   ├── main.js           # Lógica principal, navegación, nevera y tienda
│   ├── welding.js        # 👨‍🏭 Minijuego: Soldador industrial Reymogasa (Alcoa)
│   └── games/
│       ├── skyjump.js    # 🚀 Minijuego: Salto de vigas (estilo Doodle Pou)
│       ├── penalties.js  # ⚽ Minijuego: Tanda de penaltis
│       ├── flappy.js     # 🕊️ Minijuego: Flappy colega entre chimeneas
│       └── memory.js     # 🧠 Minijuego: Memoria de herramientas de taller
└── assets/colega.svg     # Placeholder → sustituir por la foto del colega
```

## Habitaciones
- 🍳 **Cocina**: Nevera con flechas `◀` y `▶` para ver y arrastrar comida comprada a la boca del colega + Tienda (`🛒`) para comprar suministros.
- 🛁 **Baño**: Arrastra el **jabón 🧼** para frotar espuma y la **ducha 🚿** para rociar agua y limpiar la carbonilla del taller.
- 🛏️ **Dormitorio**: Apaga la luz con la bombilla 🌙 para que descanse y recupere energía con animación de `Zzz`.
- 🕹️ **Juegos**: Hub con 6 minijuegos para ganar monedas y diversión:
  1. 👨‍🏭 **Soldador Alcoa**: Simulación de arco eléctrico, baño de fusión y control de calidad.
  2. 🚀 **Salto de Vigas**: Bota en plataformas y muelles hacia el cielo esquivando el vacío.
  3. ⚽ **Penaltis de Fútbol**: Desliza el dedo desde el balón hacia la portería para marcar goles.
  4. 🕊️ **Flappy Colega**: Vuelo esquivando chimeneas y tuberías industriales.
  5. 🍔 **Atrapa Comida**: Recoge comida al vuelo y esquiva bombas.
  6. 🧠 **Memoria de Taller**: Empareja herramientas de Alcoa contra reloj.
- 👕 **Armario**: Ponle el **Casco de Reymogasa ⛑️**, **Gafas de sol 🕶️**, **Bigote 🥸** o **Gorra 🧢**.

## Poner la cara de tu colega
1. Recorta su foto con fondo transparente (por ejemplo con remove.bg) en formato PNG (~512×512).
2. Guárdala en `assets/` (ej. `colega.png`) y cambia la ruta en `js/config.js`.
3. Opcional: añade variantes para los estados de ánimo: `feliz`, `triste` y `dormido`.

## Probar en local
```bash
python -m http.server 8000 --bind 0.0.0.0
```
Y abre en tu móvil conectado a la misma Wi-Fi: `http://TU_IP_LOCAL:8000`

## Subir a GitHub Pages
1. Sube este directorio a un repositorio en GitHub.
2. Ve a Settings → Pages → Source: Branch `main` / `root` → Save.
3. Abre el enlace generado desde el móvil y pulsa en **"Añadir a pantalla de inicio"** para jugarlo como app nativa.
