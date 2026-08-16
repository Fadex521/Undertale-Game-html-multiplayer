// js/input.js
// --- Manejo de entrada: teclado, ratón y redimensión ---

window.addEventListener('resize', () => {
    x = Math.min(x, window.innerWidth  - heartWidth  / 2);
    y = Math.min(y, window.innerHeight - heartHeight / 2);
    updateHeart();
    resizeProjectileCanvas();
});

document.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

document.addEventListener('keydown', (e) => {
    if (broken) return;

    // Evitar que la barra espaciadora haga scroll o active botones
    if (e.code === 'Space' || e.key === ' ') e.preventDefault();

    // Modo rojo
    if (e.key === '1') {
        heartColor     = '#ff0000';
        shieldActive   = false;
        lockedCenter   = false;
        movingToCenter = false;
        keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
        setLifeBarPosition(false);
        if (modeSound) { modeSound.currentTime = 0; modeSound.play(); }
        blueYVel     = 0;
        blueOnGround = false;
        blueJumpHeld = false;
        blueJumpKeyDown = false;
    }

    // Modo azul
    if (e.key === '3') {
        heartColor     = '#2018f9ff';
        shieldActive   = false;
        lockedCenter   = false;
        movingToCenter = false;
        keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['ArrowDown'] = false;
        setLifeBarPosition(false);
        if (modeSound) { modeSound.currentTime = 0; modeSound.play(); }
        blueYVel     = 0;
        blueOnGround = false;
        blueJumpHeld = false;
        blueJumpKeyDown = false;
    }

    // Saltar (modo azul) — barra espaciadora o flecha arriba
    if (heartColor === '#2018f9ff' && (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp')) {
        blueJumpKeyDown = true;
        if (blueOnGround || isOnAnyPlatform()) {
            blueYVel     = blueJumpMinPower;
            blueOnGround = false;
            blueJumpHeld = true;
        }
    }

    // Modo escudo
    if (e.key === '2') {
        if (!lockedCenter) {
            movingToCenter = true;
            centerTargetX  = window.innerWidth  / 2;
            centerTargetY  = window.innerHeight / 2;
            if (modeSound) { modeSound.currentTime = 0; modeSound.play(); }
        }
        setLifeBarPosition(true);
        if (greenBoxActive) closeGreenBoxAnimation();
    }

    // Proyectiles blancos (solo fuera del modo escudo)
    if (!lockedCenter && (e.key === 'a' || e.key === 'A')) {
        projectiles.push({ x: mousePos.x, y: mousePos.y, vx: 0, vy: 0, active: false, hit: false });
    }
    if (!lockedCenter && (e.key === 's' || e.key === 'S')) {
        projectiles.forEach(p => {
            if (!p.active) {
                const dx = x - p.x, dy = y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                p.vx = dx / dist * 7;
                p.vy = dy / dist * 7;
                p.active = true;
            }
        });
    }

    // Ataques al jugador en modo escudo
    if (lockedCenter && shieldActive) {
        if (e.key === 'a' || e.key === 'A')
            projectiles.push({ x: 0,                   y: y,                    vx: 0, vy: 0, active: true, hit: false, attackType: 'left'  });
        if (e.key === 'w' || e.key === 'W')
            projectiles.push({ x: x,                   y: 0,                    vx: 0, vy: 0, active: true, hit: false, attackType: 'up'    });
        if (e.key === 's' || e.key === 'S')
            projectiles.push({ x: x,                   y: window.innerHeight,   vx: 0, vy: 0, active: true, hit: false, attackType: 'down'  });
        if (e.key === 'd' || e.key === 'D')
            projectiles.push({ x: window.innerWidth,   y: y,                    vx: 0, vy: 0, active: true, hit: false, attackType: 'right' });
    }

    // Movimiento con flechas (modo normal)
    if (!lockedCenter && (e.key in keys)) keys[e.key] = true;

    // Dirección del escudo (modo escudo)
    if (lockedCenter && shieldActive) {
        if (e.key === 'ArrowLeft')  { shieldDir = 'left';  setShieldTarget('left');  }
        if (e.key === 'ArrowRight') { shieldDir = 'right'; setShieldTarget('right'); }
        if (e.key === 'ArrowUp')    { shieldDir = 'up';    setShieldTarget('up');    }
        if (e.key === 'ArrowDown')  { shieldDir = 'down';  setShieldTarget('down');  }
    }

    // Cuadro verde / morado
    if (e.key === 'o' || e.key === 'O') {
        if (!greenBoxActive) {
            startGreenBoxAnimation(greenBoxFinalSize, "green");
        } else if (boxMode === "green" && !greenBoxAnimating) {
            greenBoxAnimating = true;
            greenBoxAnimSpeed = greenBoxCompressSpeed;
            greenBox.tw = (window.innerWidth  - purpleBoxFinalSize) / 2;
            greenBox.th = (window.innerHeight - purpleBoxFinalSize) / 2;
            greenBox.tx = purpleBoxFinalSize;
            greenBox.ty = purpleBoxFinalSize;
            boxMode = "purple";
            if (boxShrinkSound) { boxShrinkSound.currentTime = 0; boxShrinkSound.play(); }
        }
    }
    if ((e.key === 'p' || e.key === 'P') && greenBoxActive && !greenBoxAnimating) {
        if (boxMode === "purple") {
            greenBoxAnimating = true;
            greenBoxAnimSpeed = greenBoxCompressSpeed;
            greenBox.tw = (window.innerWidth  - greenBoxFinalSize) / 2;
            greenBox.th = (window.innerHeight - greenBoxFinalSize) / 2;
            greenBox.tx = greenBoxFinalSize;
            greenBox.ty = greenBoxFinalSize;
            boxMode = "green";
        } else if (boxMode === "green") {
            closeGreenBoxAnimation();
        }
    }

    // Proyectil morado (con cooldown)
    if ((e.key === 'z' || e.key === 'Z') && !lockedCenter) {
        const now = Date.now();
        if (now - purpleLastSpawn >= purpleSpawnCooldown) {
            purpleProjectiles.push({ x: mousePos.x, y: mousePos.y, vx: 0, vy: 0, active: false, follow: false, timer: 0 });
            purpleLastSpawn = now;
        }
    }

    // Disparar todos los morados
    if (e.key === 'x' || e.key === 'X') {
        for (let p of purpleProjectiles) {
            if (!p.active) { p.active = true; p.follow = true; p.timer = purpleFollowDuration; }
        }
    }

    // Plataformas
    if (e.key === 'c' || e.key === 'C')
        platforms.push({ x: mousePos.x - 40, y: mousePos.y, w: 80, h: 12 });
    if (e.key === 'v' || e.key === 'V')
        platforms = [];

    // Invertir gravedad (modo azul)
    if ((e.key === 'i' || e.key === 'I') && heartColor === '#2018f9ff') {
        blueGravityInverted = !blueGravityInverted;
        y        = blueGravityInverted ? heartHeight / 2 : Math.min(y, window.innerHeight - heartHeight / 2);
        blueYVel = 0;
    }
});

document.addEventListener('keyup', (e) => {
    if (!lockedCenter && (e.key in keys)) keys[e.key] = false;
    // Soltar la tecla de salto corta el impulso (salto variable)
    if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        blueJumpHeld    = false;
        blueJumpKeyDown = false;
    }
});
