// js/sprite_anim.js
// --- Animación del Gaster Blaster ---
// Spritesheet: assets/gasterblaster.png  |  24 frames en fila, 66x70 px cada uno

let spriteImg = new Image();
spriteImg.src = 'assets/gasterblaster.png';

let blasters        = [];
const spriteFrameCount  = 24;
const spriteFrameWidth  = 66;
const spriteFrameHeight = 70;
let spriteScale     = 2.0;
const spriteFrameTime   = 40;   // ms por frame
const laserDuration     = 700;  // ms
const spriteRotSpeed    = 0.13;
const spriteSpeed       = 2;
const spriteSpeedGrowth = 0.4;

function getPlayerPos() {
    if (typeof x !== 'undefined' && typeof y !== 'undefined') return { x, y };
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function makeBlaster(bx, by, targetX, targetY) {
    const playerAngle = getPlayerPos();
    const dxA  = targetX - playerAngle.x;
    const dyA  = targetY - playerAngle.y;
    const entryAngle  = Math.atan2(dyA, dxA) - Math.PI / 2;
    const targetAngle = Math.atan2(playerAngle.y - targetY, playerAngle.x - targetX) - Math.PI / 2;
    const adx  = targetX - bx;
    const ady  = targetY - by;
    const amag = Math.sqrt(adx * adx + ady * ady) || 1;
    return {
        active: true, animating: false, arriving: true, frame: 0,
        x: bx, y: by, targetX, targetY,
        angle: entryAngle, targetAngle,
        exitAngle: targetAngle + Math.PI,
        rotSpeed: spriteRotSpeed, vx: 0, vy: 0,
        speed: spriteSpeed, speedGrowth: spriteSpeedGrowth,
        arriveVX: adx / amag * 18, arriveVY: ady / amag * 18,
        currentSpeed: spriteSpeed, lastFrameTime: 0,
        laserActive: false, laserStartTime: 0, laserHit: false
    };
}

function spawnBlasterToward(targetX, targetY) {
    const player = getPlayerPos();
    const dx     = targetX - player.x;
    const dy     = targetY - player.y;
    const mag    = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX   = dx / mag, dirY = dy / mag;
    const tTop    = (-spriteFrameHeight - player.y) / (dirY || 0.0001);
    const tBottom = (window.innerHeight + spriteFrameHeight - player.y) / (dirY || 0.0001);
    const tLeft   = (-spriteFrameWidth  - player.x) / (dirX || 0.0001);
    const tRight  = (window.innerWidth  + spriteFrameWidth  - player.x) / (dirX || 0.0001);
    const tCands  = [tTop, tBottom, tLeft, tRight].filter(t => t > 0);
    const tMin    = Math.min(...tCands);
    const bx = player.x + dirX * tMin;
    const by = player.y + dirY * tMin;
    blasters.push(makeBlaster(bx, by, targetX, targetY));
}

function fireBlaster(b) {
    const retroAngle = b.angle + Math.PI / 2;
    b.vx = -Math.cos(retroAngle) * b.speed;
    b.vy = -Math.sin(retroAngle) * b.speed;
    b.currentSpeed   = b.speed;
    b.animating      = true;
    b.frame          = 0;
    b.lastFrameTime  = performance.now();
    b.laserActive    = true;
    b.laserStartTime = performance.now();
    b.laserHit       = false;
}

window.addEventListener('keydown', (e) => {
    // T — disparar todos los blasters
    if (e.key === 't' || e.key === 'T') {
        let audio = document.getElementById('sprite-anim-sound');
        if (audio) { audio.currentTime = 0; audio.play(); }
        for (let b of blasters)
            if (b.active && !b.animating && !b.arriving && !b.laserActive) fireBlaster(b);
    }

    // R — invocar en posición aleatoria
    if (e.key === 'r' || e.key === 'R') {
        let audio = document.getElementById('sprite-sound');
        if (audio) { audio.currentTime = 0; audio.play(); }
        const tx = Math.random() * window.innerWidth;
        const ty = Math.random() * window.innerHeight;
        spawnBlasterToward(tx, ty);
    }

    // F — invocar hacia el cursor
    if (e.key === 'f' || e.key === 'F') {
        let audio = document.getElementById('sprite-sound');
        if (audio) { audio.currentTime = 0; audio.play(); }
        const mouse = (typeof mousePos !== 'undefined')
            ? mousePos
            : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        spawnBlasterToward(mouse.x, mouse.y);
    }

    // G — disparar el último blaster quieto
    if (e.key === 'g' || e.key === 'G') {
        for (let i = blasters.length - 1; i >= 0; i--) {
            const b = blasters[i];
            if (b.active && !b.animating && !b.arriving && !b.laserActive) {
                let audio = document.getElementById('sprite-anim-sound');
                if (audio) { audio.currentTime = 0; audio.play(); }
                fireBlaster(b);
                break;
            }
        }
    }
});

function drawSprite(ctx) {
    for (let b of blasters) {
        if (!b.active && !b.laserActive) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        // ── Láser ────────────────────────────────────────────────────────────
        if (b.laserActive) {
            const now     = performance.now();
            const elapsed = now - b.laserStartTime;
            if (elapsed > laserDuration) {
                b.laserActive = false;
            } else {
                const alpha         = 0.85 * (1 - elapsed / laserDuration);
                const offsetAdelante = spriteFrameHeight * spriteScale * 0.15;
                const laserWidth    = 48;
                const laserLength   = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur  = 24;
                ctx.translate(0, offsetAdelante);
                ctx.fillStyle = '#fff';
                ctx.fillRect(-laserWidth / 2, 0, laserWidth, laserLength);
                ctx.restore();

                // Colisión del láser con el corazón
                if (typeof x !== 'undefined' && typeof life !== 'undefined' && !broken) {
                    const cosA = Math.cos(-b.angle);
                    const sinA = Math.sin(-b.angle);
                    const lpx  = x - b.x, lpy = y - b.y;
                    const rx   =  lpx * cosA - lpy * sinA;
                    const ry   = (lpx * sinA + lpy * cosA) - offsetAdelante;
                    if (Math.abs(rx) < laserWidth / 2 + 10 && ry > 0 && ry < laserLength) {
                        if (!b.laserHit) {
                            b.laserHit = true;
                            life = Math.max(0, life - 4);
                            updateLifeBar();
                            const hs = document.getElementById('hit-sound');
                            if (hs) { hs.currentTime = 0; hs.play(); }
                            if (life === 0) {
                                broken             = true;
                                heartDeathAnimating = true;
                                heartDeathFrame    = 0;
                                heartLastFrameTime = performance.now();
                                setTimeout(resetGame, 4000);
                            }
                        }
                    }
                }
            }
        }

        // ── Sprite del blaster ───────────────────────────────────────────────
        if (b.active) {
            if (b.arriving) {
                const dxArr    = b.targetX - b.x;
                const dyArr    = b.targetY - b.y;
                const distArr  = Math.sqrt(dxArr * dxArr + dyArr * dyArr);
                let angleDiff  = b.targetAngle - b.angle;
                while (angleDiff >  Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                b.angle += angleDiff * b.rotSpeed;
                if (distArr < 18) {
                    b.x = b.targetX; b.y = b.targetY;
                    b.angle   = b.targetAngle;
                    b.arriving = false;
                } else {
                    b.x += b.arriveVX;
                    b.y += b.arriveVY;
                }
                ctx.drawImage(spriteImg,
                    0, 0, spriteFrameWidth, spriteFrameHeight,
                    -spriteFrameWidth  / 2 * spriteScale,
                    -spriteFrameHeight / 2 * spriteScale,
                    spriteFrameWidth  * spriteScale,
                    spriteFrameHeight * spriteScale);

            } else if (!b.animating) {
                ctx.drawImage(spriteImg,
                    0, 0, spriteFrameWidth, spriteFrameHeight,
                    -spriteFrameWidth  / 2 * spriteScale,
                    -spriteFrameHeight / 2 * spriteScale,
                    spriteFrameWidth  * spriteScale,
                    spriteFrameHeight * spriteScale);

            } else {
                const now = performance.now();
                if (now - b.lastFrameTime > spriteFrameTime) { b.frame++; b.lastFrameTime = now; }
                b.currentSpeed += b.speedGrowth;
                const norm = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
                b.vx = b.vx / norm * b.currentSpeed;
                b.vy = b.vy / norm * b.currentSpeed;
                b.x += b.vx;
                b.y += b.vy;
                const fuera = (
                    b.x < -spriteFrameWidth  || b.x > window.innerWidth  + spriteFrameWidth ||
                    b.y < -spriteFrameHeight || b.y > window.innerHeight + spriteFrameHeight
                );
                if (fuera || b.frame >= spriteFrameCount) {
                    b.active = b.animating = false;
                    ctx.restore();
                    continue;
                }
                ctx.drawImage(spriteImg,
                    b.frame * spriteFrameWidth, 0, spriteFrameWidth, spriteFrameHeight,
                    -spriteFrameWidth  / 2 * spriteScale,
                    -spriteFrameHeight / 2 * spriteScale,
                    spriteFrameWidth  * spriteScale,
                    spriteFrameHeight * spriteScale);
            }
        }
        ctx.restore();
    }
}

// Hook llamado cada frame desde mechanics.js
testSpriteDraw = function(ctx) { drawSprite(ctx); };
