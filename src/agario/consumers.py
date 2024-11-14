import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .Game import Game
import uuid
import asyncio
from .logger import setup_logger

logger = setup_logger()

class GameConsumer(AsyncWebsocketConsumer):
    players = {}  # {player_id: websocket}
    active_games = {}  # {game_id: Game}
    player_count = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.player_id = None
        self.current_game_id = None

    async def connect(self):
        await self.accept()
        self.player_id = str(uuid.uuid4())
        GameConsumer.player_count += 1
        self.player_name = f"Player_{GameConsumer.player_count}"
        GameConsumer.players[self.player_id] = self

        # Envoyer la liste des parties disponibles
        await self.send_games_info()

    async def disconnect(self, close_code):
        logger.info(f"Player {self.player_id} disconnected with code {close_code}")
        
        if self.player_id in GameConsumer.players:
            GameConsumer.player_count -= 1
            del GameConsumer.players[self.player_id]
            logger.debug(f"Removed player {self.player_id} from players list")

        if self.current_game_id in GameConsumer.active_games:
            game = GameConsumer.active_games[self.current_game_id]
            game.remove_player(self.player_id)
            logger.debug(f"Removed player {self.player_id} from game {self.current_game_id}")

            # Si la partie est vide, on la nettoie et la supprime
            if len(game.players) == 0:
                logger.info(f"Game {self.current_game_id} is empty, cleaning up")
                await game.cleanup()
                del GameConsumer.active_games[self.current_game_id]
            else:
                # Informer les autres joueurs de la déconnexion
                logger.debug(f"Broadcasting updated game info after player disconnect")
                await self.broadcast_games_info()
                
                # Si la partie n'a plus qu'un joueur, on met à jour son statut
                if len(game.players) == 1:
                    game.status = "waiting"
                    logger.info(f"Game {self.current_game_id} returned to waiting status")

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'start_game':
            # Créer une nouvelle partie
            new_game = Game()
            GameConsumer.active_games[new_game.game_id] = new_game
            self.current_game_id = new_game.game_id
            new_game.add_player(self.player_id, self.player_name)
            
            # Démarrer la boucle de jeu
            await new_game.start_game_loop(self.broadcast_game_state)
            await self.broadcast_games_info()
            
            # Envoyer l'état initial au créateur
            await self.send(text_data=json.dumps({
                'type': 'game_started',
                'gameId': new_game.game_id,
                'mapWidth': new_game.map_width,
                'mapHeight': new_game.map_height,
                'maxFood': new_game.max_food,
                'gameState': new_game.get_state(),
                'players': new_game.players,
                'yourPlayerId': self.player_id
            }))

        elif data['type'] == 'join_game':
            game_id = data['gameId']
            if game_id in GameConsumer.active_games:
                game = GameConsumer.active_games[game_id]
                if game.status == "waiting":
                    self.current_game_id = game_id
                    game.add_player(self.player_id, self.player_name)
                    await self.broadcast_games_info()
                    
                    # Envoyer l'état initial au joueur qui rejoint
                    await self.send(text_data=json.dumps({
                        'type': 'game_started',
                        'gameId': game_id,
                        'mapWidth': game.map_width,
                        'mapHeight': game.map_height,
                        'maxFood': game.max_food,
                        'gameState': game.get_state(),
                        'players': game.players,
                        'yourPlayerId': self.player_id
                    }))

        elif data['type'] == 'input':
            if self.current_game_id in GameConsumer.active_games:
                game = GameConsumer.active_games[self.current_game_id]
                game.handle_player_input(self.player_id, data['key'], data['isKeyDown'])

    async def send_games_info(self):
        """Envoie la liste des parties disponibles à tous les joueurs"""
        games_info = []
        for game_id, game in GameConsumer.active_games.items():
            games_info.append({
                'gameId': game_id,
                'players': [p['name'] for p in game.players.values()],
                'status': game.status
            })

        await self.send(text_data=json.dumps({
            'type': 'waiting_room',
            'games': games_info,
            'yourPlayerId': self.player_id,
            'yourPlayerName': self.player_name
        }))

    async def broadcast_games_info(self):
        """Diffuse les informations sur les parties à tous les joueurs"""
        games_info = []
        for game_id, game in GameConsumer.active_games.items():
            games_info.append({
                'gameId': game_id,
                'players': [p['name'] for p in game.players.values()],
                'status': game.status
            })

        for player in GameConsumer.players.values():
            await player.send(text_data=json.dumps({
                'type': 'waiting_room',
                'games': games_info,
                'yourPlayerId': player.player_id,
                'yourPlayerName': player.player_name
            }))
