// ===== UTILIDADES COMUNES DE LOS MINIJUEGOS =====
// Preparación del lienzo a pantalla completa, botón "Salir", pantalla de resultados y récords.

const RECORDS_KEY = 'colega-records-v1';

// Abre la capa del minijuego y devuelve el lienzo listo para dibujar (con soporte retina)
export function openMinigame() {
  const ov = document.getElementById('minigame');
  const hud = document.getElementById('mg-hud');
  const cv = ov.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const backBtn = document.getElementById('mg-back-btn');

  // Limpiar restos de una partida anterior
  ov.querySelector('.mg-result')?.remove();
  hud.innerHTML = '';
  backBtn.hidden = false;
  ov.hidden = false;

  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr; // reasignar el tamaño también resetea la transformación
  ctx.scale(dpr, dpr);

  return { ov, hud, cv, ctx, W, H, backBtn };
}

// Guarda el récord de un juego y devuelve { best, isNew }
export function saveRecord(gameId, score) {
  let records = {};
  try { records = JSON.parse(localStorage.getItem(RECORDS_KEY)) || {}; } catch { /* datos dañados */ }
  const prev = records[gameId] || 0;
  const isNew = score > prev;
  if (isNew) {
    records[gameId] = score;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }
  return { best: Math.max(prev, score), isNew: isNew && prev > 0 };
}

// Muestra la tarjeta de resultados y, al pulsar el botón, cierra el minijuego
export function showResult({ kicker = '', title, lines = [], coins = 0, record = null, onClose }) {
  const ov = document.getElementById('minigame');
  const hud = document.getElementById('mg-hud');
  document.getElementById('mg-back-btn').hidden = true; // evita cerrar dos veces

  const wrap = document.createElement('div');
  wrap.className = 'mg-result';
  wrap.innerHTML = `
    <div class="mg-result-card">
      ${kicker ? `<div class="mg-result-kicker">${kicker}</div>` : ''}
      <div class="mg-result-title">${title}</div>
      ${lines.map(l => `<div class="mg-result-line">${l}</div>`).join('')}
      ${record ? (record.isNew
        ? `<div class="mg-result-record">🏆 ¡NUEVO RÉCORD!</div>`
        : `<div class="mg-result-line" style="font-size:12px; opacity:.6;">Récord: ${record.best}</div>`) : ''}
      <div class="mg-result-coins">+${coins} 🪙</div>
      <button class="mg-result-btn">${coins > 0 ? 'Cobrar y volver' : 'Volver'}</button>
    </div>
  `;
  ov.appendChild(wrap);

  wrap.querySelector('.mg-result-btn').onclick = () => {
    wrap.remove();
    hud.innerHTML = '';
    ov.hidden = true;
    onClose?.();
  };
}
