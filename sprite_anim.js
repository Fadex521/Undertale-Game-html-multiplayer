// Este archivo es para la animación del sprite controlado con F y G
// Se asume que el spritesheet está en assets/gasterblaster.png
// Cada frame es de 66x70, hay 24 frames en una sola fila

let spriteImg = new Image();
spriteImg.src = 'assets/gasterblaster.png';

// Blasters múltiples
let blasters = [];
let spriteFrameCount = 24;
let spriteFrameWidth = 66;
let spriteFrameHeight = 70;
let spriteScale = 2.0; // factor de escala
let spriteFrameTime = 40; // ms por frame
let spriteLastFrameTime = 0;

// Referencia al jugador (x, y) del undertale.js global
function getPlayerPos() {
    if (typeof x !== 'undefined' && typeof y !== 'undefined') {
        return { x: x, y: y };
    }
    return { x: window.innerWidth/2, y: window.innerHeight/2 };
}

let spriteAngle = 0;
let spriteTargetAngle = 0;
let spriteExitAngle = 0;
let spriteRotSpeed = 0.13; // velocidad de giro
let spriteVX = 0;
let spriteVY = 0;
let spriteSpeed = 2;
let spriteSpeedGrowth = 0.4; // incremento de velocidad por frame
let spriteStartX = 0;
let spriteStartY = 0;
// Láser
let laserDuration = 700; // ms

// Teclas F y G
window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
        // Disparar todos los blasters invocados al mismo tiempo
        let spriteAnimAudio = document.getElementById('sprite-anim-sound');
        if (spriteAnimAudio) {
            spriteAnimAudio.currentTime = 0;
            spriteAnimAudio.play();
        }
        for (let b of blasters) {
            if (b.active && !b.animating && !b.arriving && !b.laserActive) {
                let retroAngle = b.angle + Math.PI/2;
                let vx = Math.cos(retroAngle);
                let vy = Math.sin(retroAngle);
                b.vx = -vx * b.speed;
                b.vy = -vy * b.speed;
                b.currentSpeed = b.speed;
                b.animating = true;
                b.frame = 0;
                b.lastFrameTime = performance.now();
                b.laserActive = true;
                b.laserStartTime = performance.now();
            }
        }
    }
    if (e.key === 'r' || e.key === 'R') {
        // Sonido al invocar
        let spriteAudio = document.getElementById('sprite-sound');
        if (spriteAudio) {
            spriteAudio.currentTime = 0;
            spriteAudio.play();
        }
        // Invoca en posición aleatoria
        let randX = Math.random() * window.innerWidth;
        let randY = Math.random() * window.innerHeight;
        let playerEntry = getPlayerPos();
        let dxEntry = randX - playerEntry.x;
        let dyEntry = randY - playerEntry.y;
        let magEntry = Math.sqrt(dxEntry*dxEntry + dyEntry*dyEntry) || 1;
        let dirX = dxEntry / magEntry;
        let dirY = dyEntry / magEntry;
        let tTop = (-spriteFrameHeight - playerEntry.y) / dirY;
        let tBottom = (window.innerHeight + spriteFrameHeight - playerEntry.y) / dirY;
        let tLeft = (-spriteFrameWidth - playerEntry.x) / dirX;
        let tRight = (window.innerWidth + spriteFrameWidth - playerEntry.x) / dirX;
        let tCandidates = [];
        if (dirY !== 0) tCandidates.push(tTop, tBottom);
        if (dirX !== 0) tCandidates.push(tLeft, tRight);
        tCandidates = tCandidates.filter(t => t > 0);
        let tMin = Math.min(...tCandidates);
        let bx = playerEntry.x + dirX * tMin;
        let by = playerEntry.y + dirY * tMin;
        let playerAngle = getPlayerPos();
        let dxAngle = randX - playerAngle.x;
        let dyAngle = randY - playerAngle.y;
        let entryAngle = Math.atan2(dyAngle, dxAngle) - Math.PI/2;
        let targetAngle = Math.atan2(playerAngle.y - randY, playerAngle.x - randX) - Math.PI/2;
        let exitAngle = targetAngle + Math.PI;
        let adx = randX - bx;
        let ady = randY - by;
        let amag = Math.sqrt(adx*adx + ady*ady) || 1;
        let arriveVX = adx / amag * 18;
        let arriveVY = ady / amag * 18;
        blasters.push({
            active: true,
            animating: false,
            arriving: true,
            frame: 0,
            x: bx,
            y: by,
            targetX: randX,
            targetY: randY,
            angle: entryAngle,
            targetAngle: targetAngle,
            exitAngle: exitAngle,
            rotSpeed: spriteRotSpeed,
            vx: 0,
            vy: 0,
            speed: spriteSpeed,
            speedGrowth: spriteSpeedGrowth,
            startX: randX,
            startY: randY,
            arriveVX: arriveVX,
            arriveVY: arriveVY,
            currentSpeed: spriteSpeed,
            lastFrameTime: 0,
            laserActive: false,
            laserStartTime: 0
        });
    }
    if (e.key === 'f' || e.key === 'F') {
        // Sonido al invocar
        let spriteAudio = document.getElementById('sprite-sound');
        if (spriteAudio) {
            spriteAudio.currentTime = 0;
            spriteAudio.play();
        }
        // Invoca desde fuera de la pantalla hacia el mouse
        let mouse = { x: 0, y: 0 };
        if (window.event && window.event.clientX !== undefined) {
            mouse.x = window.event.clientX;
            mouse.y = window.event.clientY;
        } else if (typeof mousePos !== 'undefined') {
            mouse.x = mousePos.x;
            mouse.y = mousePos.y;
        } else {
            mouse.x = window.innerWidth/2;
            mouse.y = window.innerHeight/2;
        }
        // Calcular la línea entre el jugador y el mouse
        let playerEntry = getPlayerPos();
        let dxEntry = mouse.x - playerEntry.x;
        let dyEntry = mouse.y - playerEntry.y;
        let magEntry = Math.sqrt(dxEntry*dxEntry + dyEntry*dyEntry) || 1;
        let dirX = dxEntry / magEntry;
        let dirY = dyEntry / magEntry;
        let tTop = (-spriteFrameHeight - playerEntry.y) / dirY;
        let tBottom = (window.innerHeight + spriteFrameHeight - playerEntry.y) / dirY;
        let tLeft = (-spriteFrameWidth - playerEntry.x) / dirX;
        let tRight = (window.innerWidth + spriteFrameWidth - playerEntry.x) / dirX;
        let tCandidates = [];
        if (dirY !== 0) tCandidates.push(tTop, tBottom);
        if (dirX !== 0) tCandidates.push(tLeft, tRight);
        tCandidates = tCandidates.filter(t => t > 0);
        let tMin = Math.min(...tCandidates);
        let bx = playerEntry.x + dirX * tMin;
        let by = playerEntry.y + dirY * tMin;
        let playerAngle = getPlayerPos();
        let dxAngle = mouse.x - playerAngle.x;
        let dyAngle = mouse.y - playerAngle.y;
        let entryAngle = Math.atan2(dyAngle, dxAngle) - Math.PI/2;
        let targetAngle = Math.atan2(playerAngle.y - mouse.y, playerAngle.x - mouse.x) - Math.PI/2;
        let exitAngle = targetAngle + Math.PI;
        let adx = mouse.x - bx;
        let ady = mouse.y - by;
        let amag = Math.sqrt(adx*adx + ady*ady) || 1;
        let arriveVX = adx / amag * 18;
        let arriveVY = ady / amag * 18;
        blasters.push({
            active: true,
            animating: false,
            arriving: true,
            frame: 0,
            x: bx,
            y: by,
            targetX: mouse.x,
            targetY: mouse.y,
            angle: entryAngle,
            targetAngle: targetAngle,
            exitAngle: exitAngle,
            rotSpeed: spriteRotSpeed,
            vx: 0,
            vy: 0,
            speed: spriteSpeed,
            speedGrowth: spriteSpeedGrowth,
            startX: mouse.x,
            startY: mouse.y,
            arriveVX: arriveVX,
            arriveVY: arriveVY,
            currentSpeed: spriteSpeed,
            lastFrameTime: 0,
            laserActive: false,
            laserStartTime: 0
        });
    }
    if ((e.key === 'g' || e.key === 'G')) {
        // Dispara el láser del último blaster que esté quieto
        for (let i = blasters.length - 1; i >= 0; i--) {
            let b = blasters[i];
            if (b.active && !b.animating && !b.arriving && !b.laserActive) {
                let spriteAnimAudio = document.getElementById('sprite-anim-sound');
                if (spriteAnimAudio) {
                    spriteAnimAudio.currentTime = 0;
                    spriteAnimAudio.play();
                }
                let retroAngle = b.angle + Math.PI/2;
                let vx = Math.cos(retroAngle);
                let vy = Math.sin(retroAngle);
                b.vx = -vx * b.speed;
                b.vy = -vy * b.speed;
                b.currentSpeed = b.speed;
                b.animating = true;
                b.frame = 0;
                b.lastFrameTime = performance.now();
                b.laserActive = true;
                b.laserStartTime = performance.now();
                break;
            }
        }
    }
});

function drawSprite(ctx) {
    // Renderizar todos los blasters y láseres activos
    for (let b of blasters) {
        let drawBlaster = b.active;
        let drawLaser = b.laserActive;
        if (!drawBlaster && !drawLaser) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        // Dibujar láser si está activo
        if (drawLaser) {
            let now = performance.now();
            let elapsed = now - b.laserStartTime;
            if (elapsed > laserDuration) {
                b.laserActive = false;
            } else {
                let alpha = 0.85 * (1 - (elapsed / laserDuration));
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 24;
                let offsetAdelante = spriteFrameHeight * spriteScale * 0.15;
                ctx.translate(0, offsetAdelante);
                ctx.fillStyle = '#fff';
                const laserWidth = 48;
                const laserLength = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
                ctx.fillRect(-laserWidth/2, 0, laserWidth, laserLength);
                ctx.restore();

                // --- Colisión con el corazón ---
                if (typeof x !== 'undefined' && typeof y !== 'undefined' && typeof life !== 'undefined' && typeof updateLifeBar === 'function') {
                    // Transformar la posición del corazón al sistema local del láser
                    let px = x - b.x;
                    let py = y - b.y;
                    // Rotar inversamente para alinearlo con el láser
                    let cosA = Math.cos(-b.angle);
                    let sinA = Math.sin(-b.angle);
                    let rx = px * cosA - py * sinA;
                    let ry = px * sinA + py * cosA;
                    // Ajustar offset del láser
                    ry -= offsetAdelante;
                    // Verificar si el corazón está dentro del haz
                    if (
                        Math.abs(rx) < laserWidth/2 + 10 && // margen extra para el corazón
                        ry > 0 && ry < laserLength
                    ) {
                        if (!b.laserHit) {
                            b.laserHit = true;
                            if (typeof broken !== 'undefined' && typeof resetGame === 'function') {
                                if (!broken && life > 0) {
                                    life = Math.max(0, life - 4);
                                    updateLifeBar();
                                    // Sonido de daño
                                    let hitSound = document.getElementById('hit-sound');
                                    if (hitSound) {
                                        hitSound.currentTime = 0;
                                        hitSound.play();
                                    }
                                    if (life === 0) {
                                        broken = true;
                                        setTimeout(resetGame, 4000);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (drawBlaster && b.arriving) {
            let dxArr = b.targetX - b.x;
            let dyArr = b.targetY - b.y;
            let distArr = Math.sqrt(dxArr*dxArr + dyArr*dyArr);
            let angleDiff = b.targetAngle - b.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            b.angle += angleDiff * b.rotSpeed;
            if (distArr < 18) {
                b.x = b.targetX;
                b.y = b.targetY;
                b.angle = b.targetAngle;
                b.arriving = false;
            } else {
                b.x += b.arriveVX;
                b.y += b.arriveVY;
            }
            ctx.drawImage(
                spriteImg,
                0, 0, spriteFrameWidth, spriteFrameHeight,
                -spriteFrameWidth/2 * spriteScale, -spriteFrameHeight/2 * spriteScale,
                spriteFrameWidth * spriteScale, spriteFrameHeight * spriteScale
            );
        } else if (drawBlaster && !b.animating) {
            ctx.drawImage(
                spriteImg,
                0, 0, spriteFrameWidth, spriteFrameHeight,
                -spriteFrameWidth/2 * spriteScale, -spriteFrameHeight/2 * spriteScale,
                spriteFrameWidth * spriteScale, spriteFrameHeight * spriteScale
            );
        } else if (drawBlaster) {
            let now = performance.now();
            if (now - b.lastFrameTime > spriteFrameTime) {
                b.frame++;
                b.lastFrameTime = now;
            }
            if (typeof b.currentSpeed === 'undefined') b.currentSpeed = b.speed;
            b.currentSpeed += b.speedGrowth;
            let norm = Math.sqrt(b.vx*b.vx + b.vy*b.vy) || 1;
            b.vx = (b.vx / norm) * b.currentSpeed;
            b.vy = (b.vy / norm) * b.currentSpeed;
            b.x += b.vx;
            b.y += b.vy;
            let fuera = (
                b.x < -spriteFrameWidth || b.x > window.innerWidth + spriteFrameWidth ||
                b.y < -spriteFrameHeight || b.y > window.innerHeight + spriteFrameHeight
            );
            if (fuera) {
                b.active = false;
                b.animating = false;
                ctx.restore();
                continue;
            }
            if (b.frame >= spriteFrameCount) {
                b.active = false;
                b.animating = false;
                ctx.restore();
                continue;
            }
            ctx.drawImage(
                spriteImg,
                b.frame * spriteFrameWidth, 0, spriteFrameWidth, spriteFrameHeight,
                -spriteFrameWidth/2 * spriteScale, -spriteFrameHeight/2 * spriteScale,
                spriteFrameWidth * spriteScale, spriteFrameHeight * spriteScale
            );
        }
        ctx.restore();
    }
}

// Hook en el loop principal
testSpriteDraw = function(ctx) { drawSprite(ctx); };
