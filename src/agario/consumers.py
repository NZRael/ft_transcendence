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
    game_id = None
    active_game = None
    player_count = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_loop_task = None
        
    async def connect(self):
        await self.accept()
        self.player_id = str(uuid.uuid4())
        GameConsumer.player_count += 1
        self.player_name = f"Player_{GameConsumer.player_count}"
        GameConsumer.players[self.player_id] = self
        
        # Si une partie existe déjà, ajouter le joueur à celle-ci
        if GameConsumer.active_game:
            GameConsumer.active_game.add_player(self.player_id, self.player_name)
            # Envoyer directement l'état du jeu au nouveau joueur
            await self.send(text_data=json.dumps({
                "type": "game_started",
                "yourPlayerId": self.player_id,
                "yourPlayerName": self.player_name,
                "gameState": GameConsumer.active_game.get_state()
            }))
        else:
            # Si pas de partie en cours, envoyer en salle d'attente
            await self.send(text_data=json.dumps({
                "type": "waiting_room",
                "yourPlayerId": self.player_id,
                "yourPlayerName": self.player_name
            }))

    async def disconnect(self, close_code):
        logger.info(f"Player {self.player_id} disconnected with code {close_code}")
        if hasattr(self, 'game_loop_task') and self.game_loop_task:
            self.game_loop_task.cancel()
            try:
                await self.game_loop_task
            except asyncio.CancelledError:
                pass
        
        if self.player_id in GameConsumer.players:
            del GameConsumer.players[self.player_id]
        if GameConsumer.active_game and self.player_id in GameConsumer.active_game.players:
            GameConsumer.active_game.remove_player(self.player_id)
            if len(GameConsumer.active_game.players) == 0:
                GameConsumer.active_game = None
                GameConsumer.game_id = None
        GameConsumer.player_count = max(0, GameConsumer.player_count - 1)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'start_game': ##########################################
            if not GameConsumer.active_game:
                logger.info("Starting new game")
                GameConsumer.game_id = str(uuid.uuid4())
                GameConsumer.active_game = GameState()
                # Ajouter tous les joueurs en attente
                for player_id, player in GameConsumer.players.items():
                    GameConsumer.active_game.add_player(
                        player_id, 
                        f"{GameConsumer.players[player_id].player_name}"
                    )
            # Démarrer la boucle de jeu pour ce joueur s'il ne l'a pas déjà
            if not self.game_loop_task:
                self.game_loop_task = asyncio.create_task(self.game_loop())
            # Notifier tous les joueurs que la partie commence
            for player in GameConsumer.players.values():
                await player.send(text_data=json.dumps({
                    "type": "game_started",
                    "yourPlayerId": player.player_id,
                    "yourPlayerName": player.player_name,
                    "gameState": GameConsumer.active_game.get_state()
                }))
        elif data['type'] == 'input': ##########################################
            if GameConsumer.active_game:
                GameConsumer.active_game.handle_player_input(
                    data['playerId'],
                    data['key'],
                    data['isKeyDown']
                )
        elif data['type'] == 'move': ##########################################
            if GameConsumer.active_game:
                dx = float(data.get('dx', 0))
                dy = float(data.get('dy', 0))
                GameConsumer.active_game.set_player_movement(data['playerId'], dx, dy)
        await self.throttled_send_game_state()

    # async def send_game_state(self):
    #     await self.send(text_data=json.dumps(game_state.get_state()))

    async def send_game_state_to_group(self):
        await self.channel_layer.group_send(
            "game",
            {
                "type": "game_state",
                "game_state": game_state.get_state()
            }
        )

    async def throttled_send_game_state(self):
        current_time = time.time()
        if not hasattr(self, 'last_update_time') or current_time - self.last_update_time > 0.1:
            await self.send_game_state_to_group()
            self.last_update_time = current_time

    async def broadcast_game_state(self):
        if not GameConsumer.active_game:
            return

        game_state = GameConsumer.active_game.get_state()
        for player_id, player in GameConsumer.players.items():
            await player.send(text_data=json.dumps({
                'type': 'game_state',
                'players': game_state['players'],
                'food': game_state['food'],
                'yourPlayerId': player_id
            }))

    async def game_loop(self):
        try:
            last_update = time.time()
            await self.broadcast_game_state()
            while True:
                current_time = time.time()
                delta_time = current_time - last_update
                last_update = current_time
                if GameConsumer.active_game:
                    positions_updated = GameConsumer.active_game.update_positions(delta_time)
                    if positions_updated:
                        await self.broadcast_game_state()
                await asyncio.sleep(1/60)
        except Exception as e:
            logger.error(f"Error in game loop: {e}")
            if not self.is_closing():
                await self.send_json({
                    "type": "error",
                    "message": "Internal server error, reconnecting..."
                })
