import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { startGameLoop } from './main.js';


let socket;

export function initNetwork() {
    console.log('in initNetwork, Initializing network connection...');
    socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    socket.onopen = function() {
        console.log('in initNetwork, WebSocket connection established');
    };
    socket.onmessage = function(e) {
        //console.log('Message received:', e.data);
        const data = JSON.parse(e.data);
        if (data.type === 'waiting_room') {
            console.log('in initNetwork, Entered waiting room');
            document.getElementById('waitingRoom').style.display = 'block';
            document.getElementById('gameContainer').style.display = 'none';
        } else if (data.type === 'game_started') {
            console.log('in initNetwork, Game started with data:', data);
            document.getElementById('waitingRoom').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'block';
            startGameLoop(data);
        } else if (data.type === 'food_update') {
            console.log('in initNetwork, Updating food:', data.food);
            updateFood(data.food);
        } else {
            console.log('in initNetwork, Updating game state');
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

export function sendPlayerMove(playerId, dx, dy) {
    console.log(`Tentative de déplacement du joueur ${playerId} vers (${dx}, ${dy})`);
    if (!socket) {
        console.error('Socket non initialisé');
        return;
    }
    console.log('in sendPlayerMove, État du socket:', socket.readyState);
    if (socket.readyState === WebSocket.OPEN) {
        console.log('in sendPlayerMove, Socket ouvert, envoi du mouvement');
        const message = JSON.stringify({
            type: 'move',
            playerId: playerId,
            dx: dx,
            dy: dy
        });
        console.log('in sendPlayerMove, Message à envoyer:', message);
        socket.send(message);
        console.log('in sendPlayerMove, Message envoyé avec succès');
    } else {
        console.error('in sendPlayerMove, Socket non disponible ou fermé, état:', socket.readyState);
    }
}

export function updateGameState(gameState) {
    console.log('in updateGameState, Updating game state');
    if (gameState.players) {
        console.log('in updateGameState, Updating players:', gameState.players);
        updatePlayers(gameState.players, gameState.yourPlayerId);
    }
    if (gameState.food && gameState.food.length > 0) {
        console.log('in updateGameState, Updating food:', gameState.food);
        updateFood(gameState.food);
    }
}

export function startGame() {
    socket.send(JSON.stringify({type: 'start_game'}));
}

