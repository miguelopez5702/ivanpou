// ===== SISTEMA DE SONIDO PROCEDIMENTAL (WEB AUDIO API) =====
// No requiere archivos MP3 externos. Sintetiza efectos de audio en tiempo real.

let ctx = null;
let isMuted = localStorage.getItem('colega-muted') === 'true';

function getContext() {
  if (!ctx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (AudioClass) ctx = new AudioClass();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isAudioMuted() {
  return isMuted;
}

export function toggleAudioMute() {
  isMuted = !isMuted;
  localStorage.setItem('colega-muted', isMuted);
  return isMuted;
}

// Sonido de bote / resorte al tocar al colega
export function playBoing() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

// Sonido de mordisco / comer
export function playEat() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  // Crujido / mordisco sintetizado
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.12);

  // Segundo toque rápido (ñam ñam)
  setTimeout(() => {
    if (isMuted) return;
    const now2 = c.currentTime;
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(420, now2);
    osc2.frequency.exponentialRampToValueAtTime(280, now2 + 0.09);
    gain2.gain.setValueAtTime(0.25, now2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now2 + 0.1);
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.start(now2);
    osc2.stop(now2 + 0.12);
  }, 100);
}

// Sonido de pompas / frotar jabón
export function playSoap() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  const freq = 600 + Math.random() * 400;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq + 300, now + 0.08);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

// Sonido de agua / ducha
export function playSplash() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  // Ruido blanco filtrado simulando chorro de agua
  const bufferSize = c.sampleRate * 0.15;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.25;

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.linearRampToValueAtTime(1400, now + 0.12);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  noise.start(now);
}

// Sonido de monedas (Bling retro estilo arcade)
export function playCoin() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  const osc1 = c.createOscillator();
  const gain1 = c.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, now); // B5

  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

  osc1.connect(gain1);
  gain1.connect(c.destination);
  osc1.start(now);
  osc1.stop(now + 0.09);

  setTimeout(() => {
    if (isMuted) return;
    const now2 = c.currentTime;
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now2); // E6
    gain2.gain.setValueAtTime(0.3, now2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.28);
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.start(now2);
    osc2.stop(now2 + 0.3);
  }, 75);
}

// Fanfarria de subir de nivel
export function playLevelUp() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }, idx * 110);
  });
}

// Sonido de clic en interfaz
export function playClick() {
  if (isMuted) return;
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}
