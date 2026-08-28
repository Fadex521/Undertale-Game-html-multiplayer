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
    
    // Mover barra de stamina al mouse
    const staminaContainer = document.getElementById('stamina-bar-container');
    if (staminaContainer) {
        staminaContainer.style.left = e.clientX + 'px';
        staminaContainer.style.top = e.clientY + 'px';
    }
});

document.addEventListener('keydown', (e) => {
    if (broken) return;

    // Evitar que la barra espaciadora haga scroll o active botones
    if (e.code === 'Space' || e.key === ' ') e.preventDefault();

    const code = e.code;

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
        if (window.attackManager) window.attackManager.clear();
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
        if (window.attackManager) window.attackManager.clear();
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

    // Saltar (modo azul) — solo flecha arriba
    if (heartColor === '#2018f9ff' && e.key === 'ArrowUp') {
        blueJumpKeyDown = true;
        if (blueOnGround || isOnAnyPlatform()) {
            blueYVel     = blueJumpMinPower;
            blueOnGround = false;
            blueJumpHeld = true;
        }
    }

    // Modo escudo

    // Sistema de ataques unificado
    if (window.AttackKeyBindings && window.attackManager) {
        const bindings = window.AttackKeyBindings[code];
        if (bindings) {
            console.log(`[Input] Tecla presionada: ${code} (${e.key}), bindings encontrados: ${bindings.length}`);
            for (const binding of bindings) {
                const validatorResult = binding.validator();
                console.log(`[Input] Binding ${binding.type}: validator=${validatorResult}`);
                if (validatorResult) {
                    if (binding.custom) {
                        console.log(`[Input] Ejecutando custom para ${binding.type}`);
                        binding.custom(e);
                    } else if (binding.action === 'fire') {
                        console.log(`[Input] Ejecutando fire para ${binding.type}`);
                        window.attackManager.fireAll(binding.type, (a) => {
                            const dx = x - a.x, dy = y - a.y;
                            const dist = Math.hypot(dx, dy) || 1;
                            a.vx = dx / dist * 7;
                            a.vy = dy / dist * 7;
                            a.angle = Math.atan2(dy, dx); // Guardar ángulo de lanzamiento (última pos jugador)
                        });
                    } else if (binding.action === 'fireAll') {
                        console.log(`[Input] Ejecutando fireAll para ${binding.type}`);
                        const inactive = window.attackManager.getInactive(binding.type);
                        for (const a of inactive) {
                            a.active = true;
                            a.follow = true;
                            a.timer = a.followDuration || 60;
                        }
                    } else if (binding.params) {
                        console.log(`[Input] Ejecutando spawn para ${binding.type}`);
                        window.attackManager.spawn(binding.type, binding.params());
                    }
                    break; // Solo ejecutar el primer binding que coincida
                }
            }
        } else {
            console.log(`[Input] Tecla ${code} no tiene bindings`);
        }
    } else {
        if (!window.AttackKeyBindings) console.warn('[Input] AttackKeyBindings no definido');
        if (!window.attackManager) console.warn('[Input] attackManager no definido');
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

    // Plataformas
    if (e.key === 'c' || e.key === 'C')
        platforms.push({ x: mousePos.x - 40, y: mousePos.y, w: 80, h: 12 });
    if (e.key === 'v' || e.key === 'V')
        platforms = [];

    });

document.addEventListener('keyup', (e) => {
    if (!lockedCenter && (e.key in keys)) keys[e.key] = false;
    // Soltar la tecla de salto corta el impulso (salto variable)
    if (e.key === 'ArrowUp') {
        blueJumpHeld    = false;
        blueJumpKeyDown = false;
    }
});
