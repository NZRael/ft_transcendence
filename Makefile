DOCKER_COMPOSE = docker compose
SERVICE_NAME = alt_game

all: up

up:
	$(DOCKER_COMPOSE) up --build -d

stop:
	$(DOCKER_COMPOSE) down

fclean:
	docker system prune -af

.PHONY: all up stop fclean