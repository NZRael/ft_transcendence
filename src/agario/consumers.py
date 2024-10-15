import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .game_state import game_state
from asgiref.sync import async_to_sync
import asyncio
import time

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.player_id = game_state.add_player(f"Player_{self.channel_name}")
        await self.channel_layer.group_add("game", self.channel_name)
        await self.send(text_data=json.dumps({
            "yourPlayerId": self.player_id,
            **game_state.get_state()
        }))
        asyncio.create_task(self.generate_food())

    async def disconnect(self, close_code):
        game_state.remove_player(self.player_id)
        await self.channel_layer.group_discard("game", self.channel_name)
        await self.send_game_state_to_group()

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'move':
            game_state.update_player(self.player_id, data['x'], data['y'])
            if game_state.check_food_collision(self.player_id):
                game_state.add_food()
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
            await asyncio.sleep(30)  # Génère de la nourriture toutes les 30 secondes
            game_state.add_food()
            # Ne pas envoyer l'état du jeu ici, laissez le throttling s'en occuper

    async def throttled_send_game_state(self):
        current_time = time.time()
        if not hasattr(self, 'last_update_time') or current_time - self.last_update_time > 0.1:
            await self.send_game_state_to_group()
            self.last_update_time = current_time
