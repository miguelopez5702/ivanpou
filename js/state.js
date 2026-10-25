// ===== ESTADO DEL JUEGO Y PERSISTENCIA (GUARDADO DIRECTO SIN USUARIOS) =====
import { CONFIG } from './config.js';

const SAVE_KEY = 'colega-save-v1';
const DECAY = { comida: 0.5, energia: 0.3, diversion: 0.6, higiene: 0.4 };
const SLEEP_GAIN = 3;

export function xpNeeded(nivel) {
  return nivel * 40;
}

function defaults() {
  return {
    stats: { comida: 80, energia: 80, diversion: 80, higiene: 80 },
    monedas: 35,
    nivel: 1,
    xp: 0,
    inventario: { nestea: 2, cigarro: 2, patatasvila: 1 },
    durmiendo: false,
    last: Date.now(),
  };
}

function loadState() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const activeUser = localStorage.getItem('colega-active-user');
      if (activeUser) {
        raw = localStorage.getItem(`colega-save-u_${encodeURIComponent(activeUser.toLowerCase().trim())}`);
      }
    }

    if (raw) {
      const s = JSON.parse(raw);
      const def = defaults();
      // Filtrar inventario para asegurar que solo existan los alimentos oficiales actuales
      const validIds = new Set(CONFIG.comidas.map(c => c.id));
      let cleanInv = {};
      if (s.inventario) {
        for (const k in s.inventario) {
          if (validIds.has(k) && s.inventario[k] > 0) {
            cleanInv[k] = s.inventario[k];
          }
        }
      }
      if (!Object.keys(cleanInv).length) cleanInv = def.inventario;

      return {
        ...def,
        ...s,
        stats: { ...def.stats, ...(s.stats || {}) },
        inventario: cleanInv,
      };
    }
  } catch { /* datos dañados */ }
  return defaults();
}

export const state = loadState();

const clamp = v => Math.max(0, Math.min(100, v));

export function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

// Aplica el desgaste según los minutos transcurridos en tiempo real
export function tick() {
  const now = Date.now();
  const min = (now - state.last) / 60000;
  state.last = now;
  for (const k in DECAY) {
    if (k === 'energia' && state.durmiendo) state.stats[k] = clamp(state.stats[k] + SLEEP_GAIN * min);
    else state.stats[k] = clamp(state.stats[k] - DECAY[k] * min * (state.durmiendo ? 0.5 : 1));
  }
  save();
}

export function change(stat, delta) {
  state.stats[stat] = clamp(state.stats[stat] + delta);
  save();
}

export function addXp(amount) {
  state.xp = (state.xp || 0) + amount;
  let needed = xpNeeded(state.nivel || 1);
  let leveledUp = false;
  let bonusCoins = 0;

  while (state.xp >= needed) {
    state.xp -= needed;
    state.nivel = (state.nivel || 1) + 1;
    needed = xpNeeded(state.nivel);
    leveledUp = true;
    bonusCoins += 15;
    state.monedas = (state.monedas || 0) + 15;
  }

  save();
  return { leveledUp, nivel: state.nivel, bonusCoins };
}

export function mood() {
  if (state.durmiendo) return 'dormido';
  const s = Object.values(state.stats);
  const avg = s.reduce((a, b) => a + b) / s.length;
  // Triste solo si alguna necesidad está en estado crítico (< 15) o la media es muy baja (< 25)
  if (Math.min(...s) < 15 || avg < 25) return 'triste';
  // Por defecto, usa siempre la imagen normal / original
  return 'normal';
}

export function lowestStat() {
  const [k, v] = Object.entries(state.stats).sort((a, b) => a[1] - b[1])[0];
  return v < 20 ? k : null;
}
