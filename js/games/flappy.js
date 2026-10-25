// ===== MINIJUEGO: FLAPPY COLEGA (VUELO EN ALCOA) =====
// Toca la pantalla para aletear y esquivar chimeneas y tuberías industriales.

import { openMinigame, showResult, saveRecord } from './ui.js';

export function startFlappy(imgSrc, onEnd) {
  const { cv, ctx, W, H, backBtn, hud } = openMinigame();

  const img = new Image();
  img.src = imgSrc;

  // Personaje
  const P_SIZE = 52;
  const px = W * 0.28;
  let py = H * 0.45;
  let vy = 0;
  const GRAVITY = 720;
  const FLAP_FORCE = -300;

  // Tuberías / Chimeneas
  const PIPE_WIDTH = 68;
  const PIPE_GAP = 165;
  const PIPE_SPEED = 145;
  let pipes = [];
  let score = 0;
  let gameOver = false;
  let started = false;

  function addPipe(x) {
    const minTop = 60;
    const maxTop = H - PIPE_GAP - 100;
    const topH = minTop + Math.random() * (maxTop - minTop);
    pipes.push({
      x,
      topH,
      bottomY: topH + PIPE_GAP,
      passed: false,
    });
  }

  addPipe(W + 60);
  addPipe(W + 60 + W * 0.65);

  const flap = () => {
    if (gameOver) return;
    started = true;
    vy = FLAP_FORCE;
    navigator.vibrate?.(15);
  };

  cv.addEventListener('pointerdown', flap);
  backBtn.onclick = () => {
    gameOver = true;
    endFlappy();
  };

  let lastTime = performance.now();
  let worldX = 0;

  function drawFluffyCloud(x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
    ctx.arc(x + s * 0.35, y - s * 0.15, s * 0.35, 0, Math.PI * 2);
    ctx.arc(x + s * 0.7, y, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSmokePuffs(sx, sy, now, seed) {
    for (let s = 0; s < 3; s++) {
      const t = ((now * 0.0012 + s * 0.4 + seed) % 1.2);
      const px = sx - t * 26 + Math.sin(now * 0.0025 + seed + s) * 6;
      const py = sy - t * 22;
      const r = 5 + t * 9;
      const a = Math.max(0, (1 - t / 1.2) * 0.35);
      ctx.fillStyle = `rgba(241, 245, 249, ${a})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    if (gameOver) return;
    const dt = Math.min(0.04, (now - lastTime) / 1000);
    lastTime = now;

    const scrollSpeed = started ? PIPE_SPEED : 32;
    worldX += scrollSpeed * dt;

    if (started) {
      vy += GRAVITY * dt;
      py += vy * dt;

      // Mover tuberías
      pipes.forEach(p => {
        p.x -= PIPE_SPEED * dt;

        // Puntuación al pasar
        if (!p.passed && p.x + PIPE_WIDTH < px) {
          p.passed = true;
          score++;
          navigator.vibrate?.([20, 20]);
        }

        // Colisión con tubería
        const inPipeX = px + P_SIZE * 0.38 > p.x && px - P_SIZE * 0.38 < p.x + PIPE_WIDTH;
        if (inPipeX) {
          if (py - P_SIZE * 0.38 < p.topH || py + P_SIZE * 0.38 > p.bottomY) {
            triggerGameOver();
          }
        }
      });

      // Añadir nuevas tuberías
      if (pipes[pipes.length - 1].x < W - W * 0.65) {
        addPipe(W + 40);
      }

      // Eliminar tuberías que salieron
      pipes = pipes.filter(p => p.x + PIPE_WIDTH > -20);

      // Colisión con techo o suelo
      if (py > H - 35 || py < -20) {
        triggerGameOver();
      }
    } else {
      // Flotación suave previa al inicio
      py = H * 0.45 + Math.sin(now / 300) * 12;
    }

    // ===== RENDERIZADO CON PARALLAX MULTICAPA =====
    ctx.clearRect(0, 0, W, H);

    // 1. Cielo crepuscular industrial sobre el Cantábrico
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.4, '#1e293b');
    skyGrad.addColorStop(0.68, '#b45309');
    skyGrad.addColorStop(0.82, '#f59e0b');
    skyGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sol crepuscular difuso
    const sunGrad = ctx.createRadialGradient(W * 0.72, H * 0.68, 5, W * 0.72, H * 0.68, 48);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
    sunGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.4)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.68, 48, 0, Math.PI * 2);
    ctx.fill();

    // 2. Capa lejana (Parallax 0.08x - 0.12x): Nubes y colinas costeras de Burela
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    const c1 = (W + 80) - ((worldX * 0.06) % (W + 160));
    const c2 = (W + 80) - (((worldX * 0.06) + W * 0.55) % (W + 160));
    drawFluffyCloud(c1, 55, 55);
    drawFluffyCloud(c2, 85, 42);

    // Colinas lejanas
    const hillOff = (worldX * 0.12) % W;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, H - 30);
    for (let hx = 0; hx <= W; hx += 24) {
      const hy = H - 85 - Math.sin((hx + hillOff) * 0.012) * 26 - Math.cos((hx + hillOff) * 0.026) * 12;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(W, H - 30);
    ctx.lineTo(0, H - 30);
    ctx.closePath();
    ctx.fill();

    // 3. Capa media (Parallax 0.35x): Complejo industrial Alcoa (silos, grúas y chimeneas con humo)
    const modW = 340;
    const startX = -((worldX * 0.35) % modW);
    for (let mx = startX - modW; mx < W + modW; mx += modW) {
      // Silo de alúmina (cilindro con cúpula)
      const siloX = mx + 25;
      const siloH = 110;
      const siloY = H - 30 - siloH;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(siloX, siloY + 12, 48, siloH - 12);
      ctx.beginPath();
      ctx.arc(siloX + 24, siloY + 14, 24, Math.PI, 0);
      ctx.fill();

      // Nave industrial / cubierta
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(mx + 85, H - 95, 75, 65);
      // Lucernario / dientes de sierra
      ctx.beginPath();
      ctx.moveTo(mx + 85, H - 95);
      ctx.lineTo(mx + 115, H - 112);
      ctx.lineTo(mx + 115, H - 95);
      ctx.lineTo(mx + 145, H - 112);
      ctx.lineTo(mx + 145, H - 95);
      ctx.lineTo(mx + 160, H - 95);
      ctx.fill();

      // Chimenea 1 con bandas de aviso rojas y blancas
      const ch1X = mx + 185;
      const ch1H = 160;
      const ch1Y = H - 30 - ch1H;
      ctx.fillStyle = '#334155';
      ctx.fillRect(ch1X, ch1Y, 20, ch1H);
      // Bandas rojas
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ch1X, ch1Y + 10, 20, 16);
      ctx.fillRect(ch1X, ch1Y + 42, 20, 16);
      ctx.fillRect(ch1X, ch1Y + 74, 20, 16);
      // Bocanadas de humo animadas
      drawSmokePuffs(ch1X + 10, ch1Y, now, 0.2);

      // Grúa de pórtico / celosía de acero
      const craneX = mx + 225;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(craneX, H - 30);
      ctx.lineTo(craneX + 18, H - 120);
      ctx.lineTo(craneX + 36, H - 30);
      ctx.moveTo(craneX + 18, H - 120);
      ctx.lineTo(craneX + 70, H - 120);
      ctx.stroke();

      // Chimenea 2 más fina
      const ch2X = mx + 295;
      const ch2H = 135;
      const ch2Y = H - 30 - ch2H;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(ch2X, ch2Y, 14, ch2H);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ch2X, ch2Y + 8, 14, 12);
      ctx.fillRect(ch2X, ch2Y + 32, 14, 12);
      drawSmokePuffs(ch2X + 7, ch2Y, now, 0.8);
    }

    // Tuberías de fábrica
    pipes.forEach(p => {
      // Sombra proyectada
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(p.x + 6, 0, PIPE_WIDTH, p.topH);
      ctx.fillRect(p.x + 6, p.bottomY, PIPE_WIDTH, H - p.bottomY);

      // Tubería superior
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(p.x, 0, 8, p.topH); // brillo
      // Remate superior
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(p.x - 4, p.topH - 22, PIPE_WIDTH + 8, 22);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(p.x - 4, p.topH - 22, 6, 22);

      // Tubería inferior
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, H - p.bottomY);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(p.x, p.bottomY, 8, H - p.bottomY);
      // Remate inferior
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 22);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(p.x - 4, p.bottomY, 6, 22);
    });

    // 4. Suelo industrial con franja de peligro móvil (Parallax 1.0x)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, H - 30, W, 30);
    // Franja de peligro amarilla/negra inclinada en movimiento continuo
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H - 30, W, 8);
    ctx.clip();
    const stripeOff = worldX % 20;
    for (let sx = -stripeOff - 20; sx < W + 20; sx += 20) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(sx, H - 30);
      ctx.lineTo(sx + 10, H - 30);
      ctx.lineTo(sx + 4, H - 22);
      ctx.lineTo(sx - 6, H - 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(sx + 10, H - 30);
      ctx.lineTo(sx + 20, H - 30);
      ctx.lineTo(sx + 14, H - 22);
      ctx.lineTo(sx + 4, H - 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Personaje con ligera rotación según velocidad vertical
    ctx.save();
    ctx.translate(px, py);
    const rot = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, vy / 450));
    ctx.rotate(rot);
    if (img.complete) {
      ctx.drawImage(img, -P_SIZE / 2, -P_SIZE / 2, P_SIZE, P_SIZE);
    }
    ctx.restore();

    // HUD
    hud.innerHTML = `
      <div style="font-size:12px; color:#ffd24c; letter-spacing:1px;">🕊️ FLAPPY COLEGA EN ALCOA</div>
      <div style="font-size:24px; font-weight:bold; margin-top:2px;">
        Puntuación: <strong>${score}</strong>
      </div>
      <div style="font-size:12px; opacity:0.85;">
        ${started ? '¡Toca la pantalla para aletear!' : '¡TOCA PARA VOLAR!'}
      </div>
    `;

    requestAnimationFrame(loop);
  }

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    navigator.vibrate?.([100, 50, 100]);
    setTimeout(endFlappy, 350);
  }

  function endFlappy() {
    cv.removeEventListener('pointerdown', flap);
    const coinsEarned = score * 2 + (score >= 5 ? 5 : 0);
    showResult({
      kicker: 'FLAPPY COLEGA',
      title: score > 0 ? '¡Buen vuelo por Alcoa! 🕊️' : '¡Hostia contra la tubería! 💥',
      lines: [`Tuberías superadas: <strong>${score}</strong>`],
      coins: coinsEarned,
      record: saveRecord('flappy', score),
      onClose: () => onEnd(coinsEarned),
    });
  }

  requestAnimationFrame(loop);
}
