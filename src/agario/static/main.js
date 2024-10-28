import { initScene, render, updateCameraPosition } from './scene.js';
import { updatePlayers, getMyPlayerId, getPlayers, interpolatePlayerPosition } from './player.js';
import { initFood, updateFood, getFood } from './food.js';
import { initNetwork, startGame, updateGameState } from './network.js';
import { initInput } from './input.js';
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
    initFood();
    initUI();
    initInput();
    updateGameState(initialGameState);

    function gameLoop() {
        requestAnimationFrame(gameLoop);
        const myPlayer = getPlayers()[getMyPlayerId()];
        if (myPlayer) {
            interpolatePlayerPosition();
            updateCameraPosition(camera, myPlayer);
        }
        updateUI();
        render(scene, camera, renderer);
    }
    const throttledGameLoop = throttle(gameLoop, 32); // 30 FPS
    throttledGameLoop();
}
