import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { isInViewport } from './utils.js';
let socket;

export function initNetwork() {
    socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    socket.onmessage = function(e) {
        const gameState = JSON.parse(e.data);
        updateGameState(gameState);
    };
}

export function sendPlayerMove(playerId, x, y) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'move',
            playerId: playerId,
            x: x,
            y: y
        }));
    }
}

function updateGameState(gameState) {
    updatePlayers(gameState.players, gameState.yourPlayerId, gameState.camera);
	isInViewport(gameState.camera);
	console.log('received game state');
    if (gameState.food && gameState.food.length > 0) {
        console.log('Food data received:', gameState.food);
        updateFood(gameState.food);
    }
}
