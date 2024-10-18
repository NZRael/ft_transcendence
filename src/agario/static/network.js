import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { isInViewport } from './utils.js';
let socket;

export function initNetwork() {
    socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    socket.onopen = function() {
        console.log('WebSocket connection established');
    };
    socket.onmessage = function(e) {
        const gameState = JSON.parse(e.data);
        updateGameState(gameState);
    };
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
    };
}

export function sendPlayerMove(playerId, x, y) {
    console.log(`Tentative de déplacement du joueur ${playerId} vers (${x}, ${y})`);
    if (!socket) {
        console.error('Socket non initialisé');
        return;
    }
    console.log('État du socket:', socket.readyState);
    if (socket.readyState === WebSocket.OPEN) {
        console.log('Socket ouvert, envoi du mouvement');
        const message = JSON.stringify({
            type: 'move',
            playerId: playerId,
            x: x,
            y: y
        });
        console.log('Message à envoyer:', message);
        socket.send(message);
        console.log('Message envoyé avec succès');
    } else {
        console.error('Socket non disponible ou fermé, état:', socket.readyState);
    }
}

function updateGameState(gameState) {
    updatePlayers(gameState.players, gameState.yourPlayerId, gameState.camera);
	console.log('received game state');
    if (gameState.food && gameState.food.length > 0) {
        console.log('Food data received:', gameState.food);
        updateFood(gameState.food);
    }
}
