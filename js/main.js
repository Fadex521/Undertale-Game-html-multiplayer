// js/main.js
// --- Punto de entrada: inicialización del juego ---


// Redimensionar el canvas de proyectiles al tamaño inicial
resizeProjectileCanvas();


// Agrega transición CSS a la barra de vida para animar el movimiento
const lifeBarContainer = document.getElementById('life-bar-container');
lifeBarContainer.style.transition = 'left 0.5s cubic-bezier(.4,1.6,.6,1), right 0.5s cubic-bezier(.4,1.6,.6,1), transform 0.5s cubic-bezier(.4,1.6,.6,1)';


// Arranque
updateLifeBar();
drawHeart(ctx);
updateHeart();
setLifeBarPosition(false);
move();

