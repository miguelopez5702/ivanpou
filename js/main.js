// ===== LÓGICA PRINCIPAL: UI, HABITACIONES Y MINIJUEGOS (SIN USUARIOS) =====
import { CONFIG } from './config.js';
import { state, save, tick, change, lowestStat, addXp, xpNeeded } from './state.js';
import { startMinigame } from './minigame.js';
import { startWeldingGame } from './welding.js';
import { startSkyJump } from './games/skyjump.js';
import { startFlappy } from './games/flappy.js';
import {
  playBoing, playEat, playSoap, playSplash, playCoin, playLevelUp, playClick,
  isAudioMuted, toggleAudioMute
} from './audio.js';

const $ = s => document.querySelector(s);
const pick = arr => arr[Math.random() * arr.length | 0];
const charEl = $('#char');
const charWrap = $('#char-wrap');

const STATS = { comida: '🍔', energia: '⚡', diversion: '🎮', higiene: '🧼' };
const QUEJA = { comida: 0, diversion: 1, energia: 2, higiene: 3 };

// Habitaciones disponibles con sus pistas
const ROOMS = {
  cocina:     { icon: '🍳', nombre: 'Cocina',     hint: 'Arrastra comida o pulsa para alimentarlo', render: renderCocina },
  bano:       { icon: '🛁', nombre: 'Baño',       hint: 'Frota el jabón o la ducha para lavarlo', render: renderBano },
  dormitorio: { icon: '🛏️', nombre: 'Dormitorio', hint: 'Apaga la luz para dormir o dale Farlopa', render: renderDormitorio },
  juegos:     { icon: '🕹️', nombre: 'Juegos',     hint: 'Gana monedas en los minijuegos de Alcoa', render: renderJuegos },
};
let room = 'cocina';

// ---------- Utilidades de UI ----------
function say(text, ms = 1900) {
  const b = $('#bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(say.t);
  say.t = setTimeout(() => b.classList.remove('show'), ms);
}

function anim(name) {
  charEl.classList.remove('bounce', 'eat', 'wash');
  void charEl.offsetWidth;
  charEl.classList.add(name);
}

// Iván usa SIEMPRE su foto original y real (assets/ivan.png); solo cierra los ojos al dormir
const currentImg = () => {
  if (state.durmiendo) return CONFIG.imagenes.dormido || CONFIG.imagenes.normal;
  return CONFIG.imagenes.normal;
};

function flashHappy() {
  if (state.durmiendo) return;
  updateHud();
}

// Animación flotante de monedas ganadas (+) o gastadas (-)
function showCoinDelta(delta, x, y) {
  const box = $('#coins-box');
  if (box) {
    box.classList.remove('bump');
    void box.offsetWidth;
    box.classList.add('bump');
  }
  const el = document.createElement('div');
  el.className = `coin-float ${delta < 0 ? 'neg' : ''}`;
  el.textContent = `${delta > 0 ? '+' : ''}${delta} 🪙`;
  if (x != null && y != null) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  } else if (box) {
    const r = box.getBoundingClientRect();
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.bottom + 4}px`;
  }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Otorga XP y muestra banner al subir de nivel
function grantXp(pts) {
  const res = addXp(pts);
  updateHud();
  if (res && res.leveledUp) {
    playLevelUp();
    showLevelBanner(res.nivel, res.bonusCoins);
    showCoinDelta(res.bonusCoins);
  }
}

function showLevelBanner(level, bonus) {
  const banner = document.createElement('div');
  banner.className = 'levelup-banner';
  banner.innerHTML = `⭐ ¡SUBISTE AL NIVEL ${level}! ⭐<div style="font-size:14px; margin-top:4px;">+${bonus} 🪙 Bonificación</div>`;
  document.body.appendChild(banner);
  flashHappy();
  say(pick(CONFIG.frases.levelup));
  setTimeout(() => banner.remove(), 2600);
}

function updateZzz() {
  const zzzWrap = $('#zzz-wrap');
  if (!zzzWrap) return;
  if (!state.durmiendo) {
    zzzWrap.innerHTML = '';
    return;
  }
  if (!zzzWrap.children.length) {
    for (let i = 0; i < 3; i++) {
      const z = document.createElement('div');
      z.className = 'zzz-char';
      z.textContent = 'Z';
      z.style.animationDelay = `${i * 0.8}s`;
      zzzWrap.appendChild(z);
    }
  }
}

function updateHud() {
  for (const k in STATS) {
    const v = state.stats[k], bar = $(`#bar-${k}`);
    if (bar) {
      bar.style.width = v + '%';
      bar.style.background = v < 25 ? 'var(--bad)' : v < 50 ? 'var(--mid)' : 'var(--good)';
      bar.closest('.stat')?.classList.toggle('low', v < 25);
    }
  }
  $('#coins').textContent = state.monedas;

  const lvlEl = $('#level-num');
  if (lvlEl) lvlEl.textContent = state.nivel || 1;

  // Mini barra de progreso de experiencia hacia el siguiente nivel
  const xpFill = $('#xp-fill');
  if (xpFill) {
    const needed = xpNeeded(state.nivel || 1);
    const pct = Math.min(100, Math.round(((state.xp || 0) / needed) * 100));
    xpFill.style.width = pct + '%';
  }

  const audioBtn = $('#btn-audio');
  if (audioBtn) audioBtn.textContent = isAudioMuted() ? '🔇' : '🔊';

  // Manchas de suciedad / taller de Alcoa según higiene
  const dirtEl = $('#char-dirt');
  if (dirtEl) {
    const h = state.stats.higiene;
    dirtEl.style.opacity = h < 55 ? Math.min(0.9, (55 - h) / 45) : '0';
  }

  // Puntos de alerta en la botonera si alguna necesidad está en estado crítico (< 25)
  $('#nav button[data-room=cocina]')?.classList.toggle('alert', state.stats.comida < 25);
  $('#nav button[data-room=bano]')?.classList.toggle('alert', state.stats.higiene < 25);
  $('#nav button[data-room=dormitorio]')?.classList.toggle('alert', state.stats.energia < 25);
  $('#nav button[data-room=juegos]')?.classList.toggle('alert', state.stats.diversion < 25);

  updateZzz();

  const src = currentImg();
  if (!charEl.src.endsWith(src)) charEl.src = src;
  document.body.classList.toggle('dark', state.durmiendo);
}

// Comprueba si unas coordenadas caen sobre el colega
function isOverChar(x, y) {
  const r = charEl.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function spawnParticle(emoji, x, y) {
  const p = document.createElement('div');
  p.className = 'fx-particle';
  p.textContent = emoji;
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 700);
}

// Sistema para arrastrar comida / esponja / farlopa al colega
function makeDraggable(btnEl, { icon, isImg = false, onOver, onDrop, onClick }) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let ghost = null;

  function onPointerDown(e) {
    if (state.durmiendo && !isImg) return say(pick(CONFIG.frases.dormir));
    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (!isDragging && dist > 10) {
      isDragging = true;
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      if (isImg) {
        const im = document.createElement('img');
        im.src = icon;
        ghost.appendChild(im);
      } else {
        ghost.textContent = icon;
      }
      document.body.appendChild(ghost);
    }

    if (isDragging && ghost) {
      ghost.style.left = `${e.clientX}px`;
      ghost.style.top = `${e.clientY}px`;

      const over = isOverChar(e.clientX, e.clientY);
      charWrap.classList.toggle('target-active', over);
      if (over && onOver) onOver(e.clientX, e.clientY);
    }
  }

  function onPointerUp(e) {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    charWrap.classList.remove('target-active');

    if (isDragging) {
      if (ghost) { ghost.remove(); ghost = null; }
      const over = isOverChar(e.clientX, e.clientY);
      if (onDrop) onDrop(e.clientX, e.clientY, over);
      isDragging = false;
    } else {
      if (onClick) onClick();
    }
  }

  btnEl.addEventListener('pointerdown', onPointerDown);
}

// ---------- Habitaciones y Decoración Temática ----------
let currentFoodIdx = 0;

// Actualiza los elementos decorativos temáticos de cada estancia (póster R6, estante, espejo, neón)
function updateRoomDecor(r) {
  const decor = $('#room-decor');
  if (!decor) return;
  if (r === 'cocina') {
    decor.innerHTML = `
      <div class="kitchen-shelf">
        <span class="shelf-item" style="left:12px;">🧂</span>
        <span class="shelf-item" style="left:50px;">🫙</span>
        <span class="shelf-item" style="left:88px;">🍶</span>
        <div class="shelf-board"></div>
      </div>
    `;
  } else if (r === 'bano') {
    decor.innerHTML = `
      <div class="bath-mirror">
        <div class="mirror-sheen"></div>
      </div>
    `;
  } else if (r === 'dormitorio') {
    decor.innerHTML = `
      <div class="r6-poster">
        <div class="r6-tape-l"></div>
        <div class="r6-tape-r"></div>
        <div class="r6-badge">6</div>
        <div class="r6-title">SIEGE</div>
        <div class="r6-sub">BURELA OPS</div>
      </div>
    `;
  } else if (r === 'juegos') {
    decor.innerHTML = `
      <div class="gaming-neon">
        <span class="neon-text">🕹️ ALCOA ARCADE ⚡</span>
      </div>
    `;
  } else {
    decor.innerHTML = '';
  }
}

function setRoom(r) {
  if (state.durmiendo && r !== 'dormitorio') { state.durmiendo = false; save(); }
  charWrap.classList.remove('guest');
  const cw = $('#chochi-wrap');
  if (cw) {
    cw.classList.remove('active');
    $('#chochi-bubble')?.classList.remove('show');
  }
  room = r;
  document.body.dataset.room = r;
  $('#room-name').textContent = ROOMS[r].nombre;
  updateRoomDecor(r);

  // Pista de uso de la habitación
  let hintEl = document.querySelector('.room-hint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'room-hint';
    $('#room').appendChild(hintEl);
  }
  hintEl.textContent = ROOMS[r].hint || '';

  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.room === r));
  const el = $('#actions');
  el.innerHTML = '';
  ROOMS[r].render(el);
  updateHud();
}

function getOwnedFoods() {
  const list = [];
  for (const item of CONFIG.comidas) {
    const qty = state.inventario?.[item.id] || 0;
    if (qty > 0) list.push({ ...item, qty });
  }
  return list;
}

// Habitación: Cocina (Nevera con flechas y tienda)
function renderCocina(el) {
  el.innerHTML = '';
  const ownedFoods = getOwnedFoods();
  const bar = document.createElement('div');
  bar.className = 'fridge-bar';

  if (ownedFoods.length === 0) {
    bar.innerHTML = `
      <button class="nav-arrow" disabled>◀</button>
      <div class="food-plate-wrap">
        <div class="act empty-fridge" id="empty-fridge-btn">
          <span>🧊</span>
          <small>Nevera vacía</small>
        </div>
      </div>
      <button class="nav-arrow" disabled>▶</button>
      <button class="btn-shop" id="open-shop-btn">🛒<small>Tienda</small></button>
    `;
    bar.querySelector('#open-shop-btn').onclick = openShopModal;
    bar.querySelector('#empty-fridge-btn').onclick = openShopModal;
    el.append(bar);
    return;
  }

  if (currentFoodIdx >= ownedFoods.length) currentFoodIdx = 0;
  if (currentFoodIdx < 0) currentFoodIdx = ownedFoods.length - 1;
  const currentFood = ownedFoods[currentFoodIdx];

  bar.innerHTML = `
    <button class="nav-arrow" id="food-prev">◀</button>
    <div class="food-plate-wrap">
      <div class="act" id="active-food-btn">
        <img class="food-thumb" src="${currentFood.img}" alt="${currentFood.nombre}">
        <span class="food-badge">x${currentFood.qty}</span>
        <small>${currentFood.nombre}</small>
      </div>
    </div>
    <button class="nav-arrow" id="food-next">▶</button>
    <button class="btn-shop" id="open-shop-btn">🛒<small>Tienda</small></button>
  `;

  bar.querySelector('#food-prev').onclick = () => {
    playClick();
    currentFoodIdx--;
    renderCocina(el);
  };
  bar.querySelector('#food-next').onclick = () => {
    playClick();
    currentFoodIdx++;
    renderCocina(el);
  };
  bar.querySelector('#open-shop-btn').onclick = () => {
    playClick();
    openShopModal();
  };

  const foodBtn = bar.querySelector('#active-food-btn');
  const feed = (x, y) => {
    if (state.stats.comida >= 100) return say(pick(CONFIG.frases.lleno));
    const stock = state.inventario?.[currentFood.id] || 0;
    if (stock <= 0) return say('¡Se ha terminado! Compra más 🛒');

    state.inventario[currentFood.id]--;
    if (state.inventario[currentFood.id] <= 0) {
      delete state.inventario[currentFood.id];
    }
    save();

    change('comida', currentFood.valor);
    if (currentFood.diversion) change('diversion', currentFood.diversion);

    playEat();
    grantXp(8);
    anim('eat');
    flashHappy();
    say(pick(CONFIG.frases.comer));

    if (x && y) {
      spawnParticle('✨', x, y);
      spawnParticle('😋', x, y);
    }
    navigator.vibrate?.(40);
    updateHud();
    renderCocina(el);
  };

  makeDraggable(foodBtn, {
    icon: currentFood.img,
    isImg: true,
    onDrop: (x, y, isOver) => {
      if (isOver) feed(x, y);
    },
    onClick: () => {
      const r = charEl.getBoundingClientRect();
      feed(r.left + r.width / 2, r.top + r.height / 2);
    }
  });

  el.append(bar);
}

// Menú / Modal para comprar comida con monedas
function openShopModal() {
  document.querySelector('.modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>🛒 Tienda de Comida</h3>
        <span class="shop-coins">🪙 <span id="shop-coins-val">${state.monedas}</span></span>
        <button class="modal-close" id="shop-close-btn">✖</button>
      </div>
      <div class="shop-list" id="shop-items-container"></div>
    </div>
  `;

  const listEl = overlay.querySelector('#shop-items-container');

  const updateShopList = () => {
    overlay.querySelector('#shop-coins-val').textContent = state.monedas;
    listEl.innerHTML = '';
    CONFIG.comidas.forEach(item => {
      const owned = state.inventario?.[item.id] || 0;
      const canBuy = state.monedas >= item.precio;

      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <img class="shop-thumb" src="${item.img}" alt="${item.nombre}">
        <div class="shop-info">
          <strong>${item.nombre}</strong>
          <small>+${item.valor} comida${item.diversion ? ` · +${item.diversion} diversión` : ''}</small>
          <span class="owned">${owned > 0 ? `En nevera: ${owned}` : 'No tienes'}</span>
        </div>
        <button class="btn-buy" ${!canBuy ? 'disabled' : ''}>${item.precio}🪙 Comprar</button>
      `;

      row.querySelector('.btn-buy').onclick = (e) => {
        if (state.monedas < item.precio) {
          say(pick(CONFIG.frases.pobre));
          return;
        }
        state.monedas -= item.precio;
        if (!state.inventario) state.inventario = {};
        state.inventario[item.id] = (state.inventario[item.id] || 0) + 1;
        save();
        playCoin();
        showCoinDelta(-item.precio, e.clientX, e.clientY);
        grantXp(2);
        updateHud();
        updateShopList();
        navigator.vibrate?.(25);
        if (room === 'cocina') renderCocina($('#actions'));
      };

      listEl.appendChild(row);
    });
  };

  updateShopList();

  const close = () => {
    playClick();
    overlay.remove();
    if (room === 'cocina') renderCocina($('#actions'));
  };

  overlay.querySelector('#shop-close-btn').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  document.body.appendChild(overlay);
}

// Habitación: Baño
function renderBano(el) {
  let lastScrub = 0;

  // Jabón
  const btnSoap = document.createElement('button');
  btnSoap.className = 'act';
  btnSoap.innerHTML = '🧼<small>Jabón</small>';

  makeDraggable(btnSoap, {
    icon: '🧼',
    onOver: (x, y) => {
      const now = performance.now();
      if (now - lastScrub > 130) {
        lastScrub = now;
        spawnParticle('🫧', x, y);
        change('higiene', 1.8);
        playSoap();
        grantXp(1);
        anim('wash');
        updateHud();
        navigator.vibrate?.(15);
      }
    },
    onDrop: (x, y, isOver) => {
      if (isOver) say(pick(CONFIG.frases.ducha));
    },
    onClick: () => {
      change('higiene', 25);
      playSoap();
      grantXp(4);
      anim('wash');
      say(pick(CONFIG.frases.ducha));
      updateHud();
    }
  });

  // Ducha
  const btnShower = document.createElement('button');
  btnShower.className = 'act';
  btnShower.innerHTML = '🚿<small>Ducha</small>';

  makeDraggable(btnShower, {
    icon: '🚿',
    onOver: (x, y) => {
      const now = performance.now();
      if (now - lastScrub > 120) {
        lastScrub = now;
        spawnParticle('💧', x, y);
        change('higiene', 2.8);
        playSplash();
        grantXp(1);
        updateHud();
        navigator.vibrate?.(20);
      }
    },
    onDrop: (x, y, isOver) => {
      if (isOver) {
        flashHappy();
        say(pick(CONFIG.frases.ducha));
      }
    },
    onClick: () => {
      change('higiene', 35);
      playSplash();
      grantXp(5);
      anim('wash');
      flashHappy();
      say(pick(CONFIG.frases.ducha));
      updateHud();
    }
  });

  el.append(btnSoap, btnShower);
}

// Habitación: Dormitorio (Dormir normal o Farlopa para energía 100% inmediata)
function renderDormitorio(el) {
  // 1. Botón de Luz / Dormir clásico
  const bSleep = document.createElement('button');
  bSleep.className = 'act';
  bSleep.innerHTML = state.durmiendo ? '💡<small>Encender</small>' : '🌙<small>Apagar</small>';
  bSleep.onclick = () => {
    state.durmiendo = !state.durmiendo;
    save();
    playClick();
    if (state.durmiendo) {
      say(pick(CONFIG.frases.dormir));
      grantXp(5);
    }
    setRoom('dormitorio');
  };

  // 2. Opción de pago: Farlopa (Recupera energía al instante)
  const bFarlopa = document.createElement('button');
  bFarlopa.className = 'act act-farlopa';
  bFarlopa.innerHTML = `
    <img class="food-thumb" src="${CONFIG.farlopa.img}" alt="Farlopa">
    <small>Farlopa (${CONFIG.farlopa.precio}🪙)</small>
    <span class="farlopa-tag">⚡ 100% Energía</span>
  `;

  const takeFarlopa = (x, y) => {
    if (state.stats.energia >= 100) return say(pick(CONFIG.frases.farlopa));
    if (state.monedas < CONFIG.farlopa.precio) return say(pick(CONFIG.frases.pobre));

    state.monedas -= CONFIG.farlopa.precio;
    state.stats.energia = 100;
    state.durmiendo = false;
    save();

    playCoin();
    showCoinDelta(-CONFIG.farlopa.precio);
    grantXp(15);
    bSleep.innerHTML = '🌙<small>Apagar</small>';
    updateHud();

    // Partículas eléctricas de energía
    if (x && y) {
      spawnParticle('⚡', x, y);
      spawnParticle('🔥', x - 15, y + 10);
      spawnParticle('⚡', x + 15, y - 10);
    } else {
      const r = charEl.getBoundingClientRect();
      spawnParticle('⚡', r.left + r.width / 2, r.top + r.height / 2);
      spawnParticle('🔥', r.left + r.width / 2 + 15, r.top + r.height / 2);
    }

    // Escena cómica con Chochi asomando al lado de Iván
    const chochiWrap = $('#chochi-wrap');
    const chochiBubble = $('#chochi-bubble');

    if (chochiWrap && chochiBubble) {
      // 1. Iván se desplaza un poco a la derecha y Chochi asoma desde atrás
      charWrap.classList.add('guest');
      chochiWrap.classList.add('active');
      setTimeout(() => {
        chochiBubble.textContent = 'Venga dame un poco';
        chochiBubble.classList.add('show');
        navigator.vibrate?.(35);
      }, 400);

      // 2. Iván reacciona con subidón de energía y le contesta tajante
      setTimeout(() => {
        chochiBubble.classList.remove('show');

        charEl.classList.remove('bounce', 'eat', 'wash', 'euphoria');
        void charEl.offsetWidth;
        charEl.classList.add('euphoria');

        say('Vete a tomar por culo', 2600);
        playLevelUp();
        navigator.vibrate?.([80, 40, 100, 40, 140]);
      }, 2000);

      // 3. Chochi huye / se retira e Iván vuelve al centro
      setTimeout(() => {
        chochiWrap.classList.remove('active');
        charWrap.classList.remove('guest');
      }, 3600);
    } else {
      charEl.classList.remove('bounce', 'eat', 'wash', 'euphoria');
      void charEl.offsetWidth;
      charEl.classList.add('euphoria');
      say(pick(CONFIG.frases.farlopa), 2400);
    }
  };

  makeDraggable(bFarlopa, {
    icon: CONFIG.farlopa.img,
    isImg: true,
    onDrop: (x, y, isOver) => {
      if (isOver) takeFarlopa(x, y);
    },
    onClick: () => {
      takeFarlopa();
    }
  });

  el.append(bSleep, bFarlopa);
}

// Catálogo de todos los minijuegos disponibles
const MINIGAMES = [
  {
    id: 'welding',
    icon: '👨‍🏭',
    title: 'Soldador Alcoa',
    desc: 'Reymogasa · Junta biselada',
    reward: '🪙 hasta +30',
    energyCost: 15,
    launch: () => startWeldingGame((coins, quality) => {
      state.monedas += coins;
      showCoinDelta(+coins);
      change('diversion', 30);
      change('energia', -15);
      change('higiene', -15);
      grantXp(25);
      playCoin();
      flashHappy();
      say(quality >= 85 ? CONFIG.frases.soldar[0] : CONFIG.frases.soldar[1]);
      updateHud();
      if (room === 'juegos') renderJuegos($('#actions'));
    }),
  },
  {
    id: 'skyjump',
    icon: '🚀',
    title: 'Salto de Vigas',
    desc: 'Estilo Doodle Pou · Salta al cielo',
    reward: '🪙 según altura',
    energyCost: 10,
    launch: () => startSkyJump(CONFIG.imagenes.normal, coins => {
      state.monedas += coins;
      showCoinDelta(+coins);
      change('diversion', 25);
      change('energia', -10);
      grantXp(18);
      playCoin();
      flashHappy();
      say(`¡+${coins} 🪙 recogidas en las vigas!`);
      updateHud();
      if (room === 'juegos') renderJuegos($('#actions'));
    }),
  },
  {
    id: 'flappy',
    icon: '🕊️',
    title: 'Flappy Colega',
    desc: 'Vuelo entre chimeneas de Alcoa',
    reward: '🪙 +2 por tubería',
    energyCost: 10,
    launch: () => startFlappy(CONFIG.imagenes.normal, coins => {
      state.monedas += coins;
      showCoinDelta(+coins);
      change('diversion', 25);
      change('energia', -10);
      grantXp(15);
      playCoin();
      flashHappy();
      say(`¡+${coins} 🪙 en el vuelo! 🕊️`);
      updateHud();
      if (room === 'juegos') renderJuegos($('#actions'));
    }),
  },
  {
    id: 'food',
    icon: '🍗',
    title: 'Atrapa Comida',
    desc: 'Esquiva el IRPF y come rápido',
    reward: '🪙 +1 por comida',
    energyCost: 10,
    launch: () => startMinigame(CONFIG.imagenes.normal, coins => {
      state.monedas += coins;
      showCoinDelta(+coins);
      change('diversion', 25);
      change('energia', -10);
      grantXp(15);
      playCoin();
      flashHappy();
      say(`¡+${coins} 🪙!`);
      updateHud();
      if (room === 'juegos') renderJuegos($('#actions'));
    }),
  },
];

// Habitación: Juegos (Hub de Minijuegos con récords)
function renderJuegos(el) {
  el.innerHTML = '';
  const hub = document.createElement('div');
  hub.className = 'games-hub';

  let records = {};
  try { records = JSON.parse(localStorage.getItem('colega-records-v1')) || {}; } catch { /* ignore */ }

  MINIGAMES.forEach(game => {
    const hasEnergy = state.stats.energia >= game.energyCost;
    const best = records[game.id];

    const card = document.createElement('div');
    card.className = `game-card ${!hasEnergy ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="game-card-icon">${game.icon}</div>
      <div class="game-card-info">
        <strong>${game.title}</strong>
        <small>${game.desc}</small>
        <div class="game-card-meta">
          <span class="game-card-reward">${game.reward}</span>
          <span class="game-card-cost">⚡ -${game.energyCost}</span>
          ${best ? `<span style="color:#777; font-size:9.5px;">🏆 ${best}</span>` : ''}
        </div>
      </div>
    `;

    card.onclick = () => {
      playClick();
      if (state.stats.energia < game.energyCost) {
        return say(pick(CONFIG.frases.sinEnergia));
      }
      game.launch();
    };

    hub.appendChild(card);
  });

  el.appendChild(hub);
}

// ---------- Interacción táctil con el personaje ----------
charEl.addEventListener('click', () => {
  if (state.durmiendo) return say(pick(CONFIG.frases.dormir));
  change('diversion', 2);
  anim('bounce');
  flashHappy();
  playBoing();
  grantXp(1);
  say(pick(CONFIG.frases.tocar));
  navigator.vibrate?.(30);
  updateHud();
});

// ---------- Inicio ----------
function init() {
  document.title = `Mi ${CONFIG.nombre}`;
  $('#stats').innerHTML = Object.entries(STATS)
    .map(([k, i]) => `<div class="stat">${i}<div class="bar"><i id="bar-${k}"></i></div></div>`).join('');
  $('#nav').innerHTML = Object.entries(ROOMS)
    .map(([k, r]) => `<button data-room="${k}">${r.icon}</button>`).join('');
  $('#nav').onclick = e => {
    const r = e.target.closest('button')?.dataset.room;
    if (r) {
      playClick();
      setRoom(r);
    }
  };

  const audioBtn = $('#btn-audio');
  if (audioBtn) {
    audioBtn.onclick = () => {
      toggleAudioMute();
      updateHud();
    };
  }

  tick();
  setRoom(room);

  // Bucle de juego: actualiza desgaste cada 5s y se queja si algo baja mucho
  setInterval(() => {
    tick();
    updateHud();
    const low = lowestStat();
    if (low && !state.durmiendo && Math.random() < 0.3) say(CONFIG.frases.quejas[QUEJA[low]]);
  }, 5000);

  // Guardar al minimizar la app en el móvil
  document.addEventListener('visibilitychange', () => document.hidden ? save() : (tick(), updateHud()));
}

init();
