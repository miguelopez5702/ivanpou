// ===== MINIJUEGO: SOLDADOR INDUSTRIAL REYMOGASA (ALCOA) =====
// Simulación realista de soldadura en tubería/chapa industrial.
// Incluye baño de fusión, aguas del cordón, lluvia de chispas, careta fotosensible y sonido procedural.

import { openMinigame, showResult, saveRecord } from './games/ui.js';

export function startWeldingGame(onEnd) {
  const { cv, ctx, W, H, backBtn, hud } = openMinigame();

  // Audio sintético del arco eléctrico (Web Audio API sin dependencias)
  let audioCtx = null;
  let noiseNode = null;
  let humOsc = null;
  let gainNode = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioClass) return;
      audioCtx = new AudioClass();

      // Ruido blanco filtrado para el chisporroteo del arco
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }
      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      // Filtro pasa-banda para dar textura metálica al arco
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.2;

      // Zumbido eléctrico de 100 Hz (frecuencia de arco de corriente alterna)
      humOsc = audioCtx.createOscillator();
      humOsc.type = 'sawtooth';
      humOsc.frequency.value = 100;

      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;

      const humGain = audioCtx.createGain();
      humGain.gain.value = 0.15;

      noiseNode.connect(filter);
      filter.connect(gainNode);
      humOsc.connect(humGain);
      humGain.connect(gainNode);

      gainNode.connect(audioCtx.destination);
      noiseNode.start();
      humOsc.start();
    } catch { /* Audio no disponible */ }
  }

  function setArcSound(active) {
    if (!gainNode || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    gainNode.gain.setTargetAtTime(active ? 0.35 : 0, audioCtx.currentTime, 0.04);
  }

  // Dimensiones de la junta de soldadura (tubo/plancha industrial)
  const seamY = H * 0.52;
  const startX = 40;
  const endX = W - 40;
  const seamLength = endX - startX;

  // Estado del minijuego
  let isDown = false;
  let pointerX = startX, pointerY = seamY;
  let lastX = startX, lastY = seamY;
  let lastMoveTime = performance.now();
  let progressX = startX; // hasta dónde se ha completado el cordón
  let qualitySamples = []; // historial de calidad por tramo
  let sparks = [];
  let weldBeads = []; // escamas depositadas del cordón
  let finished = false;
  let heatWarn = '';

  // Parámetros de velocidad de soldeo (píxeles por segundo)
  const OPTIMAL_SPEED_MIN = 35;
  const OPTIMAL_SPEED_MAX = 85;

  const onPointerDown = e => {
    initAudio();
    isDown = true;
    pointerX = e.clientX;
    pointerY = e.clientY;
    lastX = pointerX;
    lastY = pointerY;
    lastMoveTime = performance.now();
    setArcSound(true);
  };

  const onPointerMove = e => {
    if (!isDown) return;
    pointerX = e.clientX;
    pointerY = e.clientY;
  };

  const onPointerUp = () => {
    isDown = false;
    setArcSound(false);
  };

  cv.addEventListener('pointerdown', onPointerDown);
  cv.addEventListener('pointermove', onPointerMove);
  cv.addEventListener('pointerup', onPointerUp);
  cv.addEventListener('pointercancel', onPointerUp);

  if (backBtn) {
    backBtn.onclick = () => {
      finished = true;
      setArcSound(false);
      const avg = qualitySamples.length ? Math.round(qualitySamples.reduce((a, b) => a + b, 0) / qualitySamples.length) : 60;
      endMinigame(avg);
    };
  }

  let lastFrame = performance.now();

  function loop(now) {
    if (finished) return;
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;

    // Distancia a la junta de soldadura
    const distToSeam = Math.hypot(pointerY - seamY, Math.max(0, pointerX - progressX));
    const isWeldingOnSeam = isDown && Math.abs(pointerY - seamY) < 32 && pointerX >= progressX - 15 && pointerX <= endX;

    let currentSpeed = 0;
    if (isWeldingOnSeam) {
      const dx = pointerX - lastX;
      const elapsed = Math.max(0.016, (now - lastMoveTime) / 1000);
      currentSpeed = Math.max(0, dx / elapsed);

      lastX = pointerX;
      lastY = pointerY;
      lastMoveTime = now;

      // Evaluar calidad según velocidad y alineación
      let speedScore = 100;
      if (currentSpeed < OPTIMAL_SPEED_MIN) {
        speedScore = Math.max(20, (currentSpeed / OPTIMAL_SPEED_MIN) * 80);
        heatWarn = '⚠️ ¡Demasiado lento! Exceso de calor';
      } else if (currentSpeed > OPTIMAL_SPEED_MAX) {
        speedScore = Math.max(20, 100 - (currentSpeed - OPTIMAL_SPEED_MAX) * 1.2);
        heatWarn = '⚠️ ¡Demasiado rápido! Falta penetración';
      } else {
        speedScore = 100;
        heatWarn = '✨ Velocidad y baño de fusión perfectos';
      }

      const alignmentScore = Math.max(0, 100 - Math.abs(pointerY - seamY) * 3);
      const segmentQuality = (speedScore * 0.6 + alignmentScore * 0.4);

      // Avanzar en la junta
      if (pointerX > progressX && pointerX <= endX) {
        const step = pointerX - progressX;
        progressX = pointerX;
        qualitySamples.push(segmentQuality);

        // Depositar escama del cordón de soldadura ("aguas")
        weldBeads.push({
          x: pointerX,
          y: seamY + (Math.random() - 0.5) * 2,
          radius: 12 + (segmentQuality > 70 ? 2 : -2),
          time: now,
          quality: segmentQuality,
        });

        // Vibración háptica en móvil
        if (Math.random() < 0.25) navigator.vibrate?.(15);
      }

      // Generar chispas ardientes incandescentes
      const sparkCount = Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < sparkCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const speed = 120 + Math.random() * 260;
        sparks.push({
          x: pointerX,
          y: seamY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.2 + Math.random() * 0.4,
          maxLife: 0.5,
          color: Math.random() < 0.3 ? '#ffffff' : Math.random() < 0.7 ? '#ffe87c' : '#ff5500',
        });
      }
    } else {
      heatWarn = isDown ? '⚠️ ¡Fuera del bisel de la junta!' : 'Presiona sobre la junta para encender el arco';
    }

    // Actualizar chispas
    sparks = sparks.filter(s => {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 480 * dt; // gravedad
      return s.life > 0;
    });

    // ===== RENDERIZADO =====
    // 1. Fondo de taller industrial Alcoa (chapa metálica biselada)
    const isArc = isWeldingOnSeam;
    // Si hay arco, efecto de oscurecimiento automático de la careta de soldar
    ctx.fillStyle = isArc ? '#05120e' : '#1a1f24';
    ctx.fillRect(0, 0, W, H);

    // Chapa superior e inferior con textura de acero
    ctx.fillStyle = isArc ? '#0f241d' : '#2d3748';
    ctx.fillRect(0, 0, W, seamY - 14);
    ctx.fillRect(0, 0, W, seamY - 14);

    ctx.fillStyle = isArc ? '#0c1d18' : '#232b38';
    ctx.fillRect(0, seamY + 14, W, H - (seamY + 14));

    // Bisel de la junta (ranura donde se deposita el cordón)
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(startX - 10, seamY - 10, seamLength + 20, 20);

    // Línea guía del bisel pendiente de soldar
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(progressX, seamY);
    ctx.lineTo(endX, seamY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Cordón de soldadura depositado con sus "aguas" y enfriamiento
    weldBeads.forEach(b => {
      const age = (now - b.time) / 1000;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

      if (age < 0.3) {
        ctx.fillStyle = '#ffffff'; // Al rojo blanco instantáneo
      } else if (age < 0.9) {
        ctx.fillStyle = '#ff7a18'; // Naranja brillante
      } else if (age < 2.0) {
        ctx.fillStyle = '#8b2500'; // Rojo enfriándose
      } else {
        // Acabado metálico con escamas características
        ctx.fillStyle = b.quality > 70 ? '#5a6978' : '#3c444d';
      }
      ctx.fill();

      // Relieve de la escama
      ctx.strokeStyle = '#2b323c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 3. Baño de fusión y resplandor del arco eléctrico
    if (isArc) {
      // Halo de luz del arco
      const grad = ctx.createRadialGradient(pointerX, seamY, 4, pointerX, seamY, 140);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.15, 'rgba(160, 240, 255, 0.6)');
      grad.addColorStop(0.5, 'rgba(40, 180, 120, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pointerX, seamY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo del arco incandescente
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pointerX, seamY, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Lluvia de chispas
    sparks.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Antorcha / Pinza de soldar (soplete)
    if (isDown) {
      ctx.save();
      ctx.translate(pointerX, pointerY);
      ctx.strokeStyle = '#c0c0c0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(25, -55);
      ctx.stroke();

      // Tobera cerámica / punta
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(-4, -8, 8, 12);
      ctx.restore();
    }

    // 6. HUD superior del minijuego
    const progressPct = Math.min(100, Math.round(((progressX - startX) / seamLength) * 100));
    const avgQuality = qualitySamples.length
      ? Math.round(qualitySamples.reduce((a, b) => a + b, 0) / qualitySamples.length)
      : 100;

    hud.innerHTML = `
      <div style="font-size:12px; letter-spacing:1px; color:#ffcc00; margin-bottom:2px;">
        🏭 REYMOGASA · CONTRATA ALCOA
      </div>
      <div style="font-size:16px; margin-bottom:4px;">
        Cordón: <strong>${progressPct}%</strong> &nbsp;|&nbsp; Calidad: <strong>${avgQuality}%</strong>
      </div>
      <div style="font-size:12px; color:${isArc ? '#85e89d' : '#e0e0e0'};">
        ${heatWarn}
      </div>
    `;

    // Comprobar si se ha completado todo el cordón
    if (progressX >= endX - 5 && !finished) {
      finished = true;
      setArcSound(false);
      setTimeout(() => endMinigame(avgQuality), 600);
      return;
    }

    requestAnimationFrame(loop);
  }

  function endMinigame(finalQuality) {
    cv.removeEventListener('pointerdown', onPointerDown);
    cv.removeEventListener('pointermove', onPointerMove);
    cv.removeEventListener('pointerup', onPointerUp);
    cv.removeEventListener('pointercancel', onPointerUp);

    // Calcular monedas ganadas por el trabajo en Reymogasa
    // Cordón homologado (>75%) = 25 a 35 monedas
    const coinsEarned = Math.max(5, Math.round((finalQuality / 100) * 30));

    // Mostrar veredicto de inspección industrial
    const verdict = finalQuality >= 85
      ? '¡HOMOLOGADO POR CONTROL DE CALIDAD! 🩻✨'
      : finalQuality >= 65
      ? '¡Aprobado para servicio industrial! 👍'
      : '⚠️ Cordón con porosidades, pero te pagan las horas.';

    showResult({
      kicker: 'REYMOGASA · INSPECCIÓN ALCOA',
      title: verdict,
      lines: [
        `Calidad del cordón: <strong>${finalQuality}%</strong>`,
        `Avance de la junta: <strong>${Math.min(100, Math.round(((progressX - startX) / seamLength) * 100))}%</strong>`
      ],
      coins: coinsEarned,
      record: saveRecord('welding', finalQuality),
      onClose: () => {
        if (audioCtx) {
          try { audioCtx.close(); } catch { /* ignore */ }
        }
        onEnd(coinsEarned, finalQuality);
      }
    });
  }

  requestAnimationFrame(loop);
}
