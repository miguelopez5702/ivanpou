// ===== MINIJUEGO: SALTO DE VIGAS (SKY JUMP / ESTILO DOODLE POU) =====
// Iván sube saltando por vigas y plataformas metálicas de Alcoa.
// Control táctil: pulsa a la izquierda o derecha de la pantalla para moverlo.

import { openMinigame, showResult, saveRecord } from './ui.js';

export function startSkyJump(imgSrc, onEnd) {
  const { cv, ctx, W, H, backBtn, hud } = openMinigame();

  const img = new Image();
  img.src = imgSrc;

  // Parámetros del jugador
  const P_SIZE = 56;
  let px = W / 2, py = H - 120;
  let vx = 0, vy = -420;
  const GRAVITY = 800;
  const JUMP_POWER = -520;
  const SPRING_POWER = -820;

  let moveDir = 0; // -1: izq, 1: der
  let cameraY = 0;
  let scoreHeight = 0;
  let coinsCollected = 0;
  let gameOver = false;

  // Plataformas (vigas de acero)
  let platforms = [];
  let coins = [];

  // Crear plataforma inicial bajo el jugador
  platforms.push({ x: W / 2 - 45, y: H - 60, w: 90, h: 14, type: 'normal' });

  // Generar plataformas hacia arriba
  let highestPlatY = H - 60;
  function generatePlatformsUpTo(targetY) {
    while (highestPlatY > targetY) {
      highestPlatY -= 65 + Math.random() * 40;
      const w = 70 + Math.random() * 30;
      const x = 10 + Math.random() * (W - w - 20);
      const rand = Math.random();
      const type = rand < 0.25 ? 'moving' : rand < 0.4 ? 'spring' : 'normal';

      platforms.push({
        x, y: highestPlatY, w, h: 14, type,
        vx: type === 'moving' ? (Math.random() < 0.5 ? -60 : 60) : 0,
        hasSpring: type === 'spring',
      });

      // 35% probabilidad de moneda flotante
      if (Math.random() < 0.35) {
        coins.push({ x: x + w / 2, y: highestPlatY - 24, collected: false });
      }
    }
  }

  generatePlatformsUpTo(-H);

  // Controles táctiles
  const onPointerDown = e => {
    moveDir = e.clientX < W / 2 ? -1 : 1;
  };
  const onPointerUp = () => {
    moveDir = 0;
  };

  cv.addEventListener('pointerdown', onPointerDown);
  cv.addEventListener('pointerup', onPointerUp);
  cv.addEventListener('pointercancel', onPointerUp);

  backBtn.onclick = () => {
    gameOver = true;
    endGame();
  };

  let lastTime = performance.now();

  function drawCloud(x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
    ctx.arc(x + s * 0.35, y - s * 0.15, s * 0.35, 0, Math.PI * 2);
    ctx.arc(x + s * 0.7, y, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    if (gameOver) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // Movimiento horizontal
    vx = moveDir * 270;
    px += vx * dt;

    // Envolver pantalla en los bordes
    if (px < -P_SIZE / 2) px = W + P_SIZE / 2;
    if (px > W + P_SIZE / 2) px = -P_SIZE / 2;

    // Física vertical
    vy += GRAVITY * dt;
    py += vy * dt;

    // Mover plataformas móviles
    platforms.forEach(p => {
      if (p.type === 'moving') {
        p.x += p.vx * dt;
        if (p.x < 10 || p.x + p.w > W - 10) p.vx *= -1;
      }
    });

    // Colisión con plataformas (solo al caer, vy > 0)
    if (vy > 0) {
      const feetY = py + P_SIZE / 2;
      platforms.forEach(p => {
        if (
          feetY >= p.y &&
          feetY <= p.y + 18 &&
          px + P_SIZE / 3 >= p.x &&
          px - P_SIZE / 3 <= p.x + p.w
        ) {
          if (p.hasSpring) {
            vy = SPRING_POWER;
            navigator.vibrate?.([20, 20]);
          } else {
            vy = JUMP_POWER;
            navigator.vibrate?.(15);
          }
        }
      });
    }

    // Recoger monedas
    coins.forEach(c => {
      if (!c.collected && Math.hypot(px - c.x, py - c.y) < P_SIZE / 2 + 14) {
        c.collected = true;
        coinsCollected++;
        navigator.vibrate?.(25);
      }
    });

    // Cámara sigue al jugador hacia arriba
    const targetCamY = py - H * 0.55;
    if (targetCamY < cameraY) {
      cameraY = targetCamY;
      scoreHeight = Math.max(scoreHeight, Math.round(-cameraY / 10));
    }

    // Generar más plataformas a medida que sube
    generatePlatformsUpTo(cameraY - H);

    // Limpiar plataformas y monedas muy por debajo
    platforms = platforms.filter(p => p.y < cameraY + H + 80);
    coins = coins.filter(c => c.y < cameraY + H + 80);

    // Caída al vacío (Game Over)
    if (py > cameraY + H + 40) {
      gameOver = true;
      endGame();
      return;
    }

    // ===== RENDERIZADO CON MOTOR ATMOSFÉRICO POR ALTITUD (4 ZONAS) =====
    ctx.clearRect(0, 0, W, H);

    const alt = Math.max(0, -cameraY / 10);

    // 1. Gradiente del cielo interpolado según altitud
    let topCol, botCol;
    if (alt < 60) {
      // Zona 1: Fábrica Alcoa interior (0 - 60m)
      topCol = '#0b0f19';
      botCol = '#1e293b';
    } else if (alt < 150) {
      // Zona 2: Tejados y atardecer industrial sobre Burela (60 - 150m)
      const t = (alt - 60) / 90;
      topCol = t < 0.5 ? '#1e1b4b' : '#312e81';
      botCol = t < 0.5 ? '#b45309' : '#d97706';
    } else if (alt < 270) {
      // Zona 3: Nubes y cielo abierto (150 - 270m)
      topCol = '#0369a1';
      botCol = '#38bdf8';
    } else {
      // Zona 4: Estratosfera / Espacio cósmico (270m+)
      topCol = '#020617';
      botCol = '#0f172a';
    }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, topCol);
    bgGrad.addColorStop(1, botCol);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Parallax Zona 1: Vigas maestras y cerchas metálicas de la nave
    if (alt < 70) {
      const beamAlpha = Math.max(0, 1 - alt / 70);
      ctx.save();
      ctx.globalAlpha = beamAlpha * 0.38;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      const bSpace = 160;
      const bOff = (cameraY * 0.25) % bSpace;
      for (let by = -bSpace + bOff; by < H + bSpace; by += bSpace) {
        ctx.fillRect(0, by, W, 18);
        ctx.strokeRect(0, by, W, 18);
        ctx.beginPath();
        ctx.moveTo(0, by); ctx.lineTo(50, by + 50); ctx.stroke();
        ctx.moveTo(W, by); ctx.lineTo(W - 50, by + 50); ctx.stroke();
      }
      ctx.restore();
    }

    // Parallax Zona 2: Tejados, chimeneas y antenas de Alcoa
    if (alt >= 20 && alt < 170) {
      const roofAlpha = Math.min(1, Math.max(0, alt < 60 ? (alt - 20) / 40 : 1 - (alt - 120) / 50));
      ctx.save();
      ctx.globalAlpha = roofAlpha * 0.42;
      ctx.fillStyle = '#0f172a';
      const roofBaseY = H * 0.7 - (cameraY + 300) * 0.16;
      if (roofBaseY < H + 120) {
        ctx.fillRect(W * 0.15, roofBaseY - 65, 22, 65);
        ctx.fillRect(W * 0.65, roofBaseY - 85, 28, 85);
        ctx.beginPath();
        ctx.moveTo(0, roofBaseY);
        ctx.lineTo(W * 0.35, roofBaseY - 32);
        ctx.lineTo(W * 0.35, roofBaseY);
        ctx.lineTo(W * 0.8, roofBaseY - 26);
        ctx.lineTo(W, roofBaseY);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();
      }
      ctx.restore();
    }

    // Parallax Zona 3: Nubes flotantes
    if (alt >= 110 && alt < 310) {
      const cloudAlpha = Math.min(1, Math.max(0, alt < 160 ? (alt - 110) / 50 : 1 - (alt - 260) / 50));
      ctx.save();
      ctx.globalAlpha = cloudAlpha * 0.32;
      ctx.fillStyle = '#ffffff';
      const cSpace = 180;
      const cOff = (cameraY * 0.4) % cSpace;
      for (let cy = -cSpace + cOff; cy < H + cSpace; cy += cSpace) {
        drawCloud((cy * 1.7) % (W - 80) + 40, cy, 55);
      }
      ctx.restore();
    }

    // Parallax Zona 4: Firmamento estrellado y luna luminosa
    if (alt >= 230) {
      const spaceAlpha = Math.min(1, (alt - 230) / 60);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 73 + 17) % W;
        const sy = (i * 137 + 29) % (H * 0.85);
        const size = (i % 3 === 0) ? 2.5 : 1.5;
        const twinkle = 0.4 + 0.6 * Math.sin(now * 0.003 + i);
        ctx.globalAlpha = spaceAlpha * twinkle;
        ctx.fillRect(sx, sy, size, size);
      }

      ctx.globalAlpha = spaceAlpha * 0.95;
      const moonX = W * 0.8, moonY = 65;
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = topCol;
      ctx.beginPath();
      ctx.arc(moonX - 6, moonY - 4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(0, -cameraY);

    // Dibujar plataformas (vigas de acero)
    platforms.forEach(p => {
      // Viga
      ctx.fillStyle = p.type === 'moving' ? '#f59e0b' : p.type === 'spring' ? '#a855f7' : '#64748b';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Borde metálico
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Remaches
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + 4, p.y + 4, 3, 3);
      ctx.fillRect(p.x + p.w - 7, p.y + 4, 3, 3);

      // Muelle / resorte si tiene
      if (p.hasSpring) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(p.x + p.w / 2 - 8, p.y - 8, 16, 8);
        ctx.strokeStyle = '#ca8a04';
        ctx.strokeRect(p.x + p.w / 2 - 8, p.y - 8, 16, 8);
      }
    });

    // Dibujar monedas
    coins.forEach(c => {
      if (!c.collected) {
        ctx.font = '22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('🪙', c.x, c.y + 7);
      }
    });

    // Dibujar personaje
    if (img.complete) {
      ctx.save();
      // Pequeña inclinación según la dirección del movimiento
      if (moveDir !== 0) {
        ctx.translate(px, py);
        ctx.rotate(moveDir * 0.1);
        ctx.drawImage(img, -P_SIZE / 2, -P_SIZE / 2, P_SIZE, P_SIZE);
      } else {
        ctx.drawImage(img, px - P_SIZE / 2, py - P_SIZE / 2, P_SIZE, P_SIZE);
      }
      ctx.restore();
    }

    ctx.restore();

    // HUD
    hud.innerHTML = `
      <div style="font-size:12px; color:#ffd24c; letter-spacing:1px;">🚀 SALTO DE VIGAS ALCOA</div>
      <div style="font-size:20px; font-weight:bold; margin-top:2px;">
        Altura: <strong>${scoreHeight}m</strong> &nbsp;|&nbsp; 🪙 <strong>${coinsCollected}</strong>
      </div>
      <div style="font-size:11px; opacity:0.85;">Toca Izquierda / Derecha para moverte</div>
    `;

    requestAnimationFrame(loop);
  }

  function endGame() {
    cv.removeEventListener('pointerdown', onPointerDown);
    cv.removeEventListener('pointerup', onPointerUp);
    cv.removeEventListener('pointercancel', onPointerUp);

    const bonusFromHeight = Math.floor(scoreHeight / 25);
    const totalCoins = coinsCollected + bonusFromHeight;

    showResult({
      kicker: 'SALTO DE VIGAS',
      title: scoreHeight >= 100 ? '¡Casi llegas a las chimeneas! 🚀' : '¡Caída libre al suelo! 💥',
      lines: [
        `Altura alcanzada: <strong>${scoreHeight} m</strong>`,
        `Monedas recogidas: <strong>${coinsCollected}</strong> (+${bonusFromHeight} por altura)`
      ],
      coins: totalCoins,
      record: saveRecord('skyjump', scoreHeight),
      onClose: () => onEnd(totalCoins),
    });
  }

  requestAnimationFrame(loop);
}
