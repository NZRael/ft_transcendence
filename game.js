document.addEventListener('DOMContentLoaded', (event) => {
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded');
        return;
    }
    
    console.log('Three.js is available:', THREE.REVISION);

    const scene = new THREE.Scene();
    const mapWidth = 10000;
    const mapHeight = 10000;
    let aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1000;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    createMapBorders();

    const MAX_FOOD = 500;
    const foodTextureSize = 64;
    const foodTexture = new THREE.DataTexture(
        new Uint8Array(foodTextureSize * foodTextureSize * 3),
        foodTextureSize,
        foodTextureSize,
        THREE.RGBFormat
    );

    function createFoodTexture() {
        const data = foodTexture.image.data;
        for (let i = 0; i < foodTextureSize; i++) {
            for (let j = 0; j < foodTextureSize; j++) {
                const index = (i * foodTextureSize + j) * 3;
                const distance = Math.sqrt(Math.pow(i - foodTextureSize / 2, 2) + Math.pow(j - foodTextureSize / 2, 2));
                if (distance < foodTextureSize / 2) {
                    data[index] = 255;
                    data[index + 1] = 255;
                    data[index + 2] = 255;
                }
            }
        }
        foodTexture.needsUpdate = true;
    }
    createFoodTexture();

    const foodGeometry = new THREE.CircleGeometry(5, 32);
    const foodMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const foodInstancedMesh = new THREE.InstancedMesh(foodGeometry, foodMaterial, MAX_FOOD);
    foodInstancedMesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 16), 16);
    foodInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 3), 3);
    scene.add(foodInstancedMesh);

    function render() {
        requestAnimationFrame(render);
        console.log('Rendering scene');
        renderer.render(scene, camera);
    }
    render();

    const socket = new WebSocket('ws://' + window.location.host + '/ws/game/');
    // socket.onopen = function(e) {
    //     console.log("WebSocket connection established");
    // };
    // socket.onerror = function(error) {
    //     console.error("WebSocket error: ", error);
    // };

    let players = {};
    let food = [];
    let myPlayerId = null;
    let keys = { w: false, a: false, s: false, d: false };
    let foodSprites = {};

    function getRandomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    socket.onmessage = function(e) {
        const gameState = JSON.parse(e.data);
        updateGameState(gameState);
    };

    function updateGameState(gameState) {
        players = gameState.players;
        if (gameState.food && gameState.food.length > 0) {
            console.log('Food data received:', gameState.food.length);
            food = gameState.food;
            updateFood();
        }
        if (gameState.yourPlayerId && !myPlayerId) {
            myPlayerId = gameState.yourPlayerId;
        }
        updateSceneObjects();
        updateCameraPosition();
        updateScoreboard();
    }

    function updateFood() {
        console.log('Updating food, food array length:', food.length);
        if (!food || food.length === 0) {
            console.warn('No food data available');
            return;
        }
        if (!foodInstancedMesh) {
            console.error('foodInstancedMesh is not initialized');
            initializeFoodInstancedMesh();
            return;
        }
        if (!foodInstancedMesh.instanceMatrix || !foodInstancedMesh.instanceColor) {
            console.warn('foodInstancedMesh properties not initialized');
            return;
        }
        const tempObject = new THREE.Object3D();
        const tempColor = new THREE.Color();

        for (let i = 0; i < food.length; i++) {
            const f = food[i];
            tempObject.position.set(f.x, f.y, 0);
            tempObject.scale.set(f.type === 'epic' ? 2 : 1, f.type === 'epic' ? 2 : 1, 1);
            tempObject.updateMatrix();
            foodInstancedMesh.setMatrixAt(i, tempObject.matrix);
            tempColor.set(f.color);
            foodInstancedMesh.setColorAt(i, tempColor);
        }

        foodInstancedMesh.count = food.length;
        foodInstancedMesh.instanceMatrix.needsUpdate = true;
        foodInstancedMesh.instanceColor.needsUpdate = true;
        console.log('Food update complete, count:', foodInstancedMesh.count);
    }

    function initializeFoodInstancedMesh() {
        foodInstancedMesh = new THREE.InstancedMesh(foodGeometry, foodMaterial, MAX_FOOD);
        foodInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(foodInstancedMesh);
    }

    function updateSceneObjects() {
        if (!players) return;
        removeObsoleteSprites();
        updateFood();

        // Mise à jour des joueurs
        Object.values(players).forEach(p => {
            let playerSprite = scene.getObjectByName(`player_${p.id}`);
            let textSprite = scene.getObjectByName(`text_${p.id}`);
            
            if (isInViewport(p.x, p.y)) {
                if (!playerSprite) {
                    const playerCanvas = document.createElement('canvas');
                    const playerContext = playerCanvas.getContext('2d');
                    const size = p.size * 2;
                    playerCanvas.width = size;
                    playerCanvas.height = size;

                    playerContext.beginPath();
                    playerContext.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
                    playerContext.fillStyle = p.color;
                    playerContext.fill();

                    const playerTexture = new THREE.CanvasTexture(playerCanvas);
                    playerTexture.minFilter = THREE.LinearFilter;
                    playerTexture.magFilter = THREE.LinearFilter;
                    const playerMaterial = new THREE.SpriteMaterial({ map: playerTexture });
                    playerSprite = new THREE.Sprite(playerMaterial);
                    playerSprite.name = `player_${p.id}`;
                    scene.add(playerSprite);
                }
                if (!textSprite) {
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

                    const maxWidth = 18;
                    let text = p.name;
                    if (textContext.measureText(text).width > maxWidth) {
                        text = text.substring(0, maxWidth - 3) + '...';
                    }

                    textContext.strokeText(text, textCanvas.width / 2, textCanvas.height / 2);
                    textContext.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

                    const textTexture = new THREE.CanvasTexture(textCanvas);
                    textTexture.minFilter = THREE.LinearFilter;
                    textTexture.magFilter = THREE.LinearFilter;
                    const textMaterial = new THREE.SpriteMaterial({ map: textTexture });
                    textSprite = new THREE.Sprite(textMaterial);
                    textSprite.name = `text_${p.id}`;
                    scene.add(textSprite);
                }
                playerSprite.visible = true;
                textSprite.visible = true;
                playerSprite.position.set(p.x, p.y, 0);
                playerSprite.scale.set(p.size * 2, p.size * 2, 1);
                textSprite.position.set(p.x, p.y, 0.1);
                textSprite.scale.set(120, 30, 1);
            } else {
                if (playerSprite) playerSprite.visible = false;
                if (textSprite) textSprite.visible = false;
            }
        });
        updateFood();
    }

    function updateCameraPosition() {
        if (myPlayerId && players[myPlayerId]) {
            const player = players[myPlayerId];
            const baseZoom = frustumSize;
            const maxZoomIncrease = 500;
            const zoomIncrease = player.size * 2;
            const currentZoom = baseZoom + Math.min(zoomIncrease, maxZoomIncrease);

            camera.left = -currentZoom * aspect / 2;
            camera.right = currentZoom * aspect / 2;
            camera.top = currentZoom / 2;
            camera.bottom = -currentZoom / 2;

            // Suivre le joueur sans limitation
            camera.position.set(player.x, player.y, 100);
            camera.updateProjectionMatrix();

            // Mettre à jour la fonction isInViewport avec les nouvelles limites de la caméra
            isInViewport = (x, y) => {
                const dx = x - camera.position.x;
                const dy = y - camera.position.y;
                const halfWidth = (camera.right - camera.left) / 2;
                const halfHeight = (camera.top - camera.bottom) / 2;
                return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
            };
        }
    }

    function updateGame() {
        if (myPlayerId && players[myPlayerId]) {
            let dx = 0, dy = 0;
            const player = players[myPlayerId];
            
            // Définition des paliers de score et de vitesse
            const baseSpeed = 20; // Vitesse de base
            const speedTiers = [
                { score: 0, speed: baseSpeed },
                { score: 10, speed: baseSpeed * 0.94 },
                { score: 20, speed: baseSpeed * 0.90 },
                { score: 30, speed: baseSpeed * 0.86 },
                { score: 40, speed: baseSpeed * 0.82 },
                { score: 50, speed: baseSpeed * 0.78 },
                { score: 60, speed: baseSpeed * 0.74 },
                { score: 70, speed: baseSpeed * 0.72 },
                { score: 80, speed: baseSpeed * 0.70 },
                { score: 90, speed: baseSpeed * 0.68 },
                { score: 100, speed: baseSpeed * 0.66 },
                { score: 120, speed: baseSpeed * 0.64 },
                { score: 140, speed: baseSpeed * 0.62 },
                { score: 160, speed: baseSpeed * 0.60 },
                { score: 180, speed: baseSpeed * 0.58 },
                { score: 200, speed: baseSpeed * 0.56 },
                { score: 250, speed: baseSpeed * 0.54 },
                { score: 300, speed: baseSpeed * 0.52 },
                { score: 350, speed: baseSpeed * 0.50 },
                { score: 400, speed: baseSpeed * 0.48 } // Vitesse minimale
            ];
            
            // Détermination de la vitesse en fonction du score
            let speed = baseSpeed;
            for (let i = speedTiers.length - 1; i >= 0; i--) {
                if (player.score >= speedTiers[i].score) {
                    speed = speedTiers[i].speed;
                    break;
                }
            }

            if (keys.w) dy += 1;
            if (keys.s) dy -= 1;
            if (keys.a) dx -= 1;
            if (keys.d) dx += 1;

            // Normalisation du vecteur de déplacement pour le mouvement diagonal
            if (dx !== 0 && dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;
            }

            // Application de la vitesse
            dx *= speed;
            dy *= speed;

            if (dx !== 0 || dy !== 0) {
                const newX = Math.max(0, Math.min(mapWidth, player.x + dx));
                const newY = Math.max(0, Math.min(mapHeight, player.y + dy));

                socket.send(JSON.stringify({
                    'type': 'move',
                    'x': newX,
                    'y': newY
                }));

                updateCameraPosition();
            }
        }
    }

    let lastUpdateTime = 0;
    const updateInterval = 16; // Environ 60 FPS

    function throttledUpdate() {
        const currentTime = Date.now();
        updateGame();
        updateCameraPosition();
        if (currentTime - lastUpdateTime >= updateInterval) {
            updateSceneObjects();
            updateMinimap();
            lastUpdateTime = currentTime;
        }
        requestAnimationFrame(throttledUpdate);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'w' || event.key === 'W') keys.w = true;
        if (event.key === 'a' || event.key === 'A') keys.a = true;
        if (event.key === 's' || event.key === 'S') keys.s = true;
        if (event.key === 'd' || event.key === 'D') keys.d = true;
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'w' || event.key === 'W') keys.w = false;
        if (event.key === 'a' || event.key === 'A') keys.a = false;
        if (event.key === 's' || event.key === 'S') keys.s = false;
        if (event.key === 'd' || event.key === 'D') keys.d = false;
    });

    
    window.addEventListener('resize', () => {
        aspect = window.innerWidth / window.innerHeight;
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateCameraPosition();
    });

    function updateScoreboard() {
        const scoreboard = document.getElementById('scoreboard');
        const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
        let scoreboardHTML = '<h3>Tableau des scores</h3>';
        scoreboardHTML += '<table><tr><th>Nom</th><th>Score</th></tr>';
        sortedPlayers.forEach(player => {
            const displayName = player.name.length > 10 ? player.name.substring(0, 10) + '...' : player.name;
            scoreboardHTML += `<tr><td>${displayName}</td><td>${player.score}</td></tr>`;
        });
        scoreboardHTML += '</table>';
        scoreboard.innerHTML = scoreboardHTML;
    }

    function removeObsoleteSprites() {
        // Suppression des joueurs obsolètes
        scene.children
            .filter(child => child.name.startsWith('player_'))
            .forEach(sprite => {
                if (!players[sprite.name.split('_')[1]]) {
                    scene.remove(sprite);
                    // Suppression du bloc de texte associé
                    const textSprite = scene.getObjectByName(`text_${sprite.name.split('_')[1]}`);
                    if (textSprite) {
                        scene.remove(textSprite);
                    }
                }
            });
    
        // Suppression de la nourriture obsolète
        Object.keys(foodSprites).forEach(id => {
            console.log('Checking food sprite:', id);
            if (!food.some(f => f.id === id)) {
                console.log('Removing food sprite:', id);
                scene.remove(foodSprites[id]);
                delete foodSprites[id];
            }
        });
    }

    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');
    const minimapSize = 150;
    minimapCanvas.width = minimapSize;
    minimapCanvas.height = minimapSize;

    function updateMinimap() {
        minimapCtx.clearRect(0, 0, minimapSize, minimapSize);

        // Dessiner le fond
        minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        minimapCtx.fillRect(0, 0, minimapSize, minimapSize);
        
        // Dessiner les axes
        minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        minimapCtx.beginPath();
        minimapCtx.moveTo(0, minimapSize / 2);
        minimapCtx.lineTo(minimapSize, minimapSize / 2);
        minimapCtx.moveTo(minimapSize / 2, 0);
        minimapCtx.lineTo(minimapSize / 2, minimapSize);
        minimapCtx.stroke();
        
        // Dessiner uniquement le joueur actuel
        if (myPlayerId && players[myPlayerId]) {
            const player = players[myPlayerId];
            const x = (player.x / mapWidth) * minimapSize;
            const y = ((mapHeight - player.y) / mapHeight) * minimapSize; // Inverser l'axe Y
            minimapCtx.fillStyle = 'red';
            minimapCtx.beginPath();
            minimapCtx.arc(x, y, 3, 0, 2 * Math.PI);
            minimapCtx.fill();
        }

        // Dessiner la nourriture
        food.forEach(f => {
            const x = (f.x / mapWidth) * minimapSize;
            const y = ((mapHeight - f.y) / mapHeight) * minimapSize; // Inverser l'axe Y
            if (f.type === 'epic') {
                minimapCtx.fillStyle = f.color;
                minimapCtx.beginPath();
                minimapCtx.arc(x, y, 2, 0, 2 * Math.PI);
                minimapCtx.fill();
            } else {
                minimapCtx.fillStyle = f.type === 'rare' ? f.color : 'green';
                minimapCtx.beginPath();
                minimapCtx.arc(x, y, 1, 0, 2 * Math.PI);
                minimapCtx.fill();
            }
        });
    }

    function isInViewport(x, y) {
        const dx = x - camera.position.x;
        const dy = y - camera.position.y;
        const halfWidth = (camera.right - camera.left) / 2;
        const halfHeight = (camera.top - camera.bottom) / 2;
        return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
    }

    function createMapBorders() {
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        const borderGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(mapWidth, 0, 0),
            new THREE.Vector3(mapWidth, mapHeight, 0),
            new THREE.Vector3(0, mapHeight, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        const borderLine = new THREE.Line(borderGeometry, borderMaterial);
        scene.add(borderLine);
    }

    throttledUpdate();
});