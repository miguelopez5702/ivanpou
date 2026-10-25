// ===== MINIJUEGO: ATRAPA LA COMIDA =====
// Mueve a Iván con el dedo, atrapa la comida (+1) y esquiva el IRPF (-3).
// Al terminar devuelve la puntuación (= monedas ganadas).

import { CONFIG } from './config.js';
import { openMinigame, showResult, saveRecord } from './games/ui.js';

const IRPF_SRC = 'assets/irpf.png';
const DURATION = 30;   // segundos de partida
const ITEM_SIZE = 50;  // tamaño de cada objeto que cae

// Pre-cargar imágenes para que no parpadeen al dibujar en el canvas
const foodImages = CONFIG.comidas.map(c => {
  const im = new Image();
  im.src = c.img;
  return im;
});
const irpfImage = new Image();
irpfImage.src = IRPF_SRC;

export function startMinigame(imgSrc, onEnd) {
  const { hud, cv, ctx, W, H, backBtn } = openMinigame();
  const img = new Image();
  img.src = imgSrc;

  const P = 100; // tamaño de Iván
  let x = W / 2, items = [], popups = [], score = 0, spawn = 0;
  let hitFlash = 0; // destello rojo al tocar el IRPF
  let finished = false;
  const t0 = performance.now();
  let last = t0;

  // Motas de polvo ambiental cálidas en el haz de luz de la cocina
  const motes = Array.from({ length: 18 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 2,
    vx: (Math.random() - 0.5) * 12,
    vy: -10 - Math.random() * 15,
    a: 0.15 + Math.random() * 0.35,
  }));

  // Seguir el dedo / ratón en horizontal
  const move = e => {
    const rect = cv.getBoundingClientRect();
    x = Math.max(P / 2, Math.min(W - P / 2, e.clientX - rect.left));
  };
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerdown', move);

  backBtn.onclick = () => end();

  function loop(now) {
    if (finished) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const elapsed = (now - t0) / 1000;
    const left = Math.max(0, DURATION - elapsed);

    // Actualizar motas de polvo flotantes
    motes.forEach(m => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10;
      if (m.x > W + 10) m.x = -10;
    });

    // Generar comida o IRPF (cada vez más rápido)
    if ((spawn -= dt) <= 0) {
      spawn = Math.max(0.28, 0.65 - elapsed / 60);
      const isBad = Math.random() < 0.25;
      items.push({
        x: 30 + Math.random() * (W - 60),
        y: -ITEM_SIZE,
        v: 180 + elapsed * 10,
        rot: (Math.random() - 0.5) * 0.6,
        spin: (Math.random() - 0.5) * 2,
        img: isBad ? irpfImage : foodImages[Math.floor(Math.random() * foodImages.length)],
        isBad,
      });
    }

    // Mover objetos y comprobar si Iván los atrapa
    const py = H - P - 40;
    items = items.filter(it => {
      it.y += it.v * dt;
      it.rot += it.spin * dt;
      const hitY = it.y + ITEM_SIZE / 2 > py + 10 && it.y - ITEM_SIZE / 2 < py + P * 0.8;
      const hitX = Math.abs(it.x - x) < (P + ITEM_SIZE) / 2.4;
      if (hitY && hitX) {
        score = Math.max(0, score + (it.isBad ? -3 : 1));
        popups.push({ x: it.x, y: it.y, text: it.isBad ? '-3 IRPF' : '+1', bad: it.isBad, life: 0.8 });
        if (it.isBad) hitFlash = 0.35;
        navigator.vibrate?.(it.isBad ? 200 : 20);
        return false;
      }
      return it.y < H + 60;
    });

    // ===== RENDERIZADO CON ILUMINACIÓN AMBIENTAL Y PERSPECTIVA =====
    // 1. Pared de cocina con luz cenital cálida
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.65, '#2e1065');
    bg.addColorStop(1, '#431407');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Azulejos suaves tipo metro en la pared
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    for (let gy = 0; gy < H - 52; gy += 24) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      const rowShift = (Math.floor(gy / 24) % 2) * 24;
      for (let gx = rowShift; gx < W; gx += 48) {
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + 24); ctx.stroke();
      }
    }

    // Cono de luz cenital de lámpara de cocina
    const lightBeam = ctx.createRadialGradient(W / 2, 0, 15, W / 2, H * 0.6, W * 0.85);
    lightBeam.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    lightBeam.addColorStop(0.5, 'rgba(251, 146, 60, 0.08)');
    lightBeam.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lightBeam;
    ctx.fillRect(0, 0, W, H);

    // Motas de polvo suspendidas en el haz de luz
    ctx.fillStyle = '#fef08a';
    motes.forEach(m => {
      ctx.globalAlpha = m.a;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 2. Rodapié / zócalo de madera
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, H - 52, W, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, H - 52, W, 2);

    // 3. Suelo de terracota en perspectiva
    const floorGrad = ctx.createLinearGradient(0, H - 42, 0, H);
    floorGrad.addColorStop(0, '#7c2d12');
    floorGrad.addColorStop(1, '#431407');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H - 42, W, 42);

    // Brillo suave sobre el suelo en el centro
    const floorSheen = ctx.createRadialGradient(W / 2, H - 20, 10, W / 2, H - 20, W * 0.5);
    floorSheen.addColorStop(0, 'rgba(254, 215, 170, 0.25)');
    floorSheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floorSheen;
    ctx.fillRect(0, H - 42, W, 42);

    // Objetos que caen (el IRPF lleva un halo rojo para distinguirlo)
    items.forEach(it => {
      if (!it.img.complete) return;
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      if (it.isBad) { ctx.shadowColor = '#ff3b30'; ctx.shadowBlur = 18; }
      ctx.drawImage(it.img, -ITEM_SIZE / 2, -ITEM_SIZE / 2, ITEM_SIZE, ITEM_SIZE);
      ctx.restore();
    });

    // Sombra e imagen de Iván
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, H - 38, P * 0.38, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (img.complete) ctx.drawImage(img, x - P / 2, py, P, P);

    // Textos flotantes de +1 / -3
    popups = popups.filter(p => {
      p.life -= dt;
      p.y -= 50 * dt;
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.bad ? '#ff5a4f' : '#7dff8c';
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
      return p.life > 0;
    });

    // Destello rojo al pillar el IRPF
    if (hitFlash > 0) {
      hitFlash -= dt;
      ctx.fillStyle = `rgba(255,40,40,${hitFlash})`;
      ctx.fillRect(0, 0, W, H);
    }

    hud.innerHTML = `
      <div style="font-size:12px; color:#ffd24c; letter-spacing:1px;">🍗 ATRAPA LA COMIDA · ESQUIVA EL IRPF</div>
      <div style="font-size:22px; font-weight:bold; margin-top:2px;">
        🪙 ${score} &nbsp;|&nbsp; ⏱️ ${Math.ceil(left)}s
      </div>
    `;

    if (left > 0) requestAnimationFrame(loop);
    else end();
  }

  function end() {
    if (finished) return;
    finished = true;
    cv.removeEventListener('pointermove', move);
    cv.removeEventListener('pointerdown', move);
    showResult({
      kicker: 'ATRAPA LA COMIDA',
      title: score > 0 ? '¡Barriga llena! 😋' : 'Hacienda te ha fundido 💸',
      lines: [`Puntuación: <strong>${score}</strong>`],
      coins: score,
      record: saveRecord('food', score),
      onClose: () => onEnd(score),
    });
  }

  requestAnimationFrame(loop);
}
