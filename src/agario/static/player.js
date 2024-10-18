import { scene, getScene } from './scene.js';
import { updateScoreboard } from './ui.js';
import { getRandomColor } from './utils.js';

let players = {};
let myPlayerId = null;

export function updatePlayers(newPlayers, newMyPlayerId) {
    if (newPlayers && Object.keys(newPlayers).length > 0) {
        console.log('Updating players:', newPlayers);
        players = newPlayers;
        if (newMyPlayerId && !myPlayerId) {
            myPlayerId = newMyPlayerId;
            console.log('My player ID set:', myPlayerId);
        }
        const currentScene = getScene();
        if (currentScene) {
            Object.values(players).forEach(player => updatePlayerSprite(player, currentScene));
        }
        updateScoreboard();
    }
}

export function createPlayerSprite(player) {
    const playerCanvas = document.createElement('canvas');
    const playerContext = playerCanvas.getContext('2d');
    const size = player.size * 2;
    playerCanvas.width = size;
    playerCanvas.height = size;

    playerContext.beginPath();
    playerContext.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
    playerContext.fillStyle = player.color || getRandomColor();
    playerContext.fill();

    const playerTexture = new THREE.CanvasTexture(playerCanvas);
    playerTexture.minFilter = THREE.LinearFilter;
    playerTexture.magFilter = THREE.LinearFilter;
    const playerMaterial = new THREE.SpriteMaterial({ map: playerTexture });
    const playerSprite = new THREE.Sprite(playerMaterial);
    playerSprite.name = `player_${player.id}`;
    playerSprite.scale.set(player.size * 2, player.size * 2, 1);
    scene.add(playerSprite);

    return playerSprite;
}

function updatePlayerSprite(player, scene) {
    let playerSprite = scene.getObjectByName(`player_${player.id}`);
    let textSprite = scene.getObjectByName(`text_${player.id}`);
    
    if (!playerSprite) {
        playerSprite = createPlayerSprite(player);
        scene.add(playerSprite);
    }
    if (!textSprite) {
        textSprite = createTextSprite(player);
        scene.add(textSprite);
    }
    
    playerSprite.position.set(player.x, player.y, 0);
    playerSprite.scale.set(player.size * 2, player.size * 2, 1);
    
    textSprite.position.set(player.x, player.y, 0.1);
    textSprite.scale.set(120, 30, 1);
    
    // La visibilité sera gérée par la caméra et le rendu
}

function createTextSprite(player) {
    const textCanvas = document.createElement('canvas');
    const textContext = textCanvas.getContext('2d');
    const fixedTextSize = 70;
    textCanvas.width = fixedTextSize * 8;
    textCanvas.height = fixedTextSize * 2;

    textContext.font = `bold ${fixedTextSize}px Arial`;
    textContext.fillStyle = 'white';
    textContext.strokeStyle = 'black';
    textContext.lineWidth = fixedTextSize / 25;
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';

    let text = player.name;
    const maxWidth = 18;
    if (text.length > maxWidth) {
        text = text.substring(0, maxWidth - 3) + '...';
    }

    textContext.strokeText(text, textCanvas.width / 2, textCanvas.height / 2);
    textContext.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.magFilter = THREE.LinearFilter;
    const textMaterial = new THREE.SpriteMaterial({ map: textTexture });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.name = `text_${player.id}`;
    scene.add(textSprite);

    return textSprite;
}

export function getPlayers() {
    return players;
}

export function getMyPlayerId() {
    return myPlayerId;
}
