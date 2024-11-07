export function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

export function updateGameInfo(gamesData) {
    const gameInfoContainer = document.getElementById('gameInfoContainer');
    gameInfoContainer.innerHTML = '';

    if (!Array.isArray(gamesData.games)) {
        console.error('Invalid games data format');
        return;
    }

    gamesData.games.forEach((game, index) => {
        const gameBlock = document.createElement('div');
        gameBlock.className = 'gameInfoBlock';
        gameBlock.innerHTML = `
            <p>Game ${index + 1}</p>
            <p>ID: ${game.gameId}</p>
            <p>Players: ${game.players.join(', ')}</p>
            <p>Status: ${game.status}</p>
            <button class="joinGameBtn" data-gameid="${game.gameId}">
                ${game.status === 'waiting' ? 'Join Game' : 'Spectate'}
            </button>
        `;
        gameInfoContainer.appendChild(gameBlock);
    });

    const gameCountElement = document.getElementById('gameCount');
    gameCountElement.textContent = gamesData.games.length;

    // Ajouter les écouteurs d'événements pour les boutons
    document.querySelectorAll('.joinGameBtn').forEach(button => {
        button.addEventListener('click', () => {
            const gameId = button.dataset.gameid;
            joinGame(gameId);
        });
    });
}
