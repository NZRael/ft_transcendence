import { initScene, render, updateCameraPosition } from './scene.js';
import { initPlayers, updatePlayers, getMyPlayerId, getPlayers } from './player.js';
import { initFood, updateFood, getFood } from './food.js';
import { initNetwork } from './network.js';
import { initInput } from './input.js';
import { initUI, updateUI } from './ui.js';
import { throttle } from './utils.js';
import { updatePlayerMovement } from './input.js';
document.addEventListener('DOMContentLoaded', (event) => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded');
        return;
    }
    
    console.log('Three.js is available:', THREE.REVISION);

    const { scene, camera, renderer } = initScene();
    initPlayers();
    initFood();
    initNetwork();
    initInput();
    initUI();

    function gameLoop() {
		requestAnimationFrame(gameLoop);
        updatePlayerMovement(getPlayers()[getMyPlayerId()]);
        updatePlayers(getPlayers(), getMyPlayerId(), camera);
        //const currentFood = getFood();
        //if (currentFood && currentFood.length > 0) {
        //   updateFood(currentFood);
        //}
        updateCameraPosition(camera, getMyPlayerId());
        updateUI();
        render(scene, camera, renderer);
    }

    const throttledGameLoop = throttle(gameLoop, 16);
    throttledGameLoop();
});
