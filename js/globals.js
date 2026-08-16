// js/globals.js
// --- Variables y constantes globales ---


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
// Animaciones de corazón
const HEART_FRAME_WIDTH = 16;
const HEART_FRAME_HEIGHT = 16;
const HEART_FRAME_COUNT = 4;


let heartDeathFrame = 0;
let heartDeathAnimating = false;
let heartLastFrameTime = 0;
const heartFrameDuration = 10;


//particulas
let heartVisible = true;


let deathParticles = [];


let deathAnimationFinishedTime = 0;


const particleCount = 12;


const heartAnimation = new Image();
heartAnimation.src = "assets/heartAnimation.png";


const greenAnimation = new Image();
greenAnimation.src = "assets/greenAnimation.png";


const blueAnimation = new Image();
blueAnimation.src = "assets/blueAnimation.png";
const pixelArt = [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
];


// Variables de física para modo azul
let blueGravity = 0.55; // gravedad
let blueYVel = 1;
let blueOnGround = false;  

// Variable para invertir gravedad y rotación 
let blueGravityInverted = false;
let heartRotation = 0;

// Salto variable (modo azul)
let blueJumpHeld = false;
let blueJumpKeyDown = false; // tecla de salto físicamente presionada (para auto-salto)
const blueJumpMinPower = -4.3;   // salto MÍNIMO (toque rápido de la tecla)
const blueJumpMaxPower = -10;   // salto MÁXIMO (mantener pulsado) — configurable
const blueJumpHoldPower = 0.47; // impulso extra por frame mientras se mantiene
const blueFallSlowFactor = 0.8; // gravedad reducida al mantener la tecla mientras cae (0-1, 1 = caída normal)


// Vida
let life = 20;
const maxLife = 20;


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
let shieldSpriteOffsetY = 0;   // <--- Ajusta verticalmente el sprite (positivo = abajo)


// Para animar el desplazamiento de la flecha
let shieldTargetAngle = 0;
let shieldCurrentAngle = 0;
let shieldTargetOffsetX = shieldSpriteOffsetX;
let shieldTargetOffsetY = shieldSpriteOffsetY;
let shieldCurrentOffsetX = shieldSpriteOffsetX;
let shieldCurrentOffsetY = shieldSpriteOffsetY;
const shieldLerpSpeed = 0.38; // <--- Más alto = más rápido (valor anterior: 0.18)


// Para animar el movimiento del corazón al centro
let movingToCenter = false;
let centerTargetX = 0;
let centerTargetY = 0;
const centerLerpSpeed = 0.18; // velocidad de animación


// --- Proyectiles morados (múltiples) ---
let purpleProjectiles = [];
const purpleFollowDuration = 60; // frames (1 segundo a 60fps)
let purpleLastSpawn = 0;
const purpleSpawnCooldown = 1000; // milisegundos


// Audio
const hitSound = document.getElementById('hit-sound');
const shieldSound = document.getElementById('shield-sound');
const modeSound = document.getElementById('mode-sound');
const boxShrinkSound = document.getElementById('box-shrink-sound');
const deathSound = document.getElementById('death-sound');
if (hitSound) {
    hitSound.volume = 0.3; 
}
// --- Zona verde/morada/blanca animada ---
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


// Array de plataformas
let platforms = [];


