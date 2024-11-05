import * as THREE from './three/three.module.js';
import { initScene, render, updateCameraPosition } from './scene.js';
import { updatePlayers, getMyPlayerId, getPlayers } from './player.js';
import { initFood } from './food.js';
import { initNetwork, startGame } from './network.js';
import { initInput } from './input.js';
import { updateUI } from './ui.js';
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
    initFood(initialGameState.gameState.food);
    updateUI();
    initInput();
    updatePlayers(initialGameState.players, initialGameState.yourPlayerId);

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        const myPlayer = getPlayers()[getMyPlayerId()];
        if (myPlayer) {
            updateCameraPosition(camera, myPlayer);
        }
        updateUI();
        render(scene, camera, renderer);
    }
    const throttledGameLoop = throttle(gameLoop, 16); // 30 FPS
    throttledGameLoop();
}
