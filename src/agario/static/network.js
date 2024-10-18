import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { startGameLoop } from './main.js';


let socket;

export function initNetwork() {
    console.log('Initializing network connection...');
    socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    socket.onopen = function() {
        console.log('WebSocket connection established');
    };
    socket.onmessage = function(e) {
        console.log('Message received:', e.data);
        const data = JSON.parse(e.data);
        if (data.type === 'waiting_room') {
            console.log('Entered waiting room');
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('gameContainer').style.display = 'none';
        } else if (data.type === 'game_started') {
            console.log('Game started with data:', data);
            document.getElementById('waitingRoom').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            startGameLoop(data);
        } else {
            console.log('Updating game state');
            updateGameState(data);
        }
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

export function updateGameState(gameState) {
    console.log('Updating game state:', gameState);
    if (gameState.players) {
        console.log('Updating players:', gameState.players);
        updatePlayers(gameState.players, gameState.yourPlayerId);
    }
    if (gameState.food && gameState.food.length > 0) {
        console.log('Updating food:', gameState.food);
        updateFood(gameState.food);
    }
}

export function startGame() {
    socket.send(JSON.stringify({type: 'start_game'}));
}

