import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { startGameLoop } from './main.js';

let socket;

export function initNetwork() {
    console.log('Initializing network connection...');
    connectWebSocket();
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/game/`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    try {
        socket = new WebSocket(wsUrl);
        console.log('WebSocket instance created');

        socket.onopen = function() {
            console.log('WebSocket connection established successfully');
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            console.log('WebSocket readyState:', socket.readyState);
        };

        socket.onclose = function(event) {
            console.log('WebSocket connection closed:', event.code, event.reason);
        };

        socket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (data.type === 'waiting_room') {
                document.getElementById('waitingRoom').style.display = 'block';
                document.getElementById('gameContainer').style.display = 'none';
            } else if (data.type === 'game_started') {
                document.getElementById('waitingRoom').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                startGameLoop(data);
            } else if (data.type === 'food_update') {
                updateFood(data.food);
            } else {
                updateGameState(data);
            }
        };

    } catch (error) {
        console.error('Error creating WebSocket:', error);
    }
}

export function sendPlayerMove(playerId, key, isKeyDown) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn('Socket not ready, attempting to reconnect...');
        return;
    }
    
    try {
        socket.send(JSON.stringify({
            type: 'input',
            playerId: playerId,
            key: key,
            isKeyDown: isKeyDown
        }));
    } catch (error) {
        console.error('Error sending player move:', error);
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
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Socket not ready');
        return;
    }
    
    socket.send(JSON.stringify({
        type: 'start_game'
    }));
}

