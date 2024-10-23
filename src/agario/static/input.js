import { sendPlayerMove } from './network.js';
import { updatePlayerTarget } from './player.js';

let keys = { w: false, a: false, s: false, d: false };

export function initInput() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
    if (event.key === 'w' || event.key === 'up') keys.w = true;
    if (event.key === 'a' || event.key === 'left') keys.a = true;
    if (event.key === 's' || event.key === 'down') keys.s = true;
    if (event.key === 'd' || event.key === 'right') keys.d = true;
    updatePlayerMovement();
}

function handleKeyUp(event) {
    if (event.key === 'w' || event.key === 'up') keys.w = false;
    if (event.key === 'a' || event.key === 'left') keys.a = false;
    if (event.key === 's' || event.key === 'down') keys.s = false;
    if (event.key === 'd' || event.key === 'right') keys.d = false;
    updatePlayerMovement();
}

function updatePlayerMovement() {
    let dx = 0;
    let dy = 0;
    if (keys.w) dy += 1;
    if (keys.s) dy -= 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Normaliser le vecteur de direction
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length !== 0) {
        dx /= length;
        dy /= length;
    }
    updatePlayerTarget(dx, dy);
}
