import { updatePlayers } from './player.js';
import { updateFood } from './food.js';

let socket;

export function initNetwork() {
    socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    socket.onmessage = function(e) {
        const gameState = JSON.parse(e.data);
        updateGameState(gameState);
    };
}

export function sendPlayerMove(x, y) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'move',
            x: x,
            y: y
        }));
    }
}

function updateGameState(gameState) {
    updatePlayers(gameState.players, gameState.yourPlayerId);
	console.log('received game state');
    if (gameState.food && gameState.food.length > 0) {
        console.log('Food data received:', gameState.food);
        updateFood(gameState.food);
    }
}
