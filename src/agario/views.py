from django.shortcuts import render
from django.http import JsonResponse
from .game_state import game_state
from django.conf import settings

# Create your views here.

def game(request):
    context = {
        'BASE_URL': settings.BASE_URL,
        'WS_URL': settings.WS_URL,
        'DEBUG': settings.DEBUG,
    }
    return render(request, 'agario/game.html', context)

def get_game_state(request):
    return JsonResponse(game_state.get_state())
