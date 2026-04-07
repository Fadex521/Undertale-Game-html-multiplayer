// undertale.js
// --- Lógica principal Undertale Heart con escudo ---

// Elementos y variables globales
const canvas = document.getElementById('heart-canvas');
const ctx = canvas.getContext('2d');
const projectileCanvas = document.getElementById('projectile-canvas');
const pctx = projectileCanvas.getContext('2d');
const lifeBar = document.getElementById('life-bar');
const lifeLabel = document.getElementById('life-label');

// Tamaños y posiciones
const heartWidth = 20;
const heartHeight = 18;
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
const speed = 5;
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

// Corazón
let heartColor = '#ff0000';
let lockedCenter = false;
let broken = false;
const pixelArt = [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
];
// Variables de física para modo azul
let blueGravity = 0.45; // antes 0.7, ahora más liviana
let blueJumpPower = -11;
let blueYVel = 0;
let blueOnGround = false;

// Vida
let life = 20;
const maxLife = 20;
function updateLifeBar() {
    lifeBar.style.width = (life / maxLife * 100) + '%';
    lifeLabel.textContent = life + ' / ' + maxLife;
}

// Proyectiles
let projectiles = [];
let mousePos = { x: 0, y: 0 };

// Escudo
let shieldActive = false;
let shieldDir = null; // 'left', 'right', 'up', 'down' o null
const shieldRadius = 32;
const shieldArrowLength = 36;
const shieldArrowWidth = 18;
// Puedes ajustar este valor para centrar mejor el sprite de la flecha respecto a su punta
let shieldSpriteOffset = -18; // <--- Ajusta este valor para centrar la flecha visualmente
// Puedes ajustar estos valores para mover el sprite de la flecha después de rotar
let shieldSpriteOffsetX = -18; // <--- Ajusta horizontalmente el sprite
let shieldSpriteOffsetY = 0;   // <--- Ajusta verticalmente el sprite (positivo = abajo)

// Para animar el desplazamiento de la flecha
let shieldTargetAngle = 0;
let shieldCurrentAngle = 0;
let shieldTargetOffsetX = shieldSpriteOffsetX;
let shieldTargetOffsetY = shieldSpriteOffsetY;
let shieldCurrentOffsetX = shieldSpriteOffsetX;
let shieldCurrentOffsetY = shieldSpriteOffsetY;
const shieldLerpSpeed = 0.38; // <--- Más alto = más rápido (valor anterior: 0.18)

function setShieldTarget(dir) {
    if (dir === 'up') {
        shieldTargetAngle = -Math.PI/2;
        shieldTargetOffsetX = shieldSpriteOffsetX;
        shieldTargetOffsetY = shieldSpriteOffsetY;
    } else if (dir === 'down') {
        shieldTargetAngle = Math.PI/2;
        shieldTargetOffsetX = shieldSpriteOffsetX;
        shieldTargetOffsetY = shieldSpriteOffsetY;
    } else if (dir === 'left') {
        shieldTargetAngle = Math.PI;
        shieldTargetOffsetX = shieldSpriteOffsetX;
        shieldTargetOffsetY = shieldSpriteOffsetY;
    } else if (dir === 'right') {
        shieldTargetAngle = 0;
        shieldTargetOffsetX = shieldSpriteOffsetX;
        shieldTargetOffsetY = shieldSpriteOffsetY;
    }
}

// Resize canvas
function resizeProjectileCanvas() {
    projectileCanvas.width = window.innerWidth;
    projectileCanvas.height = window.innerHeight;
}
resizeProjectileCanvas();

window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth - heartWidth/2);
    y = Math.min(y, window.innerHeight - heartHeight/2);
    updateHeart();
    resizeProjectileCanvas();
});

document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Obtener el audio de cambio de modo
const modeSound = document.getElementById('mode-sound');

document.addEventListener('keydown', (e) => {
    // Si está muerto, no permitir lanzar proyectiles ni cambiar modo
    if (broken) return;
    // Cambiar a modo rojo con '1'
    if (e.key === '1') {
        heartColor = '#ff0000';
        shieldActive = false;
        lockedCenter = false;
        movingToCenter = false;
        // Permitir movimiento
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
        keys['ArrowUp'] = false;
        keys['ArrowDown'] = false;
        setLifeBarPosition(false);
        if (modeSound) {
            modeSound.currentTime = 0;
            modeSound.play();
        }
        blueYVel = 0;
        blueOnGround = false;
        // Cerrar cuadro blanco si está activo
        if (whiteBoxActive) closeWhiteBoxAnimation();
    }
    // Cambiar a modo azul with '3'
    if (e.key === '3') {
        heartColor = '#2018f9ff'; // Azul
        shieldActive = false;
        lockedCenter = false;
        movingToCenter = false;
        // Permitir movimiento
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
        keys['ArrowUp'] = false;
        keys['ArrowDown'] = false;
        setLifeBarPosition(false);
        if (modeSound) {
            modeSound.currentTime = 0;
            modeSound.play();
        }
        blueYVel = 0;
        blueOnGround = false;
        // Ya NO se activa el cuadro blanco automáticamente
        // (Si quieres activarlo manualmente, usa F)
    }
    // Alternar cuadro blanco igual que los otros cuadros
    if ((e.key === 'g' || e.key === 'G') && whiteBoxActive && !whiteBoxAnimating) {
        closeWhiteBoxAnimation();
    }
    if ((e.key === 'f' || e.key === 'F') && !whiteBoxActive) {
        startWhiteBoxAnimation();
    }
    // Saltar si está en modo azul y en el suelo o en cualquier plataforma segura
    if (heartColor === '#2018f9ff' && (e.key === 'ArrowUp')) {
        if (blueOnGround || isOnAnyPlatform()) {
            blueYVel = blueJumpPower;
            blueOnGround = false;
        }
    }
    // Cambiar a modo escudo con '2'
    if (e.key === '2') {
        if (!lockedCenter) {
            movingToCenter = true;
            centerTargetX = window.innerWidth / 2;
            centerTargetY = window.innerHeight / 2;

             if (modeSound) {
            modeSound.currentTime = 0;
            modeSound.play();
        }

        }
        setLifeBarPosition(true);
        // Si el cuadro verde está activo, retraerlo animadamente
        if (greenBoxActive) closeGreenBoxAnimation();
        // Cerrar cuadro blanco si está activo
        if (whiteBoxActive) closeWhiteBoxAnimation();
    }
    // Lanzar proyectiles normales solo si NO está en modo escudo
    if (!lockedCenter && (e.key === 'a' || e.key === 'A')) {
        projectiles.push({
            x: mousePos.x,
            y: mousePos.y,
            vx: 0,
            vy: 0,
            active: false,
            hit: false
        });
    }
    if (!lockedCenter && (e.key === 's' || e.key === 'S')) {
        projectiles.forEach(p => {
            if (!p.active) {
                const dx = x - p.x;
                const dy = y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                const speedP = 7;
                p.vx = dx / dist * speedP;
                p.vy = dy / dist * speedP;
                p.active = true;
            }
        });
    }
    // Ataques al jugador en modo escudo con nuevas teclas
    if (lockedCenter && shieldActive) {
        // Proyectil desde la izquierda ('a')
        if (e.key === 'a' || e.key === 'A') {
            let py = y;
            projectiles.push({
                x: 0,
                y: py,
                vx: 0,
                vy: 0,
                active: true,
                hit: false,
                attackType: 'left'
            });
        }
        // Proyectil desde arriba ('w')
        if (e.key === 'w' || e.key === 'W') {
            let px = x;
            projectiles.push({
                x: px,
                y: 0,
                vx: 0,
                vy: 0,
                active: true,
                hit: false,
                attackType: 'up'
            });
        }
        // Proyectil desde abajo ('s')
        if (e.key === 's' || e.key === 'S') {
            let px = x;
            projectiles.push({
                x: px,
                y: window.innerHeight,
                vx: 0,
                vy: 0,
                active: true,
                hit: false,
                attackType: 'down'
            });
        }
        // Proyectil desde la derecha ('d')
        if (e.key === 'd' || e.key === 'D') {
            let py = y;
            projectiles.push({
                x: window.innerWidth,
                y: py,
                vx: 0,
                vy: 0,
                active: true,
                hit: false,
                attackType: 'right'
            });
        }
    }
    // Permitir movimiento con flechas en modo normal
    if (!lockedCenter && (e.key in keys)) {
        keys[e.key] = true;
    }
    // Permitir controlar la dirección del escudo con flechas en modo escudo
    if (lockedCenter && shieldActive) {
        if (e.key === 'ArrowLeft') { shieldDir = 'left'; setShieldTarget('left'); }
        if (e.key === 'ArrowRight') { shieldDir = 'right'; setShieldTarget('right'); }
        if (e.key === 'ArrowUp') { shieldDir = 'up'; setShieldTarget('up'); }
        if (e.key === 'ArrowDown') { shieldDir = 'down'; setShieldTarget('down'); }
    }
    // Alternar cuadro verde/morado con 'o' y 'p'
    if (e.key === 'o' || e.key === 'O') {
        if (!greenBoxActive) {
            startGreenBoxAnimation(greenBoxFinalSize, "green");
        } else if (greenBoxActive && boxMode === "green" && !greenBoxAnimating) {
            // Cambia a morado pequeño
            greenBoxAnimating = true;
            greenBoxAnimSpeed = greenBoxCompressSpeed;
            greenBox.tw = (window.innerWidth - purpleBoxFinalSize) / 2;
            greenBox.th = (window.innerHeight - purpleBoxFinalSize) / 2;
            greenBox.tx = purpleBoxFinalSize;
            greenBox.ty = purpleBoxFinalSize;
            boxMode = "purple";
            if (boxShrinkSound) {
                boxShrinkSound.currentTime = 0;
                boxShrinkSound.play();
            }
        }
    }
    if ((e.key === 'p' || e.key === 'P') && greenBoxActive && !greenBoxAnimating) {
        if (boxMode === "purple") {
            // Volver a grande y verde
            greenBoxAnimating = true;
            greenBoxAnimSpeed = greenBoxCompressSpeed;
            greenBox.tw = (window.innerWidth - greenBoxFinalSize) / 2;
            greenBox.th = (window.innerHeight - greenBoxFinalSize) / 2;
            greenBox.tx = greenBoxFinalSize;
            greenBox.ty = greenBoxFinalSize;
            boxMode = "green";
        } else if (boxMode === "green") {
            closeGreenBoxAnimation();
        }
    }
    // Invocar proyectil morado con 'z' (pueden ser varios, pero con cooldown)
    if ((e.key === 'z' || e.key === 'Z') && !lockedCenter) {
        const now = Date.now();
        if (now - purpleLastSpawn >= purpleSpawnCooldown) {
            purpleProjectiles.push({
                x: mousePos.x,
                y: mousePos.y,
                vx: 0,
                vy: 0,
                active: false,
                follow: false,
                timer: 0
            });
            purpleLastSpawn = now;
        }
    }
    // Disparar todos los proyectiles morados with 'x'
    if (e.key === 'x' || e.key === 'X') {
        for (let p of purpleProjectiles) {
            if (!p.active) {
                p.active = true;
                p.follow = true;
                p.timer = purpleFollowDuration;
            }
        }
    }
    // Crear plataforma con hitbox en la posición del mouse al presionar 'c'
    if (e.key === 'c' || e.key === 'C') {
        platforms.push({
            x: mousePos.x - 40,
            y: mousePos.y,
            w: 80,
            h: 12
        });
    }
    // Eliminar todas las plataformas al presionar 'v'
    if (e.key === 'v' || e.key === 'V') {
        platforms = [];
    }
    // Invertir gravedad y pegar el corazón al techo al presionar 'i' en modo azul
    if ((e.key === 'i' || e.key === 'I') && heartColor === '#2018f9ff') {
        blueGravityInverted = !blueGravityInverted;
        if (blueGravityInverted) {
            y = heartHeight/2;
            blueYVel = 0;
        } else {
            // Si se desactiva, lo baja al suelo
            y = Math.min(y, window.innerHeight - heartHeight/2);
            blueYVel = 0;
        }
    }
});
document.addEventListener('keyup', (e) => {
    // Permitir liberar teclas de movimiento en modo normal
    if (!lockedCenter && (e.key in keys)) {
        keys[e.key] = false;
    }
    if (lockedCenter && shieldActive) {
        if (e.key === 'ArrowLeft' && shieldDir === -1) shieldDir = 0;
        if (e.key === 'ArrowRight' && shieldDir === 1) shieldDir = 0;
    }
});

// Variable para invertir gravedad y rotación
let blueGravityInverted = false;
let heartRotation = 0;

function drawHeart(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, heartWidth, heartHeight);
    // Rotar solo si está en modo azul y gravedad invertida
    if (heartColor === '#2018f9ff' && blueGravityInverted) {
        ctx.translate(heartWidth/2, heartHeight/2);
        ctx.rotate(Math.PI);
        ctx.translate(-heartWidth/2, -heartHeight/2);
    }
    const px = heartWidth / pixelArt[0].length;
    const py = heartHeight / pixelArt.length;
    if (!broken) {
        for (let row = 0; row < pixelArt.length; row++) {
            for (let col = 0; col < pixelArt[row].length; col++) {
                if (pixelArt[row][col]) {
                    ctx.fillStyle = heartColor;
                    ctx.fillRect(col * px, row * py, px, py);
                }
            }
        }
    } else {
        // Corazón roto
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px*1, py*0);
        ctx.lineTo(px*2.5, py*2.5);
        ctx.lineTo(px*0, py*4.5);
        ctx.lineTo(px*0, py*0);
        ctx.closePath();
        ctx.fillStyle = heartColor;
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px*5, py*0);
        ctx.lineTo(px*2.5, py*2.5);
        ctx.lineTo(px*6, py*4.5);
        ctx.lineTo(px*6, py*0);
        ctx.closePath();
        ctx.fillStyle = heartColor;
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

function getShieldAngleFromDir(dir) {
    if (dir === 'up') return -Math.PI/2;
    if (dir === 'down') return Math.PI/2;
    if (dir === 'left') return Math.PI;
    if (dir === 'right') return 0;
    return 0;
}

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
}

function drawShield() {
    if (lockedCenter && shieldActive && shieldDir) {
        const cx = x;
        const cy = y;
        let offset = shieldRadius + 18;
        // Interpolación angular para el ángulo (camino más corto)
        shieldCurrentAngle = lerpAngle(shieldCurrentAngle, shieldTargetAngle, shieldLerpSpeed);
        shieldCurrentOffsetX += (shieldTargetOffsetX - shieldCurrentOffsetX) * shieldLerpSpeed;
        shieldCurrentOffsetY += (shieldTargetOffsetY - shieldCurrentOffsetY) * shieldLerpSpeed;
        const shieldCtx = pctx;
        shieldCtx.save();
        shieldCtx.translate(cx + Math.cos(shieldCurrentAngle) * offset, cy + Math.sin(shieldCurrentAngle) * offset);
        shieldCtx.rotate(shieldCurrentAngle + Math.PI/2);
        shieldCtx.translate(shieldCurrentOffsetX - 25, shieldCurrentOffsetY);
        shieldCtx.beginPath();
        // Flecha larga y fina
        const arrowLen = shieldArrowLength + 40;
        const arrowW = 3; // más fina
        shieldCtx.moveTo(0, 0);
        shieldCtx.lineTo(0, -arrowW/2);
        shieldCtx.lineTo(arrowLen, -arrowW/2);
        shieldCtx.lineTo(arrowLen, -arrowW);
        shieldCtx.lineTo(arrowLen + 18, 0);
        shieldCtx.lineTo(arrowLen, arrowW);
        shieldCtx.lineTo(arrowLen, arrowW/2);
        shieldCtx.lineTo(0, arrowW/2);
        shieldCtx.closePath();
        shieldCtx.fillStyle = '#00cfff';
        shieldCtx.shadowColor = '#00cfff';
        shieldCtx.shadowBlur = 16;
        shieldCtx.globalAlpha = 0.95;
        shieldCtx.fill();
        shieldCtx.globalAlpha = 1;
        shieldCtx.shadowBlur = 0;
        shieldCtx.restore();
    }
}

// Agrega transición CSS a la barra de vida para animar el movimiento
const lifeBarContainer = document.getElementById('life-bar-container');
lifeBarContainer.style.transition = 'left 0.5s cubic-bezier(.4,1.6,.6,1), right 0.5s cubic-bezier(.4,1.6,.6,1), transform 0.5s cubic-bezier(.4,1.6,.6,1)';

function setLifeBarPosition(escudo) {
    const lifeBarContainer = document.getElementById('life-bar-container');
    if (escudo) {
        lifeBarContainer.style.left = 'auto';
        lifeBarContainer.style.right = '40px';
        lifeBarContainer.style.transform = 'none';
    } else {
        lifeBarContainer.style.left = '50%';
        lifeBarContainer.style.right = 'auto';
        lifeBarContainer.style.transform = 'translateX(-50%)';
    }
}

function updateHeart() {
    canvas.style.left = (x - heartWidth/2) + 'px';
    canvas.style.top = (y - heartHeight/2) + 'px';
}

function checkCollision(px, py) {
    const r = 6;
    const left = x - heartWidth/2;
    const right = x + heartWidth/2;
    const top = y - heartHeight/2;
    const bottom = y + heartHeight/2;
    const closestX = Math.max(left, Math.min(px, right));
    const closestY = Math.max(top, Math.min(py, bottom));
    const dx = px - closestX;
    const dy = py - closestY;
    return (dx*dx + dy*dy) < r*r;
}

// Obtener el audio de impacto
const hitSound = document.getElementById('hit-sound');
// Obtener el audio de impacto de la lanza
const shieldSound = document.getElementById('shield-sound');
// Obtener el audio de contracción del cuadro
const boxShrinkSound = document.getElementById('box-shrink-sound');

// --- Proyectiles morados (múltiples) ---
let purpleProjectiles = [];
const purpleFollowDuration = 60; // frames (1 segundo a 60fps)
let purpleLastSpawn = 0;
const purpleSpawnCooldown = 1000; // milisegundos

function updateProjectiles() {
    pctx.clearRect(0, 0, projectileCanvas.width, projectileCanvas.height);
    let newProjectiles = [];
    // --- Proyectiles morados ---
    let newPurple = [];
    for (let purpleProjectile of purpleProjectiles) {
        if (purpleProjectile.active) {
            if (purpleProjectile.follow && purpleProjectile.timer > 0) {
                // Seguir al jugador
                let dx = x - purpleProjectile.x;
                let dy = y - purpleProjectile.y;
                let dist = Math.sqrt(dx*dx + dy*dy) || 1;
                let speedP = 4.6; // Más lento
                purpleProjectile.vx = dx / dist * speedP;
                purpleProjectile.vy = dy / dist * speedP;
                purpleProjectile.x += purpleProjectile.vx;
                purpleProjectile.y += purpleProjectile.vy;
                purpleProjectile.timer--;
                if (purpleProjectile.timer <= 0) {
                    purpleProjectile.follow = false;
                }
            } else {
                // Sigue en línea recta
                purpleProjectile.x += purpleProjectile.vx;
                purpleProjectile.y += purpleProjectile.vy;
            }
            // Colisión con el corazón
            if (!broken && checkCollision(purpleProjectile.x, purpleProjectile.y)) {
                // Sonido de impacto
                if (hitSound) {
                    hitSound.currentTime = 0;
                    hitSound.play();
                }
                if (life > 0) {
                    life--;
                    updateLifeBar();
                    if (life === 0) {
                        broken = true;
                        setTimeout(resetGame, 4000);
                    }
                }
                continue; // No agregar a newPurple
            } else if (
                purpleProjectile.x < -10 || purpleProjectile.x > window.innerWidth + 10 ||
                purpleProjectile.y < -10 || purpleProjectile.y > window.innerHeight + 10
            ) {
                continue; // No agregar a newPurple
            }
        }
        // Dibuja el proyectil morado
        pctx.beginPath();
        pctx.arc(purpleProjectile.x, purpleProjectile.y, 8, 0, 2 * Math.PI);
        pctx.fillStyle = '#a020f0';
        pctx.shadowColor = '#a020f0';
        pctx.shadowBlur = 12;
        pctx.globalAlpha = 0.95;
        pctx.fill();
        pctx.globalAlpha = 1;
        pctx.shadowBlur = 0;
        newPurple.push(purpleProjectile);
    }
    purpleProjectiles = newPurple;
    for (let i = 0; i < projectiles.length; i++) {
        let p = projectiles[i];
        // Movimiento de proyectiles de ataque al jugador
        if (p.active && p.attackType) {
            let dx = x - p.x;
            let dy = y - p.y;
            let dist = Math.sqrt(dx*dx + dy*dy) || 1;
            // Calcula la distancia inicial desde el borde hasta el corazón
            let initialDist = dist;
            if (p.initDist === undefined) {
                p.initDist = dist;
            } else {
                initialDist = p.initDist;
            }
            // Tiempo deseado para llegar al corazón (en frames)
            const framesToReach = 60; // 1 segundo si el juego va a 60fps
            let speedP = initialDist / framesToReach;
            p.vx = dx / dist * speedP;
            p.vy = dy / dist * speedP;
            p.x += p.vx;
            p.y += p.vy;
        } else if (p.active) {
            p.x += p.vx;
            p.y += p.vy;
        }
        // Colisión con el escudo (flecha)
        if (lockedCenter && shieldActive && shieldDir && p.attackType) {
            const cx = x;
            const cy = y;
            let offset = shieldRadius + 18;
            let shieldAngle = 0;
            if (shieldDir === 'up') shieldAngle = -Math.PI/2;
            if (shieldDir === 'down') shieldAngle = Math.PI/2;
            if (shieldDir === 'left') shieldAngle = Math.PI;
            if (shieldDir === 'right') shieldAngle = 0;
            // Posición de la punta de la flecha
            const fx = cx + Math.cos(shieldAngle) * offset;
            const fy = cy + Math.sin(shieldAngle) * offset;
            // Si el proyectil está cerca de la punta de la flecha, desaparece y suena
            const distToArrow = Math.sqrt((p.x - fx) ** 2 + (p.y - fy) ** 2);
            if (distToArrow < 24) {
                if (shieldSound) {
                    shieldSound.currentTime = 0;
                    shieldSound.play();
                }
                continue; // Desaparece
            }
        }
        // Colisión con el corazón
        if (!p.hit && !broken && checkCollision(p.x, p.y)) {
            p.hit = true;
            // Reproducir sonido de impacto
            if (hitSound) {
                hitSound.currentTime = 0;
                hitSound.play();
            }
            if (p.attackType) {
                if (life > 1) {
                    life = Math.max(0, life - 2);
                } else {
                    life = 0;
                }
            } else if (life > 0) {
                life--;
            }
            updateLifeBar();
            if (life === 0) {
                broken = true;
                shieldActive = false; // Oculta el escudo al morir
                lockedCenter = false; // Permite volver a modo normal tras resucitar
                projectiles = []; // Elimina todos los proyectiles
                setTimeout(resetGame, 4000);
                if (greenBoxActive) closeGreenBoxAnimation();
            }
            continue;
        }
        // Dibuja el proyectil
        if (p.attackType) {
            // Dibuja una flecha azul celeste
            pctx.save();
            pctx.translate(p.x, p.y);
            // Calcula el ángulo de la flecha
            let angle = Math.atan2(p.vy, p.vx);
            pctx.rotate(angle);
            pctx.beginPath();
            pctx.moveTo(-12, -5);
            pctx.lineTo(10, 0);
            pctx.lineTo(-12, 5);
            pctx.lineTo(-7, 0);
            pctx.closePath();
            pctx.fillStyle = '#ffffffff';
            pctx.shadowColor = '#00eaff';
            pctx.shadowBlur = 8;
            pctx.globalAlpha = 0.95;
            pctx.fill();
            pctx.globalAlpha = 12;
            pctx.shadowBlur = 5;
            pctx.restore();
        } else {
            pctx.beginPath();
            pctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            pctx.fillStyle = '#ccccccff';
            pctx.fill();
        }
        if (!(p.x < -10 || p.x > window.innerWidth + 10 || p.y < -10 || p.y > window.innerHeight + 10) && !p.hit) {
            newProjectiles.push(p);
        }
    }
    projectiles = newProjectiles;
    drawShield();
}

// Para animar el movimiento del corazón al centro
let movingToCenter = false;
let centerTargetX = 0;
let centerTargetY = 0;
const centerLerpSpeed = 0.18; // velocidad de animación

function move() {
    // Animación de movimiento al centro
    if (movingToCenter) {
        x += (centerTargetX - x) * centerLerpSpeed;
        y += (centerTargetY - y) * centerLerpSpeed;
        // Si está suficientemente cerca, fijar en el centro y activar modo centro
        if (Math.abs(x - centerTargetX) < 1 && Math.abs(y - centerTargetY) < 1) {
            x = centerTargetX;
            y = centerTargetY;
            movingToCenter = false;
            lockedCenter = true;
            heartColor = '#027e02ff';
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = false;
            keys['ArrowUp'] = false;
            keys['ArrowDown'] = false;
            shieldActive = true;
            shieldDir = null;
            setShieldTarget('up'); // por defecto
        }
    } else if (!broken && !lockedCenter) {
        if (heartColor === '#2018f9ff') {
            // Modo azul: movimiento horizontal y física de gravedad
            if (keys.ArrowLeft) x = Math.max(x - speed, heartWidth/2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth - heartWidth/2);
            // Gravedad y salto
            if (blueGravityInverted) {
                blueYVel -= blueGravity;
            } else {
                blueYVel += blueGravity;
            }
            let nextY = y + blueYVel;
            let landed = false;
            // Revisar colisión con plataformas y barra de vida
            for (let pl of platforms) {
                let platformTop = pl.y;
                let platformLeft = pl.x;
                let platformRight = pl.x + pl.w;
                if (
                    y + heartHeight/2 <= platformTop &&
                    nextY + heartHeight/2 >= platformTop &&
                    x + heartWidth/2 > platformLeft &&
                    x - heartWidth/2 < platformRight
                ) {
                    nextY = platformTop - heartHeight/2;
                    blueYVel = 0;
                    blueOnGround = true;
                    landed = true;
                    break;
                }
            }
            // Colisión con la barra de vida como plataforma
            let lifeBarRect = lifeBar.getBoundingClientRect();
            let barTop = lifeBarRect.top;
            let barLeft = lifeBarRect.left;
            let barRight = lifeBarRect.left + lifeBarRect.width;
            // Ajustar para canvas
            if (
                y + heartHeight/2 <= barTop &&
                nextY + heartHeight/2 >= barTop &&
                x + heartWidth/2 > barLeft &&
                x - heartWidth/2 < barRight
            ) {
                nextY = barTop - heartHeight/2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            // Colisión con el techo si gravedad invertida
            if (blueGravityInverted && nextY <= heartHeight/2) {
                nextY = heartHeight/2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            // Colisión con el suelo si gravedad normal
            if (!blueGravityInverted && nextY >= window.innerHeight - heartHeight/2) {
                nextY = window.innerHeight - heartHeight/2;
                blueYVel = 0;
                blueOnGround = true;
                landed = true;
            }
            if (!landed) blueOnGround = false;
            y = nextY;
        } else {
            // Modo normal: movimiento libre
            if (keys.ArrowLeft) x = Math.max(x - speed, heartWidth/2);
            if (keys.ArrowRight) x = Math.min(x + speed, window.innerWidth - heartWidth/2);
            if (keys.ArrowUp) y = Math.max(y - speed, heartHeight/2);
            if (keys.ArrowDown) y = Math.min(y + speed, window.innerHeight - heartHeight/2);
        }
    }
    if (lockedCenter && shieldActive) {
        // La dirección del escudo ya es controlada por las teclas de flecha
    }
    if (broken) {
        shieldActive = false;
        lockedCenter = false;
        projectiles = [];
    }
    updateHeart();
    drawHeart(ctx);
    updateProjectiles();
    updateGreenBox();
    drawPlatforms();
    if (greenBoxActive) {
        clampToGreenBox();
    }
    drawGreenBox();
    //versión del juego
    pctx.save();
    pctx.font = 'bold 18px Arial';
    pctx.fillStyle = '#222';
    pctx.textBaseline = 'top';
    pctx.restore();
    // Dibuja el sprite animado si existe el hook
    if (typeof testSpriteDraw === 'function') {
        testSpriteDraw(pctx);
    }
    requestAnimationFrame(move);
}

function resetGame() {
    life = maxLife;
    broken = false;
    projectiles = [];
    updateLifeBar();
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
    heartColor = '#ff0000'; // Siempre vuelve a rojo
    shieldActive = false;
    lockedCenter = false;
    setLifeBarPosition(false); // Centra la barra de vida
}

// --- Zona verde animada ---
let greenBoxActive = false;
let greenBoxAnimating = false;
let greenBox = {
    x: 0, y: 0, w: 0, h: 0, // actual
    tx: 0, ty: 0, tw: 0, th: 0 // target
};
let boxMode = "green"; // "green", "purple", "white"
const greenBoxCompressSpeed = 0.05; // compresión lenta
const greenBoxDecompressSpeed = 0.18; // descompresión rápida
let greenBoxAnimSpeed = greenBoxCompressSpeed;
const greenBoxFinalSize = 260; // tamaño final del cuadro grande
const purpleBoxFinalSize = 70; // tamaño final del cuadro morado (más pequeño)
const whiteBoxFinalSize = greenBoxFinalSize; // mismo tamaño que el verde
const whiteBoxCompressSpeed = greenBoxCompressSpeed;
const whiteBoxDecompressSpeed = greenBoxDecompressSpeed;
let whiteBoxAnimSpeed = whiteBoxCompressSpeed;
let whiteBoxActive = false;
let whiteBoxAnimating = false;

function startGreenBoxAnimation(size = greenBoxFinalSize, mode = "green") {
    greenBoxActive = true;
    greenBoxAnimating = true;
    greenBoxAnimSpeed = greenBoxCompressSpeed; // compresión lenta
    greenBox.x = 0;
    greenBox.y = 0;
    greenBox.w = window.innerWidth;
    greenBox.h = window.innerHeight;
    greenBox.tw = (window.innerWidth - size) / 2;
    greenBox.th = (window.innerHeight - size) / 2;
    greenBox.tx = size;
    greenBox.ty = size;
    boxMode = mode;
    // Sonido de compresión
    if (boxShrinkSound) {
        boxShrinkSound.currentTime = 0;
        boxShrinkSound.play();
    }
}

function closeGreenBoxAnimation() {
    greenBoxAnimating = true;
    greenBoxAnimSpeed = greenBoxDecompressSpeed; // descompresión rápida
    greenBox.tw = 0;
    greenBox.th = 0;
    greenBox.tx = window.innerWidth;
    greenBox.ty = window.innerHeight;
    boxMode = "green";
    // Sonido de descompresión (opcional)
}

function updateGreenBox() {
    if (!greenBoxActive) return;
    // Animar el cuadro hacia el centro o hacia afuera
    if (greenBoxAnimating) {
        greenBox.x += ((greenBox.tw - greenBox.x) * greenBoxAnimSpeed);
        greenBox.y += ((greenBox.th - greenBox.y) * greenBoxAnimSpeed);
        greenBox.w += ((greenBox.tx - greenBox.w) * greenBoxAnimSpeed);
        greenBox.h += ((greenBox.ty - greenBox.h) * greenBoxAnimSpeed);
        // Si está suficientemente cerca del destino, fijar valores
        if (Math.abs(greenBox.x - greenBox.tw) < 1 && Math.abs(greenBox.y - greenBox.th) < 1 && Math.abs(greenBox.w - greenBox.tx) < 1 && Math.abs(greenBox.h - greenBox.ty) < 1) {
            greenBox.x = greenBox.tw;
            greenBox.y = greenBox.th;
            greenBox.w = greenBox.tx;
            greenBox.h = greenBox.ty;
            if (greenBox.tw === 0 && greenBox.th === 0) {
                greenBoxActive = false; // Desaparece
            }
            greenBoxAnimating = false;
        }
    }
}

function drawGreenBox() {
    if (!greenBoxActive) return;
    pctx.save();
    if (boxMode === "green") {
        pctx.strokeStyle = '#00ff00';
        pctx.shadowColor = '#00ff00';
    } else {
        pctx.strokeStyle = '#a020f0';
        pctx.shadowColor = '#a020f0';
    }
    pctx.lineWidth = 1;
    pctx.shadowBlur = 16;
    pctx.strokeRect(greenBox.x, greenBox.y, greenBox.w, greenBox.h);
    pctx.shadowBlur = 0;
    pctx.restore();
}

// Limitar el movimiento del jugador dentro del cuadro verde
function clampToGreenBox() {
    if (!greenBoxActive) return;
    // Limita el movimiento incluso durante la animación
    // Usar Math.ceil/floor para evitar que el corazón sobresalga por redondeo
    const minX = Math.ceil(greenBox.x + heartWidth/2);
    const maxX = Math.floor(greenBox.x + greenBox.w - heartWidth/2);
    const minY = Math.ceil(greenBox.y + heartHeight/2);
    const maxY = Math.floor(greenBox.y + greenBox.h - heartHeight/2);
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    // Asegura que el canvas siga la posición exacta
    updateHeart();
}

// Array de plataformas
let platforms = [];

// Función para dibujar plataformas
function drawPlatforms() {
    pctx.save();
    pctx.fillStyle = '#888';
    platforms.forEach(pl => {
        pctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    });
    pctx.restore();
}

// Función para detectar si el corazón azul está sobre una plataforma
function isOnAnyPlatform() {
    // Suelo
    if (y >= window.innerHeight - heartHeight/2 - 1) return true;
    // Borde inferior del cuadro verde
    if (greenBoxActive && Math.abs(y - (greenBox.y + greenBox.h - heartHeight/2)) < 2) return true;
    // Borde inferior del cuadro morado
    if (boxMode === "purple" && greenBoxActive && Math.abs(y - (greenBox.y + greenBox.h - heartHeight/2)) < 2) return true;
    // Plataformas
    for (let pl of platforms) {
        if (
            x + heartWidth/2 > pl.x &&
            x - heartWidth/2 < pl.x + pl.w &&
            Math.abs(y + heartHeight/2 - pl.y) < 2
        ) return true;
    }
    return false;
}

// Inicializar
updateLifeBar();
drawHeart(ctx);
updateHeart();
move();
setLifeBarPosition(false);
