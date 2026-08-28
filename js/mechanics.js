// js/mechanics.js
// --- Lógica de juego: vida, física, proyectiles, cajas, plataformas, bucle principal ---

// ─── Barra de vida ───────────────────────────────────────────────────────────
function updateLifeBar() {
    lifeBar.style.width = (life / maxLife * 100) + '%';
    lifeLabel.textContent = life + ' / ' + maxLife;
}

// ─── Barra de stamina ─────────────────────────────────────────────────────────
function updateStaminaBar() {
    const container = document.getElementById('stamina-bar-container');
    const fill = document.getElementById('stamina-bar-fill');
    const text = document.getElementById('stamina-text');
    if (!container || !fill || !text) return;

    const pct = stamina / maxStamina * 100;
    fill.style.width = pct + '%';
    text.textContent = Math.floor(stamina) + ' / ' + maxStamina;

    // Mostrar solo si stamina < 99%, fade out en 100%
    if (stamina >= maxStamina * 0.99) {
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
    } else {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
}

// ─── Escudo: dirección objetivo ──────────────────────────────────────────────
function setShieldTarget(dir) {
    if (dir === 'up') {
        shieldTargetAngle = -Math.PI / 2;
    } else if (dir === 'down') {
        shieldTargetAngle = Math.PI / 2;
    } else if (dir === 'left') {
        shieldTargetAngle = Math.PI;
    } else if (dir === 'right') {
        shieldTargetAngle = 0;
    }
    shieldTargetOffsetX = shieldSpriteOffsetX;
    shieldTargetOffsetY = shieldSpriteOffsetY;
}

// ─── Canvas de proyectiles ───────────────────────────────────────────────────
function resizeProjectileCanvas() {
    projectileCanvas.width  = window.innerWidth;
    projectileCanvas.height = window.innerHeight;
    pctx.imageSmoothingEnabled = false;
}

// ─── Barra de vida: posición ─────────────────────────────────────────────────
function setLifeBarPosition(escudo) {
    const lifeBarContainer = document.getElementById('life-bar-container');
    if (escudo) {
        lifeBarContainer.style.left      = 'auto';
        lifeBarContainer.style.right     = '40px';
        lifeBarContainer.style.transform = 'none';
    } else {
        lifeBarContainer.style.left      = '50%';
        lifeBarContainer.style.right     = 'auto';
        lifeBarContainer.style.transform = 'translateX(-50%)';
    }
}

// ─── Corazón: actualizar posición del canvas ─────────────────────────────────
function updateHeart() {
    canvas.style.left = (x - heartWidth / 2)  + 'px';
    canvas.style.top  = (y - heartHeight / 2) + 'px';
}

// ─── Colisión punto–corazón ───────────────────────────────────────────────────
function checkCollision(px, py) {
    const r        = 6;
    const left     = x - heartWidth  / 2;
    const right    = x + heartWidth  / 2;
    const top      = y - heartHeight / 2;
    const bottom   = y + heartHeight / 2;
    const closestX = Math.max(left, Math.min(px, right));
    const closestY = Math.max(top,  Math.min(py, bottom));
    const dx = px - closestX;
    const dy = py - closestY;
    return (dx * dx + dy * dy) < r * r;   // FIX: era dxdx / dydy
}

// ─── Cuadro verde / morado ───────────────────────────────────────────────────
function startGreenBoxAnimation(size = greenBoxFinalSize, mode = "green") {
    greenBoxActive   = true;
    greenBoxAnimating = true;
    greenBoxAnimSpeed = greenBoxCompressSpeed;
    greenBox.x  = 0;
    greenBox.y  = 0;
    greenBox.w  = window.innerWidth;
    greenBox.h  = window.innerHeight;
    greenBox.tw = (window.innerWidth  - size) / 2;
    greenBox.th = (window.innerHeight - size) / 2;
    greenBox.tx = size;
    greenBox.ty = size;
    boxMode = mode;
    if (boxShrinkSound) { boxShrinkSound.currentTime = 0; boxShrinkSound.play(); }
}

function closeGreenBoxAnimation() {
    greenBoxAnimating = true;
    greenBoxAnimSpeed = greenBoxDecompressSpeed;
    greenBox.tw = 0;
    greenBox.th = 0;
    greenBox.tx = window.innerWidth;
    greenBox.ty = window.innerHeight;
    boxMode = "green";
}

// ─── Cuadro blanco ────────────────────────────────────────────────────────────
function startWhiteBoxAnimation(size = whiteBoxFinalSize) {
    whiteBoxActive   = true;
    whiteBoxAnimating = true;
    greenBoxActive   = true;
    greenBoxAnimating = true;
    greenBoxAnimSpeed = whiteBoxCompressSpeed;
    greenBox.x  = 0;
    greenBox.y  = 0;
    greenBox.w  = window.innerWidth;
    greenBox.h  = window.innerHeight;
    greenBox.tw = (window.innerWidth  - size) / 2;
    greenBox.th = (window.innerHeight - size) / 2;
    greenBox.tx = size;
    greenBox.ty = size;
    boxMode = "white";
    if (boxShrinkSound) { boxShrinkSound.currentTime = 0; boxShrinkSound.play(); }
}

function closeWhiteBoxAnimation() {
    whiteBoxAnimating = true;
    greenBoxAnimating = true;
    greenBoxAnimSpeed = whiteBoxDecompressSpeed;
    greenBox.tw = 0;
    greenBox.th = 0;
    greenBox.tx = window.innerWidth;
    greenBox.ty = window.innerHeight;
    whiteBoxActive = false;
}

function updateGreenBox() {
    if (!greenBoxActive) return;
    if (greenBoxAnimating) {
        greenBox.x += (greenBox.tw - greenBox.x) * greenBoxAnimSpeed;
        greenBox.y += (greenBox.th - greenBox.y) * greenBoxAnimSpeed;
        greenBox.w += (greenBox.tx - greenBox.w) * greenBoxAnimSpeed;
        greenBox.h += (greenBox.ty - greenBox.h) * greenBoxAnimSpeed;
        if (
            Math.abs(greenBox.x - greenBox.tw) < 1 &&
            Math.abs(greenBox.y - greenBox.th) < 1 &&
            Math.abs(greenBox.w - greenBox.tx) < 1 &&
            Math.abs(greenBox.h - greenBox.ty) < 1
        ) {
            greenBox.x = greenBox.tw;
            greenBox.y = greenBox.th;
            greenBox.w = greenBox.tx;
            greenBox.h = greenBox.ty;
            if (greenBox.tw === 0 && greenBox.th === 0) {
                greenBoxActive = false;
                whiteBoxActive = false;
            }
            greenBoxAnimating  = false;
            whiteBoxAnimating  = false;
        }
    }
}

function drawGreenBox() {
    if (!greenBoxActive) return;
    pctx.save();
    if      (boxMode === "green")  { pctx.strokeStyle = '#00ff00'; pctx.shadowColor = '#00ff00'; }
    else if (boxMode === "white")  { pctx.strokeStyle = '#ffffff'; pctx.shadowColor = '#ffffff'; }
    else                           { pctx.strokeStyle = '#a020f0'; pctx.shadowColor = '#a020f0'; }
    pctx.lineWidth  = 1;
    pctx.shadowBlur = 16;
    pctx.strokeRect(greenBox.x, greenBox.y, greenBox.w, greenBox.h);
    pctx.shadowBlur = 0;
    pctx.restore();
}

function clampToGreenBox() {
    if (!greenBoxActive) return;
    const minX = Math.ceil (greenBox.x + heartWidth  / 2);
    const maxX = Math.floor(greenBox.x + greenBox.w - heartWidth  / 2);
    const minY = Math.ceil (greenBox.y + heartHeight / 2);
    const maxY = Math.floor(greenBox.y + greenBox.h - heartHeight / 2);
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    updateHeart();
}

// ─── Plataformas ─────────────────────────────────────────────────────────────
function drawPlatforms() {
    pctx.save();
    pctx.fillStyle = '#888';
    platforms.forEach(pl => pctx.fillRect(pl.x, pl.y, pl.w, pl.h));
    pctx.restore();
}

function isOnAnyPlatform() {
    if (y >= window.innerHeight - heartHeight / 2 - 1) return true;
    if (greenBoxActive && Math.abs(y - (greenBox.y + greenBox.h - heartHeight / 2)) < 2) return true;
    for (let pl of platforms) {
        if (
            x + heartWidth  / 2 > pl.x &&
            x - heartWidth  / 2 < pl.x + pl.w &&
            Math.abs(y + heartHeight / 2 - pl.y) < 2
        ) return true;
    }
    return false;
}

// ─── Hueso pixelado ──────────────────────────────────────────────────────────
// Cuadrícula del hueso (X = píxel relleno). Extremos anchos + cuerpo delgado.
const BONE_GRID = [
    "............",
    "XXX......XXX",
    ".XXXXXXXXXX.",
    ".XXXXXXXXXX.",
    "XXX......XXX",
    "............",
];
const BONE_PIXEL = 3; // tamaño de cada celda en px

function drawPixelBone(ctx, cx, cy, angle, color, glowColor) {
    const cols = BONE_GRID[0].length;
    const rows = BONE_GRID.length;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (BONE_GRID[r][c] === 'X') {
                ctx.rect((c - cols / 2) * BONE_PIXEL, (r - rows / 2) * BONE_PIXEL, BONE_PIXEL, BONE_PIXEL);
            }
        }
    }
    ctx.fillStyle   = color;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 12;
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();
}

// ─── Proyectiles (usando AttackManager) ──────────────────────────────────────
function updateProjectiles(dt = 1) {
    pctx.clearRect(0, 0, projectileCanvas.width, projectileCanvas.height);

    // Actualizar y renderizar todos los ataques vía AttackManager
    if (window.attackManager) {
        window.attackManager.update(dt);
        window.attackManager.render(pctx);
    }

    // Mantener compatibilidad con blasters (sistema separado por ahora)
    drawShield();
}

// ─── Muerte ──────────────────────────────────────────────────────────────────
function triggerDeath() {
    if (deathSound) {
        deathSound.currentTime = 0;
        deathSound.play().catch(e => console.log("Error al reproducir audio:", e));
    }
    broken             = true;
    heartDeathAnimating = true;
    heartDeathFrame    = 0;
    heartLastFrameTime = performance.now();
    shieldActive       = false;
    lockedCenter       = false;
    projectiles        = [];
    if (window.attackManager) window.attackManager.clear();
    setTimeout(resetGame, 4000);
    if (greenBoxActive) closeGreenBoxAnimation();
}

// ─── Reset del juego ─────────────────────────────────────────────────────────
function resetGame() {
    life                      = maxLife;
    broken                    = false;
    heartDeathFrame           = 0;
    heartDeathAnimating       = false;
    heartVisible              = true;
    deathParticles            = [];
    deathAnimationFinishedTime = 0;
    projectiles               = [];
    if (window.attackManager) window.attackManager.clear();
    updateLifeBar();
    x            = window.innerWidth  / 2;
    y            = window.innerHeight / 2;
    heartColor   = '#ff0000';
    shieldActive = false;
    lockedCenter = false;
    setLifeBarPosition(false);
    blueJumpHeld = false;
    blueJumpKeyDown = false;
}

// ─── Partículas de muerte ─────────────────────────────────────────────────────
function spawnDeathParticles() {
    deathParticles = [];
    let color = '#ff0000';
    if (heartColor === '#2018f9ff') color = '#2018f9';
    if (heartColor === '#027e02ff') color = '#00ff00';
    
    for (let i = 0; i < particleCount; i++) {
        // 1. Elegimos un ángulo completamente aleatorio en radianes (0 a 360 grados)
        const explosionAngle = Math.random() * Math.PI * 2;
        
        // 2. Definimos la fuerza o velocidad inicial de la explosión
        // Puedes subir el 6 para que salgan más rápido o el 2 para aumentar la velocidad mínima
        const force = 2 + Math.random() * 6; 

        deathParticles.push({
            x:       x,
            y:       y,
            // 3. Usamos trigonometría para descomponer la fuerza en los ejes X e Y
            vx:      Math.cos(explosionAngle) * force,
            vy:      Math.sin(explosionAngle) * force,
            
            gravity: 0.15 + Math.random() * 0.15, // La gravedad se mantiene igual
            size:    3 + Math.random() * 3, 
            color:   color,
            alpha:   1,
            angle:   Math.random() * Math.PI * 2,           
            rotSpeed: (Math.random() - 0.5) * 0.15          
        });
    }
}

function updateDeathParticles() {
    let alive = [];
    for (let p of deathParticles) {
        p.vy += p.gravity;
        p.x  += p.vx;
        p.y  += p.vy;
        
        // Actualizar el ángulo de rotación según su velocidad angular
        p.angle += p.rotSpeed; 
        
        p.alpha -= 0.01;
        if (p.alpha > 0) alive.push(p);
    }
    deathParticles = alive;
}

function drawDeathParticles() {
    for (let p of deathParticles) {
        pctx.save();
        pctx.globalAlpha = p.alpha;
        pctx.fillStyle   = p.color;

        // 1. Trasladar el origen del contexto al centro de la partícula
        pctx.translate(p.x, p.y);
        
        // 2. Rotar el contexto el ángulo actual de la partícula
        pctx.rotate(p.angle);

        // 3. Dibujar el rombo (Rhombus) centrado en (0,0)
        // Puedes ajustar la esbeltez modificando los multiplicadores (ej. p.size * 0.6)
        const halfWidth = p.size * 0.6; 
        const halfHeight = p.size;

        pctx.beginPath();
        pctx.moveTo(0, -halfHeight);          // Vértice Superior
        pctx.lineTo(halfWidth, 0);            // Vértice Derecho
        pctx.lineTo(0, halfHeight);           // Vértice Inferior
        pctx.lineTo(-halfWidth, 0);           // Vértice Izquierdo
        pctx.closePath();
        
        pctx.fill();
        
        // Restaurar el estado del lienzo para la siguiente partícula
        pctx.restore();
    }
}

// ─── Bucle principal ──────────────────────────────────────────────────────────
function move() {

    // Movimiento al centro (modo escudo)
    if (movingToCenter) {
        x += (centerTargetX - x) * centerLerpSpeed;
        y += (centerTargetY - y) * centerLerpSpeed;
        if (Math.abs(x - centerTargetX) < 1 && Math.abs(y - centerTargetY) < 1) {
            x = centerTargetX;
            y = centerTargetY;
            movingToCenter = false;
            lockedCenter   = true;
            heartColor     = '#027e02ff';
            keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
            shieldActive = true;
            shieldDir    = null;
            setShieldTarget('up');
        }
    } else if (!broken && !lockedCenter) {
        if (heartColor === '#2018f9ff') {
            // Modo azul: física de gravedad
            // Auto-salto: si la tecla de salto está presionada y el corazón está en el suelo,
            // salta de nuevo (no depende del auto-repeat del navegador, funciona con otras teclas)
            if (blueJumpKeyDown && (blueOnGround || isOnAnyPlatform())) {
                blueYVel     = blueJumpMinPower;
                blueOnGround = false;
                blueJumpHeld = true;
            }
            if (keys.ArrowLeft)  x = Math.max(x - speed, heartWidth  / 2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth  - heartWidth  / 2);
            blueYVel += blueGravityInverted ? -blueGravity : blueGravity;
            // Salto variable: mientras se mantiene la tecla Y el corazón sube
            // (contra la gravedad), empuja hacia arriba hasta el salto máximo
            if (blueJumpHeld && blueYVel < 0 && blueYVel > blueJumpMaxPower) {
                blueYVel = Math.max(blueYVel - blueJumpHoldPower, blueJumpMaxPower);
            }
            // Caída lenta: al mantener la tecla mientras el corazón cae
            // (a favor de la gravedad), la gravedad se multiplica por blueFallSlowFactor
            const blueFalling = blueGravityInverted ? blueYVel < 0 : blueYVel > 0;
            if (blueJumpHeld && blueFalling) {
                blueYVel -= (blueGravityInverted ? -blueGravity : blueGravity) * (1 - blueFallSlowFactor);
            }
            let nextY  = y + blueYVel;
            let landed = false;
            for (let pl of platforms) {
                if (
                    y + heartHeight / 2 <= pl.y &&
                    nextY + heartHeight / 2 >= pl.y &&
                    x + heartWidth  / 2 > pl.x &&
                    x - heartWidth  / 2 < pl.x + pl.w
                ) {
                    nextY  = pl.y - heartHeight / 2;
                    blueYVel = 0;
                    blueOnGround = true;
                    landed = true;
                    break;
                }
            }
            // Colisión con la barra de vida como plataforma
            const lbr    = lifeBar.getBoundingClientRect();
            if (
                y + heartHeight / 2 <= lbr.top &&
                nextY + heartHeight / 2 >= lbr.top &&
                x + heartWidth  / 2 > lbr.left &&
                x - heartWidth  / 2 < lbr.right
            ) {
                nextY    = lbr.top - heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed   = true;
            }
            if (blueGravityInverted && nextY <= heartHeight / 2) {
                nextY = heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            if (!blueGravityInverted && nextY >= window.innerHeight - heartHeight / 2) {
                nextY = window.innerHeight - heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            if (!landed) blueOnGround = false;
            y = nextY;
        } else {
            // Modo normal
            if (keys.ArrowLeft)  x = Math.max(x - speed, heartWidth  / 2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth  - heartWidth  / 2);
            if (keys.ArrowUp)    y = Math.max(y - speed, heartHeight / 2);
            if (keys.ArrowDown)  y = Math.min(y + speed, window.innerHeight - heartHeight / 2);
        }
    }

    if (broken) {
        shieldActive = false;
        lockedCenter = false;
        projectiles  = [];
    }

    // ── Animación de muerte (spritesheet) ────────────────────────────────────
    if (heartDeathAnimating) {
        const now = performance.now();
        if (now - heartLastFrameTime >= heartFrameDuration) {
            heartLastFrameTime = now;
            if (heartDeathFrame < HEART_FRAME_COUNT - 1) {
                heartDeathFrame++;
            } else {
                heartDeathAnimating       = false;
                deathAnimationFinishedTime = performance.now();
            }
        }
    }

    // ── Spawn de partículas cuando termina la animación de muerte ─────────────
    if (
        broken &&
        !heartDeathAnimating &&
        heartVisible &&
        performance.now() - deathAnimationFinishedTime > 500
    ) {
        heartVisible = false;
        spawnDeathParticles();
    }

    // ── Render ────────────────────────────────────────────────────────────────
    updateHeart();
    ctx.imageSmoothingEnabled = false;  // Para el lienzo del corazón
    pctx.imageSmoothingEnabled = false; // Para el lienzo de los Blasters/Proyectiles

    if (heartVisible) {
        drawHeart(ctx);
    } else {
        ctx.clearRect(0, 0, heartWidth, heartHeight);
    }

    updateProjectiles();
    updateDeathParticles();
    drawDeathParticles();
    updateGreenBox();
    drawPlatforms();
    if (greenBoxActive) clampToGreenBox();
    drawGreenBox();

    if (typeof testSpriteDraw === 'function') testSpriteDraw(pctx);

    requestAnimationFrame(move);  // SIEMPRE al final, nunca antes de un return
}

// Calcular delta time para el AttackManager
let lastFrameTime = performance.now();
function move() {
    const now = performance.now();
    const dt = (now - lastFrameTime) / 16.67; // Normalizado a 60fps
    lastFrameTime = now;

    // Movimiento al centro (modo escudo)
    if (movingToCenter) {
        x += (centerTargetX - x) * centerLerpSpeed;
        y += (centerTargetY - y) * centerLerpSpeed;
        if (Math.abs(x - centerTargetX) < 1 && Math.abs(y - centerTargetY) < 1) {
            x = centerTargetX;
            y = centerTargetY;
            movingToCenter = false;
            lockedCenter   = true;
            heartColor     = '#027e02ff';
            keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
            shieldActive = true;
            shieldDir    = null;
            setShieldTarget('up');
        }
    } else if (!broken && !lockedCenter) {
        if (heartColor === '#2018f9ff') {
            // Modo azul: física de gravedad
            // Auto-salto: si la tecla de salto está presionada y el corazón está en el suelo,
            // salta de nuevo (no depende del auto-repeat del navegador, funciona con otras teclas)
            if (blueJumpKeyDown && (blueOnGround || isOnAnyPlatform())) {
                blueYVel     = blueJumpMinPower;
                blueOnGround = false;
                blueJumpHeld = true;
            }
            if (keys.ArrowLeft)  x = Math.max(x - speed, heartWidth  / 2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth  - heartWidth  / 2);
            blueYVel += blueGravityInverted ? -blueGravity : blueGravity;
            // Salto variable: mientras se mantiene la tecla Y el corazón sube
            // (contra la gravedad), empuja hacia arriba hasta el salto máximo
            if (blueJumpHeld && blueYVel < 0 && blueYVel > blueJumpMaxPower) {
                blueYVel = Math.max(blueYVel - blueJumpHoldPower, blueJumpMaxPower);
            }
            // Caída lenta: al mantener la tecla mientras el corazón cae
            // (a favor de la gravedad), la gravedad se multiplica por blueFallSlowFactor
            const blueFalling = blueGravityInverted ? blueYVel < 0 : blueYVel > 0;
            if (blueJumpHeld && blueFalling) {
                blueYVel -= (blueGravityInverted ? -blueGravity : blueGravity) * (1 - blueFallSlowFactor);
            }
            let nextY  = y + blueYVel;
            let landed = false;
            for (let pl of platforms) {
                if (
                    y + heartHeight / 2 <= pl.y &&
                    nextY + heartHeight / 2 >= pl.y &&
                    x + heartWidth  / 2 > pl.x &&
                    x - heartWidth  / 2 < pl.x + pl.w
                ) {
                    nextY  = pl.y - heartHeight / 2;
                    blueYVel = 0;
                    blueOnGround = true;
                    landed = true;
                    break;
                }
            }
            // Colisión con la barra de vida como plataforma
            const lbr    = lifeBar.getBoundingClientRect();
            if (
                y + heartHeight / 2 <= lbr.top &&
                nextY + heartHeight / 2 >= lbr.top &&
                x + heartWidth  / 2 > lbr.left &&
                x - heartWidth  / 2 < lbr.right
            ) {
                nextY    = lbr.top - heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed   = true;
            }
            if (blueGravityInverted && nextY <= heartHeight / 2) {
                nextY = heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            if (!blueGravityInverted && nextY >= window.innerHeight - heartHeight / 2) {
                nextY = window.innerHeight - heartHeight / 2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            if (!landed) blueOnGround = false;
            y = nextY;
        } else {
            // Modo normal
            if (keys.ArrowLeft)  x = Math.max(x - speed, heartWidth  / 2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth  - heartWidth  / 2);
            if (keys.ArrowUp)    y = Math.max(y - speed, heartHeight / 2);
            if (keys.ArrowDown)  y = Math.min(y + speed, window.innerHeight - heartHeight / 2);
        }
    }

    if (broken) {
        shieldActive = false;
        lockedCenter = false;
        if (window.attackManager) window.attackManager.clear();
    }

    // ── Animación de muerte (spritesheet) ────────────────────────────────────
    if (heartDeathAnimating) {
        const now = performance.now();
        if (now - heartLastFrameTime >= heartFrameDuration) {
            heartLastFrameTime = now;
            if (heartDeathFrame < HEART_FRAME_COUNT - 1) {
                heartDeathFrame++;
            } else {
                heartDeathAnimating       = false;
                deathAnimationFinishedTime = performance.now();
            }
        }
    }

    // ── Spawn de partículas cuando termina la animación de muerte ─────────────
    if (
        broken &&
        !heartDeathAnimating &&
        heartVisible &&
        performance.now() - deathAnimationFinishedTime > 500
    ) {
        heartVisible = false;
        spawnDeathParticles();
    }

    // ── Stamina regeneration ───────────────────────────────────────────────────
    if (staminaEnabled) {
        const nowSec = performance.now() / 1000;
        if (stamina < maxStamina && nowSec - staminaLastUsed >= staminaRegenDelay) {
            // dt es frames normalizados a 60fps, convertir a segundos
            const dtSec = dt / 60;
            stamina = Math.min(maxStamina, stamina + staminaRegenRate * dtSec);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    updateHeart();
    updateStaminaBar();
    ctx.imageSmoothingEnabled = false;  // Para el lienzo del corazón
    pctx.imageSmoothingEnabled = false; // Para el lienzo de los Blasters/Proyectiles

    if (heartVisible) {
        drawHeart(ctx);
    } else {
        ctx.clearRect(0, 0, heartWidth, heartHeight);
    }

    updateProjectiles(dt);
    updateDeathParticles();
    drawDeathParticles();
    updateGreenBox();
    drawPlatforms();
    if (greenBoxActive) clampToGreenBox();
    drawGreenBox();

    if (typeof testSpriteDraw === 'function') testSpriteDraw(pctx);

    requestAnimationFrame(move);  // SIEMPRE al final, nunca antes de un return
}
