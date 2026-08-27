// js/attacks.js
// --- Sistema de ataques unificado y escalable ---

/**
 * Tipos de ataque disponibles
 * Cada tipo define: comportamiento, renderizado, colisión, sonido
 */
const AttackTypes = {
    // Proyectil blanco simple (click A->S)
    WHITE: {
        name: 'white',
        color: '#cccccc',
        glowColor: '#cccccc',
        speed: 7,
        damage: 1,
        homing: false,
        followDuration: 0,
        spawnSound: null,
        hitSound: 'hit-sound',
        draw: (ctx, p) => {
            const angle = p.active 
                ? (p.angle ?? Math.atan2(p.vy, p.vx))
                : Math.atan2(y - p.y, x - p.x);
            drawPixelBone(ctx, p.x, p.y, angle, p.color, p.glowColor);
        },
        onUpdate: (p, dt) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    },

    // Proyectil blanco que persigue (modo escudo)
    WHITE_HOMING: {
        name: 'white_homing',
        color: '#ffffff',
        glowColor: '#00eaff',
        speed: 0,
        damage: 2,
        homing: true,
        followDuration: 60,
        spawnSound: null,
        hitSound: 'hit-sound',
        draw: (ctx, p) => {
            const angle = p.follow && p.timer > 0
                ? Math.atan2(y - p.y, x - p.x)
                : (p.angle ?? Math.atan2(p.vy, p.vx));
            drawPixelBone(ctx, p.x, p.y, angle, p.color, p.glowColor);
        },
        onUpdate: (p, dt) => {
            if (p.follow && p.timer > 0) {
                const dx = x - p.x, dy = y - p.y;
                const dist = Math.hypot(dx, dy) || 1;
                p.vx = dx / dist * p.speed;
                p.vy = dy / dist * p.speed;
                p.timer--;
                if (p.timer <= 0) p.follow = false;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    },

    // Proyectil morado (hueso persigue)
PURPLE: {
        name: 'purple',
        color: '#a020f0',
        glowColor: '#a020f0',
        speed: 4.6,
        damage: 1,
        homing: true,
        followDuration: 60,
        spawnSound: null,
        hitSound: 'hit-sound',
        cooldown: 1000,
        draw: (ctx, p) => {
            // Siguiendo (homing): mira al jugador actual
            // No siguiendo: mira dirección de viaje
            const angle = p.follow && p.timer > 0
                ? Math.atan2(y - p.y, x - p.x)
                : (p.angle ?? Math.atan2(p.vy, p.vx));
            drawPixelBone(ctx, p.x, p.y, angle, p.color, p.glowColor);
        },
        onUpdate: (p, dt) => {
            if (p.follow && p.timer > 0) {
                const dx = x - p.x, dy = y - p.y;
                const dist = Math.hypot(dx, dy) || 1;
                p.vx = dx / dist * p.speed;
                p.vy = dy / dist * p.speed;
                p.timer--;
                if (p.timer <= 0) p.follow = false;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    },

    // Ataque de escudo (WASD en modo escudo) - Flecha
    SHIELD_SLASH: {
        name: 'shield_slash',
        color: '#00e1ff',
        glowColor: '#00eeff',
        speed: 12,
        damage: 1,
        homing: true,
        followDuration: 60,
        hitboxOffset: { x: 15, y: 0 },  // Desplazamiento hitbox desde la punta de la flecha (px)
        spawnSound: 'none',
        hitSound: 'hit-sound',
        draw: (ctx, p) => {
            const angle = p.follow && p.timer > 0
                ? Math.atan2(y - p.y, x - p.x)
                : (p.angle ?? Math.atan2(p.vy, p.vx));
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            
            // Flecha igual a la del escudo (drawShield en entities.js) pero más pequeña
            const arrowLen = 30;  // shield usa 76, esta 30
            const arrowW   = 5;   // shield usa 3, esta 2
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0,         -arrowW / 2);
            ctx.lineTo(arrowLen,  -arrowW / 2);
            ctx.lineTo(arrowLen,  -arrowW);
            ctx.lineTo(arrowLen + 12, 0);  // punta más corta (shield usa +18)
            ctx.lineTo(arrowLen,   arrowW);
            ctx.lineTo(arrowLen,   arrowW / 2);
            ctx.lineTo(0,          arrowW / 2);
            ctx.closePath();
            
            ctx.fillStyle   = p.color || '#00cfff';
            ctx.shadowColor = p.glowColor || '#00cfff';
            ctx.shadowBlur  = 10;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur  = 0;
            
            ctx.restore();
        },
        onUpdate: (p, dt) => {
            if (p.follow && p.timer > 0) {
                // Homing: ajustar dirección hacia jugador pero mantener magnitud de velocidad
                const dx = x - p.x, dy = y - p.y;
                const dist = Math.hypot(dx, dy) || 1;
                const speed = Math.hypot(p.vx, p.vy) || p.speed;
                p.vx = dx / dist * speed;
                p.vy = dy / dist * speed;
                p.timer--;
                if (p.timer <= 0) p.follow = false;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    },

    // Láser de Gaster Blaster
    BLASTER_LASER: {
        name: 'blaster_laser',
        color: '#fcfcfc',
        glowColor: '#faf8f8',
        speed: 0,
        damage: 1,
        homing: false,
        followDuration: 0,
        duration: 700,
        spawnSound: 'sonido-lanzarblaster',
        hitSound: 'hit-sound',
        draw: (ctx, p) => {
            const elapsed = performance.now() - p.laserStartTime;
            const alpha = 0.85 * (1 - elapsed / p.duration);
            const offsetAdelante = (window.spriteFrameHeight || 70) * (window.spriteScale || 2.0) * 0.15;
            const laserWidth = 48;
            const laserLength = Math.hypot(window.innerWidth, window.innerHeight);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.glowColor || '#fff';
            ctx.shadowBlur = 24;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.translate(0, offsetAdelante);
            ctx.fillStyle = p.color || '#fff';
            ctx.fillRect(-laserWidth / 2, 0, laserWidth, laserLength);
            ctx.restore();
        },
        onUpdate: (p, dt) => {
            p.active = performance.now() - p.laserStartTime < p.duration;
        },
        checkCollision: (p) => {
            const cosA = Math.cos(-p.angle), sinA = Math.sin(-p.angle);
            const lpx = x - p.x, lpy = y - p.y;
            const offsetAdelante = (window.spriteFrameHeight || 70) * (window.spriteScale || 2.0) * 0.15;
            const rx = lpx * cosA - lpy * sinA;
            const ry = (lpx * sinA + lpy * cosA) - offsetAdelante;
            return Math.abs(rx) < 48 / 2 + 10 && ry > 0 && ry < Math.hypot(window.innerWidth, window.innerHeight);
        }
    }
};

/**
 * Factory para crear instancias de ataque
 */
class AttackFactory {
    static create(typeName, params = {}) {
        const type = AttackTypes[typeName];
        if (!type) throw new Error(`Attack type ${typeName} not found`);
        
        const now = Date.now();
        const base = {
            id: `${typeName}_${now}_${Math.random().toString(36).substr(2, 9)}`,
            type: typeName,
            active: true,
            hit: false,
            fired: false,
            createdAt: now,
            ...params
        };
        
        // Configurar velocidad para ataques homing
        if (type.homing && type.speed === 0 && params.initDist) {
            base.speed = params.initDist / 60;
        } else {
            base.speed = type.speed;
        }
        
        // Configurar timer de seguimiento
        if (type.followDuration) {
            base.follow = true;
            base.timer = type.followDuration;
        }
        
        // Reproducir sonido de spawn
        if (type.spawnSound) {
            const audio = document.getElementById(type.spawnSound);
            if (audio) { audio.currentTime = 0; audio.play(); }
        }
        
        const result = { ...base, ...type };
        console.log('[AttackFactory] Created:', { id: result.id, type: result.type, active: result.active, fired: result.fired, name: result.name, homing: result.homing, followDuration: result.followDuration });
        return result;
    }
}

/**
 * Manager centralizado de todos los ataques/proyectiles
 */
class AttackManager {
    constructor() {
        this.attacks = [];
        this.cooldowns = new Map(); // typeName -> lastSpawnTime
    }

    /**
     * Spawnear un ataque si no está en cooldown
     */
    spawn(typeName, params = {}) {
        const type = AttackTypes[typeName];
        if (!type) {
            console.warn(`[AttackManager] Tipo de ataque desconocido: ${typeName}`);
            return null;
        }
        if (type.cooldown) {
            const last = this.cooldowns.get(typeName) || 0;
            if (Date.now() - last < type.cooldown) {
                console.log(`[AttackManager] ${typeName} en cooldown`);
                return null;
            }
            this.cooldowns.set(typeName, Date.now());
        }
        
        const attack = AttackFactory.create(typeName, params);
        this.attacks.push(attack);
        console.log(`[AttackManager] Spawned ${typeName}`, { id: attack.id, x: attack.x, y: attack.y, active: attack.active });
        return attack;
    }

    /**
     * Spawnear múltiples ataques del mismo tipo
     */
    spawnMultiple(typeName, count, paramsGenerator) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const params = paramsGenerator ? paramsGenerator(i) : {};
            const attack = this.spawn(typeName, params);
            if (attack) results.push(attack);
        }
        return results;
    }

    /**
     * Disparar todos los ataques inactivos de un tipo
     */
    fireAll(typeName, activator) {
        let count = 0;
        console.log(`[AttackManager] fireAll ${typeName}: buscando en ${this.attacks.length} ataques totales`);
        this.attacks.forEach((a, i) => {
            console.log(`  [${i}] type=${a.type}, active=${a.active}, fired=${a.fired}, match=${a.type === typeName && !a.active && !a.fired}`);
        });
        for (const a of this.attacks) {
            if (a.type === typeName && !a.active && !a.fired) {
                activator(a);
                a.active = true;
                a.fired = true;
                count++;
            }
        }
        console.log(`[AttackManager] fireAll ${typeName}: activados ${count} proyectiles`);
    }

    /**
     * Actualizar todos los ataques
     */
    update(dt) {
        const surviving = [];
        let activeCount = 0;
        
        for (const a of this.attacks) {
            // Mantener ataques inactivos (colocados pero no disparados)
            if (!a.active) {
                surviving.push(a);
                continue;
            }
            
            activeCount++;
            
            // Lógica de actualización específica del tipo
            if (a.onUpdate) a.onUpdate(a, dt);
            
            // Verificar límites de pantalla
            const margin = 50;
            if (a.x < -margin || a.x > window.innerWidth + margin ||
                a.y < -margin || a.y > window.innerHeight + margin) {
                console.log(`[AttackManager] ${a.type} fuera de límites, eliminando`);
                continue;
            }
            
            // Colisión con escudo
            if (this.checkShieldCollision(a)) continue;
            
            // Colisión con corazón
            if (!a.hit && !broken && this.checkHeartCollision(a)) {
                a.hit = true;
                this.applyDamage(a);
                if (a.type !== 'blaster_laser') continue; // láser puede golpear múltiples veces
            }
            
            surviving.push(a);
        }
        
        if (activeCount > 0) console.log(`[AttackManager] Update: ${activeCount} activos, ${this.attacks.length - activeCount} inactivos, ${surviving.length} totales`);
        this.attacks = surviving;
    }

    checkShieldCollision(a) {
        if (!lockedCenter || !shieldActive || !shieldDir || !a.attackType) return false;
        
        const offset = shieldRadius + 18;
        let shieldAngle = 0;
        if (shieldDir === 'up') shieldAngle = -Math.PI / 2;
        else if (shieldDir === 'down') shieldAngle = Math.PI / 2;
        else if (shieldDir === 'left') shieldAngle = Math.PI;
        else if (shieldDir === 'right') shieldAngle = 0;
        
        const fx = x + Math.cos(shieldAngle) * offset;
        const fy = y + Math.sin(shieldAngle) * offset;
        
        if (Math.hypot(a.x - fx, a.y - fy) < 24) {
            const audio = document.getElementById('shield-sound');
            if (audio) { audio.currentTime = 0; audio.play(); }
            return true; // Bloqueado
        }
        return false;
    }

    checkHeartCollision(a) {
        // Colisión personalizada para láser
        if (a.type === 'blaster_laser' && a.checkCollision) {
            return a.checkCollision(a);
        }
        // Hitbox configurable por tipo de ataque, rotada según el ángulo del ataque
        const type = AttackTypes[a.type];
        const offset = type?.hitboxOffset || { x: 0, y: 0 };
        
        // Rotar offset según el ángulo del ataque (misma lógica que draw)
        const angle = a.angle ?? Math.atan2(a.vy, a.vx);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hitX = a.x + offset.x * cos - offset.y * sin;
        const hitY = a.y + offset.x * sin + offset.y * cos;
        
        return checkCollision(hitX, hitY);
    }

    applyDamage(a) {
        const type = AttackTypes[a.type];
        const audio = document.getElementById(type.hitSound || 'hit-sound');
        if (audio) { audio.currentTime = 0; audio.play(); }
        
        if (life > 0) {
            // Usar damage del tipo de ataque (type.damage), no hardcodeado
            const dmg = type.damage;
            life = Math.max(0, life - dmg);
            updateLifeBar();
            
            if (life === 0) {
                triggerDeath();
            }
        }
    }

    /**
     * Renderizar todos los ataques
     */
    render(ctx) {
        let rendered = 0;
        for (const a of this.attacks) {
            // Dibujar tanto activos como inactivos (colocados)
            if (a.draw) {
                a.draw(ctx, a);
                rendered++;
            }
        }
        if (rendered > 0) console.log(`[AttackManager] Rendered ${rendered} ataques (${this.attacks.filter(a => a.active).length} activos, ${this.attacks.filter(a => !a.active).length} inactivos)`);
    }

    /**
     * Limpiar todos los ataques
     */
    clear() {
        this.attacks = [];
    }

    /**
     * Obtener ataques por tipo
     */
    getByType(typeName) {
        return this.attacks.filter(a => a.type === typeName && a.active);
    }

    /**
     * Obtener ataques inactivos (listos para disparar)
     */
    getInactive(typeName) {
        const inactive = this.attacks.filter(a => a.type === typeName && !a.active);
        console.log(`[AttackManager] getInactive(${typeName}): ${inactive.length} inactivos de ${this.attacks.length} totales`);
        return inactive;
    }
}

// Instancia global
const attackManager = new AttackManager();
console.log('[AttackManager] Inicializado', { AttackTypes: Object.keys(AttackTypes) });

/**
 * Definiciones de "combos" o patrones de ataque complejos
 * Permite crear ataques compuestos fácilmente
 */
const AttackPatterns = {
    // Círculo de proyectiles morados
    purpleCircle: (centerX, centerY, count = 8) => {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 200;
            const tx = centerX + Math.cos(angle) * radius;
            const ty = centerY + Math.sin(angle) * radius;
            attackManager.spawn('PURPLE', { x: tx, y: ty, vx: 0, vy: 0 });
        }
    },

    // Oleada de blasters desde los bordes
    blasterWave: (count = 4) => {
        const player = { x, y };
        for (let i = 0; i < count; i++) {
            const side = i % 4;
            let bx, by, tx, ty;
            switch (side) {
                case 0: bx = -100; by = Math.random() * window.innerHeight; tx = player.x; ty = player.y; break;
                case 1: bx = window.innerWidth + 100; by = Math.random() * window.innerHeight; tx = player.x; ty = player.y; break;
                case 2: bx = Math.random() * window.innerWidth; by = -100; tx = player.x; ty = player.y; break;
                case 3: bx = Math.random() * window.innerWidth; by = window.innerHeight + 100; tx = player.x; ty = player.y; break;
            }
            spawnBlasterToward(tx, ty); // usa el sistema existente de blasters
        }
    },

    // Lluvia de huesos
    boneRain: (count = 15) => {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const tx = Math.random() * window.innerWidth;
                attackManager.spawn('WHITE_HOMING', { 
                    x: tx, 
                    y: -50, 
                    vx: 0, 
                    vy: 0,
                    attackType: 'rain'
                });
            }, i * 100);
        }
    }
};

/**
 * Integración con input.js - mapeo de teclas a ataques
 * Usa e.code (ej: 'KeyA', 'KeyW') para compatibilidad internacional
 * Cada tecla puede tener múltiples bindings según el contexto (validator)
 */
// Centro de pantalla (target del modo escudo)
const cx = () => window.innerWidth / 2;
const cy = () => window.innerHeight / 2;

const AttackKeyBindings = {
    'KeyA': [
        { type: 'WHITE', validator: () => !lockedCenter, params: () => ({ x: mousePos.x, y: mousePos.y, vx: 0, vy: 0, active: false }) },
        { type: 'SHIELD_SLASH', validator: () => lockedCenter && shieldActive, params: () => ({ x: 0, y: cy(), attackType: 'left', vx: cx() / 60, vy: 0 }) }
    ],
    'KeyS': [
        { type: 'WHITE', validator: () => !lockedCenter, action: 'fire' },
        { type: 'SHIELD_SLASH', validator: () => lockedCenter && shieldActive, params: () => ({ x: cx(), y: window.innerHeight, attackType: 'down', vx: 0, vy: -cy() / 60 }) }
    ],
    'KeyZ': [
        { type: 'PURPLE', validator: () => !lockedCenter, params: () => ({ x: mousePos.x, y: mousePos.y, vx: 0, vy: 0, active: false }) }
    ],
    'KeyX': [
        { type: 'PURPLE', validator: () => true, action: 'fireAll' }
    ],
    'KeyF': [
        { type: 'BLASTER', validator: () => true, custom: () => { const a = document.getElementById('sonido-cargarblaster'); if (a) { a.currentTime = 0; a.play(); } const b = spawnBlasterToward(mousePos.x, mousePos.y); if (b) b.damage = (window.AttackTypes?.BLASTER_LASER?.damage) || 4; } }
    ],
    'KeyR': [
        { type: 'BLASTER', validator: () => true, custom: () => { const a = document.getElementById('sonido-cargarblaster'); if (a) { a.currentTime = 0; a.play(); } const b = spawnBlasterToward(Math.random() * window.innerWidth, Math.random() * window.innerHeight); if (b) b.damage = (window.AttackTypes?.BLASTER_LASER?.damage) || 4; } }
    ],
    'KeyG': [
        { type: 'BLASTER', validator: () => true, custom: () => {
            for (let i = blasters.length - 1; i >= 0; i--) {
                const b = blasters[i];
                if (b.active && !b.animating && !b.arriving && !b.laserActive) {
                    fireBlaster(b);
                    const audio = document.getElementById('sonido-lanzarblaster');
                    if (audio) { audio.currentTime = 0; audio.play(); }
                    break;
                }
            }
        }}
    ],
    'KeyT': [
        { type: 'BLASTER', validator: () => true, custom: () => {
            let fired = 0;
            for (const b of blasters) {
                if (b.active && !b.animating && !b.arriving && !b.laserActive) {
                    fireBlaster(b);
                    fired++;
                }
            }
            if (fired > 0) {
                const audio = document.getElementById('sonido-lanzarblaster');
                if (audio) { audio.currentTime = 0; audio.play(); }
            }
        }}
    ],
    'KeyW': [
        { type: 'SHIELD_SLASH', validator: () => lockedCenter && shieldActive, params: () => ({ x: cx(), y: 0, attackType: 'up', vx: 0, vy: cy() / 60 }) }
    ],
    'KeyD': [
        { type: 'SHIELD_SLASH', validator: () => lockedCenter && shieldActive, params: () => ({ x: window.innerWidth, y: cy(), attackType: 'right', vx: -cx() / 60, vy: 0 }) }
    ]
};

// Exportar
window.AttackKeyBindings = AttackKeyBindings;

// Exportar para uso global
window.AttackTypes = AttackTypes;
window.AttackFactory = AttackFactory;
window.AttackManager = AttackManager;
window.attackManager = attackManager;
window.AttackPatterns = AttackPatterns;
window.AttackKeyBindings = AttackKeyBindings;