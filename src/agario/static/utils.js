import { joinGame } from './network.js';

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

export function updateGameInfo(data) {
    const gameInfoContainer = document.getElementById('gameInfoContainer');
    if (!gameInfoContainer) return;
    gameInfoContainer.innerHTML = '';
    // Vérifier si data est un objet valide
    if (!data || typeof data !== 'object') {
        console.warn('Données invalides reçues dans updateGameInfo');
        return;
    }

    // // Si les données viennent du message 'game_started'
    // if (data.type === 'game_started') {
    //     const gameBlock = document.createElement('div');
    //     gameBlock.className = 'gameInfoBlock';
    //     gameBlock.innerHTML = `
    //         <p>Partie en cours</p>
    //         <p>ID: ${data.gameId}</p>
    //         <p>Joueurs: ${Object.values(data.players).map(p => p.name).join(', ')}</p>
    //     `;
    //     gameInfoContainer.appendChild(gameBlock);
    //     return;
    // }

    // Si les données viennent du message 'waiting_room'
    const games = Array.isArray(data.games) ? data.games : [];

    if (games.length === 0) {
        const gameBlock = document.createElement('div');
        gameBlock.className = 'gameInfoBlock';
        gameBlock.innerHTML = '<p>No games available</p>';
        gameInfoContainer.appendChild(gameBlock);
        return;
    }
    else {
        games.forEach((game, index) => {
            const gameBlock = document.createElement('div');
            gameBlock.className = 'gameInfoBlock';
            gameBlock.innerHTML = `
            <p>Game ${index + 1}</p>
            <p>Game ID: ${game.gameId}</p>
            <p>Players: ${game.players.join(', ')}</p>
                <button class="joinGameBtn" data-gameid="${game.gameId}">
                    ${game.status === 'custom' ? 'Join' : 'Watch'}
                </button>
            `;
            gameInfoContainer.appendChild(gameBlock);
        });
    }

    const gameCountElement = document.getElementById('gameCount');
    if (gameCountElement) {
        gameCountElement.textContent = games.length;
    }

    // Ajouter les écouteurs d'événements pour les boutons
    document.querySelectorAll('.joinGameBtn').forEach(button => {
        button.addEventListener('click', () => {
            const gameId = button.dataset.gameid;
            joinGame(gameId);
        });
    });
}
