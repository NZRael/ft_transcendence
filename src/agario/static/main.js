import { initScene, render, updateCameraPosition } from './scene.js';
import { updatePlayers, getMyPlayerId, getPlayers } from './player.js';
import { initFood, updateFood, getFood } from './food.js';
import { initNetwork, startGame, updateGameState } from './network.js';
import { initInput, updatePlayerMovement } from './input.js';
import { initUI, updateUI } from './ui.js';
import { throttle } from './utils.js';

let scene, camera, renderer;

document.addEventListener('DOMContentLoaded', (event) => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded');
        return;
    }
    console.log('Three.js is available:', THREE.REVISION);
    const startGameBtn = document.getElementById('startGameBtn');
    startGameBtn.addEventListener('click', () => {
        startGame();
    });
    initNetwork();
});

export function startGameLoop(initialGameState) {
    ({ scene, camera, renderer } = initScene());
    initFood();// Initialise la structure de la nourriture sans données
    initInput();
    initUI();
    updateGameState(initialGameState);  // Met à jour l'état du jeu avec les données initiales
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        const myPlayer = getPlayers()[getMyPlayerId()];
        if (myPlayer) {
            updatePlayerMovement(myPlayer);
            updateCameraPosition(camera, myPlayer);
        }
        // updatePlayers(getPlayers(), getMyPlayerId());
        updateUI();
        render(scene, camera, renderer);
    }

    const throttledGameLoop = throttle(gameLoop, 32);
    throttledGameLoop();
}
