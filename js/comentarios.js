// js/comentarios.js
// ============================================================================
//  GUÍA RÁPIDA DEL PROYECTO - Undertale-Game-html-multiplayer
// ============================================================================
//  Este archivo no aporta lógica al juego: es solo documentación.
//
//  Estructura de archivos:
//  - index.html        → Contenedor HTML con los canvas, barra de vida,
//                        panel de controles y audios.
//  - js/globals.js     → Variables globales (estados, canvas, dimensiones).
//  - js/entities.js    → Definición de entidades (corazón, proyectiles...).
//  - js/mechanics.js   → Lógica de juego: vida, física, proyectiles, cajas,
//                        plataformas y bucle principal.
//  - js/input.js       → Captura de teclado/ratón.
//  - js/logica_blasters.js → Lógica de Gaster Blasters (spawn, animación, láser).
//  - js/main.js        → Punto de entrada: arranca el juego.
// ============================================================================

// NOTA: los archivos JS se cargan en este orden en index.html:
// globals → entities → mechanics → logica_blasters → attacks → input → main

// --- Tip para futuros cambios ---
// El "modo escudo" (tecla 2) se gestiona en js/mechanics.js dentro de
// setShieldTarget() y en js/input.js. Si quieres añadir un nuevo modo de
// ataque, añádelo primero aquí arriba del bucle principal de mechanics.js.