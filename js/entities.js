// js/entities.js
// --- Funciones de dibujado: corazón y escudo ---

function drawHeart(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, heartWidth, heartHeight);

    // Seleccionar spritesheet según el color actual
    let sheet = heartAnimation;                          // rojo (por defecto)
    if (heartColor === '#2018f9ff') sheet = blueAnimation;
    if (heartColor === '#027e02ff') sheet = greenAnimation;

    // Frame 0 en reposo; heartDeathFrame durante la animación de muerte
    const frame = heartDeathAnimating ? heartDeathFrame : 0;

    // Rotar si está en modo azul con gravedad invertida
    if (heartColor === '#2018f9ff' && blueGravityInverted) {
        ctx.translate(heartWidth / 2, heartHeight / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-heartWidth / 2, -heartHeight / 2);
    }

    ctx.drawImage(
        sheet,
        frame * HEART_FRAME_WIDTH, 0,   // recorte del spritesheet
        HEART_FRAME_WIDTH, HEART_FRAME_HEIGHT,
        0, 0,                            // destino en el canvas del corazón
        heartWidth, heartHeight
    );

    ctx.restore();
}

function getShieldAngleFromDir(dir) {
    if (dir === 'up')    return -Math.PI / 2;
    if (dir === 'down')  return  Math.PI / 2;
    if (dir === 'left')  return  Math.PI;
    if (dir === 'right') return  0;
    return 0;
}

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}

function drawShield() {
    if (!lockedCenter || !shieldActive || !shieldDir) return;

    const cx     = x;
    const cy     = y;
    const offset = shieldRadius + 18;

    shieldCurrentAngle   = lerpAngle(shieldCurrentAngle, shieldTargetAngle, shieldLerpSpeed);
    shieldCurrentOffsetX += (shieldTargetOffsetX - shieldCurrentOffsetX) * shieldLerpSpeed;
    shieldCurrentOffsetY += (shieldTargetOffsetY - shieldCurrentOffsetY) * shieldLerpSpeed;

    const shieldCtx = pctx;
    shieldCtx.save();
    shieldCtx.translate(
        cx + Math.cos(shieldCurrentAngle) * offset,
        cy + Math.sin(shieldCurrentAngle) * offset
    );
    shieldCtx.rotate(shieldCurrentAngle + Math.PI / 2);
    shieldCtx.translate(shieldCurrentOffsetX - 25, shieldCurrentOffsetY);

    const arrowLen = shieldArrowLength + 40;
    const arrowW   = 3;

    shieldCtx.beginPath();
    shieldCtx.moveTo(0, 0);
    shieldCtx.lineTo(0,         -arrowW / 2);
    shieldCtx.lineTo(arrowLen,  -arrowW / 2);
    shieldCtx.lineTo(arrowLen,  -arrowW);
    shieldCtx.lineTo(arrowLen + 18, 0);
    shieldCtx.lineTo(arrowLen,   arrowW);
    shieldCtx.lineTo(arrowLen,   arrowW / 2);
    shieldCtx.lineTo(0,          arrowW / 2);
    shieldCtx.closePath();

    shieldCtx.fillStyle   = '#00cfff';
    shieldCtx.shadowColor = '#00cfff';
    shieldCtx.shadowBlur  = 16;
    shieldCtx.globalAlpha = 0.95;
    shieldCtx.fill();
    shieldCtx.globalAlpha = 1;
    shieldCtx.shadowBlur  = 0;
    shieldCtx.restore();
}