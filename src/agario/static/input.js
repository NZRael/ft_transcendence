import { sendPlayerMove } from './network.js';

let keys = { w: false, a: false, s: false, d: false };

export function initInput() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

export function handleKeyDown(event) {
    if (event.key === 'w' || event.key === 'W') keys.w = true;
    if (event.key === 'a' || event.key === 'A') keys.a = true;
    if (event.key === 's' || event.key === 'S') keys.s = true;
    if (event.key === 'd' || event.key === 'D') keys.d = true;
}

export function handleKeyUp(event) {
    if (event.key === 'w' || event.key === 'W') keys.w = false;
    if (event.key === 'a' || event.key === 'A') keys.a = false;
    if (event.key === 's' || event.key === 'S') keys.s = false;
    if (event.key === 'd' || event.key === 'D') keys.d = false;
}

export function updatePlayerMovement(player) {
    let dx = 0;
    let dy = 0;
    if (keys.w) dy += 1;
    if (keys.s) dy -= 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        sendPlayerMove(player.id, newX, newY);
    }
}
