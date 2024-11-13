import { updatePlayers } from './player.js';
import { updateFood } from './food.js';
import { startGameLoop } from './main.js';
import { updateGameInfo } from './utils.js';

let socket;

export function initNetwork() {
    console.log('Initializing network connection...');
    connectWebSocket();
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use the WS_URL from environment
    const envUrl = window.ENV.WS_URL;
    const wsUrl = `${protocol}//${envUrl}/ws/game/`;
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
            console.log('Received message:', data);
            switch (data.type) {
                case 'waiting_room':
                    document.getElementById('waitingRoom').style.display = 'block';
                    document.getElementById('gameContainer').style.display = 'none';
                    break;
                case 'game_started':
                    console.log('Game started:', data);
                    updateGameInfo(data);
                    document.getElementById('waitingRoom').style.display = 'none';
                    document.getElementById('gameContainer').style.display = 'block';
                    document.getElementById('gameInfoContainer').style.display = 'none';
                    startGameLoop(data);
                    break;
                case 'game_joined':
                    console.log('Joined existing game:', data);
                    document.getElementById('waitingRoom').style.display = 'none';
                    document.getElementById('gameContainer').style.display = 'block';
                    document.getElementById('gameInfoContainer').style.display = 'none';
                    startGameLoop(data);
                    break;
                case 'food_update':
                    console.log('FOOD_UPDATE');
                    updateFood(data.food);
                    updatePlayers(data.players, data.yourPlayerId);
                    break;
                case 'players_update':
                    console.log('PLAYERS_UPDATE');
                    updatePlayers(data.players, data.yourPlayerId);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
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

export function startGame() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Socket not ready');
        return;
    }

    socket.send(JSON.stringify({
        type: 'start_game'
    }));
}

export function joinGame(gameId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('Socket not ready');
        return;
    }
    
    socket.send(JSON.stringify({
        type: 'join_game',
        gameId: gameId
    }));
}

