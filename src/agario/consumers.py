import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_state import game_state, GameState
from asgiref.sync import async_to_sync
import asyncio
import time
import uuid

class GameConsumer(AsyncWebsocketConsumer):
    players = {}
    game_id = None
    active_game = None
    player_count = 0

    async def connect(self):
        await self.accept()
        GameConsumer.player_count += 1
        self.player_id = f"Player_{GameConsumer.player_count}"
        self.player_name = f"Joueur_{GameConsumer.player_count}"
        GameConsumer.players[self.player_id] = self
        await self.send(text_data=json.dumps({
            "type": "waiting_room",
            "yourPlayerId": self.player_id,
            "yourPlayerName": self.player_name
        }))

    async def disconnect(self, close_code):
        if self.player_id in GameConsumer.players:
            del GameConsumer.players[self.player_id]
        if GameConsumer.active_game:
            GameConsumer.active_game.remove_player(self.player_id)
            if len(GameConsumer.active_game.players) == 0:
                GameConsumer.active_game = None
                GameConsumer.game_id = None
                GameConsumer.player_count = 0

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'start_game':
            if not GameConsumer.active_game:
                GameConsumer.game_id = str(uuid.uuid4())
                GameConsumer.active_game = GameState()
            GameConsumer.active_game.add_player(self.player_id, self.player_name)
            await self.channel_layer.group_add(f"game_{GameConsumer.game_id}", self.channel_name)
            player_data = GameConsumer.active_game.players.get(self.player_id, {})
            await self.send(text_data=json.dumps({
                "type": "game_started",
                "gameId": GameConsumer.game_id,
                "yourPlayerId": self.player_id,
                "yourPlayerName": self.player_name,
                "players": {self.player_id: player_data},
                **GameConsumer.active_game.get_state()
            }))
            asyncio.create_task(self.generate_food())
        elif data['type'] == 'move':
            if GameConsumer.active_game:
                GameConsumer.active_game.update_player(self.player_id, data['x'], data['y'])
                if GameConsumer.active_game.check_food_collision(self.player_id):
                    GameConsumer.active_game.add_food()
        # Utiliser un throttle pour limiter les mises à jour
        await self.throttled_send_game_state()

    async def send_game_state(self):
        await self.send(text_data=json.dumps(game_state.get_state()))

    async def send_game_state_to_group(self):
        await self.channel_layer.group_send(
            "game",
            {
                "type": "game_state_update",
                "game_state": game_state.get_state()
            }
        )

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps(event["game_state"]))

    async def generate_food(self):
        while True:
            await asyncio.sleep(10)  # Générer de la nourriture toutes les secondes
            if GameConsumer.active_game is not None:
                GameConsumer.active_game.add_food()
            else:
                print("Warning: active_game is None, cannot generate food")

    async def throttled_send_game_state(self):
        current_time = time.time()
        if not hasattr(self, 'last_update_time') or current_time - self.last_update_time > 0.1:
            await self.send_game_state_to_group()
            self.last_update_time = current_time
