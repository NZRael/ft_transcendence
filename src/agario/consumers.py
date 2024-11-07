import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_state import game_state, GameState
from asgiref.sync import async_to_sync
import time
import uuid
import asyncio
from .logger import setup_logger

logger = setup_logger()

class GameConsumer(AsyncWebsocketConsumer):
    players = {}
    active_games = {}  # Dictionnaire pour stocker toutes les parties actives
    player_count = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_loop_task = None
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
            del GameConsumer.players[self.player_id]
    
        if GameConsumer.active_games:
            GameConsumer.active_games.remove(self.current_game_id)
            # Arrêter la boucle de jeu uniquement si c'est la dernière partie
            if len(GameConsumer.active_games) == 0:
                if hasattr(self, 'game_loop_task') and self.game_loop_task:
                    self.game_loop_task.cancel()
                    try:
                        await self.game_loop_task
                    except asyncio.CancelledError:
                        pass
                GameConsumer.active_games = None
                GameConsumer.player_count = 0
    
        GameConsumer.player_count = max(0, GameConsumer.player_count - 1)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'start_game':
            game_id = str(uuid.uuid4())
            new_game = GameState()
            GameConsumer.active_games[game_id] = new_game
            self.current_game_id = game_id
            
            # Ajouter le joueur à la nouvelle partie
            new_game.add_player(self.player_id, self.player_name)
            
            # Informer tous les clients de la nouvelle partie
            await self.broadcast_games_info()
            
        elif data['type'] == 'join_game':
            game_id = data['gameId']
            if game_id in GameConsumer.active_games:
                game = GameConsumer.active_games[game_id]
                self.current_game_id = game_id
                game.add_player(self.player_id, self.player_name)
                await self.broadcast_games_info()
        elif data['type'] == 'input': ##########################################
            if self.current_game_id in GameConsumer.active_games:
                GameConsumer.active_games[self.current_game_id].handle_player_input(
                    data['playerId'],
                    data['key'],
                    data['isKeyDown']
                )
        elif data['type'] == 'move': ##########################################
            if self.current_game_id in GameConsumer.active_games:
                dx = float(data.get('dx', 0))
                dy = float(data.get('dy', 0))
                GameConsumer.active_games[self.current_game_id].set_player_movement(data['playerId'], dx, dy)
        await self.throttled_send_game_state()

    async def send_game_state_to_group(self):
        await self.channel_layer.group_send(
            "game",
            {
                "type": "food_update",
                "food_update": game_state.get_state()
            }
        )

    async def throttled_send_game_state(self):
        current_time = time.time()
        if not hasattr(self, 'last_update_time') or current_time - self.last_update_time > 0.1:
            await self.send_game_state_to_group()
            self.last_update_time = current_time

    async def broadcast_game_state(self, include_food=False):
        if not self.current_game_id or self.current_game_id not in GameConsumer.active_games:
            return

        current_game = GameConsumer.active_games[self.current_game_id]
        game_state = current_game.get_state() if include_food else current_game.get_players_state()
        
        # Ne diffuser qu'aux joueurs de la partie courante
        for player_id in current_game.players.keys():
            if player_id in GameConsumer.players:
                player_consumer = GameConsumer.players[player_id]
                message = {
                    'type': 'food_update' if include_food else 'players_update',
                    'players': game_state['players'],
                    'yourPlayerId': player_id
                }
                
                if include_food:
                    message['food'] = game_state['food']
                    
                await player_consumer.send(text_data=json.dumps(message))

    async def game_loop(self):
        try:
            last_update = time.time()
            # Envoi initial avec toutes les données
            await self.broadcast_game_state(include_food=True)
            
            while True:
                current_time = time.time()
                delta_time = current_time - last_update
                last_update = current_time
                
                if GameConsumer.active_games:
                    positions_updated = GameConsumer.active_games[GameConsumer.game_id].update_positions(delta_time)
                    if positions_updated:
                        # N'envoie que les positions des joueurs
                        await self.broadcast_game_state(include_food=False)

                    # Vérifier les collisions pour tous les joueurs actifs
                    food_changes = False
                    for player_id in GameConsumer.active_games[GameConsumer.game_id].players.keys():
                        player_food_changes = GameConsumer.active_games[GameConsumer.game_id].check_food_collision(player_id)
                        if player_food_changes:
                            food_changes = True
                    
                    if food_changes:
                        await self.broadcast_game_state(include_food=True)

                await asyncio.sleep(1/60)
        except Exception as e:
            logger.error(f"Error in game loop: {e}")
            if not self.is_closing():
                await self.send_json({
                    "type": "error",
                    "message": "Internal server error, reconnecting..."
                })

    # Exemple de structure pour envoyer les informations de toutes les parties
    async def send_games_info(self):
        games_info = []
        for game_id, game in GameConsumer.active_games.items():
            games_info.append({
                "gameId": game_id,
                "players": [p.player_name for p in game.players.values()],
                "maxPlayers": 8,  # Par exemple
                "status": "in_progress" if game.is_game_active() else "waiting"
            })
        
        await self.send(text_data=json.dumps({
            "type": "games_info",
            "games": games_info
        }))
