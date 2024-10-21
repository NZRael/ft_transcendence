import { sendPlayerMove } from './network.js';
import { updatePlayerTarget } from './player.js';

let keys = { w: false, a: false, s: false, d: false };

export function initInput() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
    if (event.key === 'w' || event.key === 'W') keys.w = true;
    if (event.key === 'a' || event.key === 'A') keys.a = true;
    if (event.key === 's' || event.key === 'S') keys.s = true;
    if (event.key === 'd' || event.key === 'D') keys.d = true;
    updatePlayerMovement();
}

function handleKeyUp(event) {
    if (event.key === 'w' || event.key === 'W') keys.w = false;
    if (event.key === 'a' || event.key === 'A') keys.a = false;
    if (event.key === 's' || event.key === 'S') keys.s = false;
    if (event.key === 'd' || event.key === 'D') keys.d = false;
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
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }

    updatePlayerTarget(dx, dy);
}
