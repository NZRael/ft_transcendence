import random
import uuid
import logging

MAX_FOOD = 500  # Augmenté pour une carte plus grande
MAP_WIDTH = 10000
MAP_HEIGHT = 10000

FOOD_TYPES = {
    'common': {'value': 1, 'probability': 0.75, 'color': '#FFFFFF'},
    'rare': {'value': 3, 'probability': 0.20, 'color': '#00FF00'},
    'epic': {'value': 10, 'probability': 0.05, 'color': '#FF00FF'}
}

class GameState:
    def __init__(self):
        self.players = {}
        self.food = []
        self.next_player_id = 1
        self.map_width = MAP_WIDTH
        self.map_height = MAP_HEIGHT
        self.active_players_count = 0
        self.initialize_food()

    def generate_player_id(self):
        return str(uuid.uuid4())

    def add_player(self, player_id, player_name):
        self.players[player_id] = {
            'id': player_id,
            'name': player_name,
            'x': random.randint(0, self.map_width),
            'y': random.randint(0, self.map_height),
            'size': 20,  # Taille initiale
            'score': 0,  # Score initial
            'color': f'#{random.randint(0, 0xFFFFFF):06x}'
        }
        self.active_players_count += 1

    def remove_player(self, player_id):
        if player_id in self.players:
            del self.players[player_id]
            self.active_players_count -= 1

    def update_player(self, player_id, x, y):
        if player_id in self.players:
            x = max(0, min(x, self.map_width))
            y = max(0, min(y, self.map_height))
            self.players[player_id]['x'] = x
            self.players[player_id]['y'] = y
            self.players[player_id]['size'] = int(self.players[player_id]['size'])
            self.players[player_id]['score'] = int(self.players[player_id]['score'])

    def add_food(self):
        if len(self.food) >= MAX_FOOD:
            return

        food_type = self.get_random_food_type()
        new_food = {
            'id': str(uuid.uuid4()),
            'x': random.randint(0, self.map_width),
            'y': random.randint(0, self.map_height),
            'type': food_type,
            'value': FOOD_TYPES[food_type]['value'],
            'color': FOOD_TYPES[food_type]['color']
        }
        self.food.append(new_food)
        return new_food

    def remove_food(self, food_id):
        self.food = [f for f in self.food if f['id'] != food_id]

    def check_food_collision(self, player_id):
        player = self.players.get(player_id)
        if not player:
            return False
        for food in self.food[:]:
            if self.distance(player, food) < player['size']:
                player['size'] += food['value']
                player['score'] += food['value']
                self.food.remove(food)
                self.add_food()  # Ajoute immédiatement une nouvelle nourriture
                return True
        return False

    def distance(self, obj1, obj2):
        return ((obj1['x'] - obj2['x']) ** 2 + (obj1['y'] - obj2['y']) ** 2) ** 0.5

    def initialize_food(self):
        self.food = []
        for _ in range(MAX_FOOD):
            self.add_food()

    def get_state(self):
        return {
            'players': self.players,
            'food': self.food,
            'map_width': self.map_width,
            'map_height': self.map_height
        }

    def get_random_food_type(self):
        rand = random.random()
        cumulative_prob = 0
        for food_type, data in FOOD_TYPES.items():
            cumulative_prob += data['probability']
            if rand <= cumulative_prob:
                return food_type
        return 'common'  # Fallback au cas où

    def reset(self):
        self.players = {}
        self.food = []
        self.next_player_id = 1
        self.active_players_count = 0
        self.initialize_food()

game_state = GameState()
