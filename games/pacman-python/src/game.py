"""
Pacman‑Klonspiel mit pygame.

Dieses Modul implementiert ein einfaches Pacman‑Spiel mit Hilfe der
pygame‑Bibliothek.  Es enthält eine Game‑Klasse, die die Hauptlogik
steuert, sowie Klassen für den Spieler (Pacman) und die Geister.

Zum Starten des Spiels führen Sie im Verzeichnis `games/pacman-python`
folgenden Befehl aus:

    python -m src.game

Vorher müssen die Abhängigkeiten mit ``pip install -r requirements.txt``
installiert werden.
"""

from __future__ import annotations

import random
import sys
from dataclasses import dataclass
from typing import List, Tuple

import pygame


# Größe einer Zelle in Pixeln
CELL_SIZE = 24
# Frames pro Sekunde
FPS = 60

# Spielfeld‐Definition.
# #: Wand
# .: Pellet
# G: Startposition für einen Geist
# P: Startposition für Pacman
MAZE: List[str] = [
    "########################",
    "#............##........#",
    "#.####.#####.##.#####.#",
    "#G####.#####.##.#####G#",
    "#.####.#####.##.#####.#",
    "#......................#",
    "#.####.##.########.##.#",
    "#......##....##....##..#",
    "######.##### ## #####.##",
    "     #.##### ## #####.# ",
    "     #.##          ##.# ",
    "######.## ######## ##.##",
    "      ....P.... ....    ",
    "######.## ######## ##.##",
    "     #.##          ##.# ",
    "     #.##### ## #####.# ",
    "######.##### ## #####.##",
    "#......##....##....##..#",
    "#.####.##.########.##.#",
    "#......................#",
    "#.####.#####.##.#####.#",
    "#G####.#####.##.#####G#",
    "#.####.#####.##.#####.#",
    "#............##........#",
    "########################",
]


def load_level(maze: List[str]):
    """Parst das Spielfeld und liefert relevante Strukturen zurück.

    Gibt ein Tupel zurück bestehend aus:

    * walls – Menge von (x, y)‐Koordinaten, an denen sich Wände befinden
    * pellets – Menge von (x, y)‐Koordinaten, an denen sich Pellets befinden
    * player_start – Startkoordinaten für Pacman
    * ghost_starts – Liste mit Startkoordinaten für Geister
    """
    walls: set[Tuple[int, int]] = set()
    pellets: set[Tuple[int, int]] = set()
    ghost_starts: List[Tuple[int, int]] = []
    player_start: Tuple[int, int] | None = None
    for y, row in enumerate(maze):
        for x, char in enumerate(row):
            if char == '#':
                walls.add((x, y))
            elif char == '.':
                pellets.add((x, y))
            elif char == 'P':
                player_start = (x, y)
                pellets.add((x, y))
            elif char == 'G':
                ghost_starts.append((x, y))
                pellets.add((x, y))
            else:
                # Leerzeichen werden auch als Pellet behandelt
                pellets.add((x, y))
    if player_start is None:
        raise ValueError("Level enthält keine Startposition für den Spieler 'P'")
    return walls, pellets, player_start, ghost_starts


@dataclass
class Entity:
    """Basisklasse für bewegliche Spielfiguren."""

    x: float
    y: float
    direction: Tuple[int, int]
    color: Tuple[int, int, int]
    speed: float = 0.1

    def update(self, game: "Game") -> None:
        """Bewegt die Figur entsprechend ihrer aktuellen Richtung.

        Kollisionen mit Wänden werden verhindert.
        """
        new_x = self.x + self.direction[0] * self.speed
        new_y = self.y + self.direction[1] * self.speed

        # Prüfen, ob neuer Mittelpunkt in einer Wand landen würde
        if not game.is_wall((new_x, new_y)):
            self.x = new_x
            self.y = new_y

    def draw(self, surface: pygame.Surface) -> None:
        """Zeichnet die Figur als farbigen Kreis."""
        radius = CELL_SIZE // 2 - 2
        px = int(self.x * CELL_SIZE) + CELL_SIZE // 2
        py = int(self.y * CELL_SIZE) + CELL_SIZE // 2
        pygame.draw.circle(surface, self.color, (px, py), radius)


class Player(Entity):
    """Klasse für den Spieler (Pacman)."""

    def __init__(self, x: float, y: float):
        super().__init__(x, y, (0, 0), (255, 255, 0))  # Gelb
        self.lives = 3
        self.score = 0

    def handle_input(self, keys: List[bool], game: "Game") -> None:
        """Setzt die Bewegungsrichtung basierend auf der Tasteneingabe."""
        if keys[pygame.K_LEFT]:
            if not game.is_wall((self.x - 0.1, self.y)):
                self.direction = (-1, 0)
        elif keys[pygame.K_RIGHT]:
            if not game.is_wall((self.x + 0.1, self.y)):
                self.direction = (1, 0)
        elif keys[pygame.K_UP]:
            if not game.is_wall((self.x, self.y - 0.1)):
                self.direction = (0, -1)
        elif keys[pygame.K_DOWN]:
            if not game.is_wall((self.x, self.y + 0.1)):
                self.direction = (0, 1)

    def update(self, game: "Game") -> None:
        super().update(game)
        # Überprüfen, ob ein Pellet gefressen wurde
        cell = (int(round(self.x)), int(round(self.y)))
        if cell in game.pellets:
            game.pellets.remove(cell)
            self.score += 10


class Ghost(Entity):
    """Klasse für einen Geist."""

    def __init__(self, x: float, y: float):
        super().__init__(x, y, (0, 0), (255, 0, 0))  # Rot
        # Start mit zufälliger Richtung
        self.direction = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])
        self.speed = 0.08

    def update(self, game: "Game") -> None:
        # Wenn wir an einer Kreuzung stehen oder in eine Wand laufen, wähle eine neue Richtung
        grid_x, grid_y = int(round(self.x)), int(round(self.y))
        # Prüfe bevorstehende Wandkollision
        next_pos = (self.x + self.direction[0] * self.speed, self.y + self.direction[1] * self.speed)
        if game.is_wall(next_pos) or self._at_intersection(game):
            directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
            # Vermeide Rückwärtsbewegung
            opposite = (-self.direction[0], -self.direction[1])
            possible = [d for d in directions if d != opposite and not game.is_wall((grid_x + d[0], grid_y + d[1]))]
            if possible:
                self.direction = random.choice(possible)
        super().update(game)

    def _at_intersection(self, game: "Game") -> bool:
        """Ermittelt, ob der Geist an einer Kreuzung steht (mehrere Abzweigungen)."""
        grid_x, grid_y = int(round(self.x)), int(round(self.y))
        if (self.x - grid_x) ** 2 + (self.y - grid_y) ** 2 > 0.01:
            return False
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        count = 0
        for d in directions:
            if not game.is_wall((grid_x + d[0], grid_y + d[1])):
                count += 1
        return count > 2


class Game:
    """Hauptklasse, die das Spiel steuert."""

    def __init__(self) -> None:
        pygame.init()
        self.walls, self.pellets, player_start, ghost_starts = load_level(MAZE)
        self.player = Player(float(player_start[0]), float(player_start[1]))
        self.ghosts: List[Ghost] = [Ghost(float(x), float(y)) for x, y in ghost_starts]
        self.width = max(len(row) for row in MAZE)
        self.height = len(MAZE)
        self.screen = pygame.display.set_mode((self.width * CELL_SIZE, self.height * CELL_SIZE))
        pygame.display.set_caption("Pacman – Python")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 18)
        self.game_over = False

    def is_wall(self, pos: Tuple[float, float]) -> bool:
        x, y = int(round(pos[0])), int(round(pos[1]))
        return (x, y) in self.walls

    def reset(self) -> None:
        """Setzt das Spiel nach einer Kollision zurück."""
        # Positioniere Pacman und Geister neu, reduziere Leben
        self.player.lives -= 1
        if self.player.lives <= 0:
            self.game_over = True
            return
        # Reset Position
        # Spieler zurücksetzen
        for y, row in enumerate(MAZE):
            for x, c in enumerate(row):
                if c == 'P':
                    self.player.x, self.player.y = float(x), float(y)
                    self.player.direction = (0, 0)
        # Geister zurücksetzen
        for ghost, start in zip(self.ghosts, load_level(MAZE)[3]):
            ghost.x, ghost.y = float(start[0]), float(start[1])
            ghost.direction = random.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])

    def run(self) -> None:
        """Startet die Spielschleife."""
        while True:
            self.clock.tick(FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
            # Eingaben verarbeiten
            keys = pygame.key.get_pressed()
            if not self.game_over:
                self.player.handle_input(keys, self)
                self.player.update(self)
                for ghost in self.ghosts:
                    ghost.update(self)
                # Kollision mit Geistern prüfen
                for ghost in self.ghosts:
                    if int(round(self.player.x)) == int(round(ghost.x)) and int(round(self.player.y)) == int(round(ghost.y)):
                        self.reset()
                        break
                # Sieg prüfen
                if not self.pellets:
                    self.game_over = True
            # Zeichnen
            self.screen.fill((0, 0, 0))
            self._draw_maze()
            for pellet in self.pellets:
                self._draw_pellet(pellet)
            self.player.draw(self.screen)
            for ghost in self.ghosts:
                ghost.draw(self.screen)
            # Punkte & Leben anzeigen
            score_text = self.font.render(f"Punkte: {self.player.score}", True, (255, 255, 255))
            lives_text = self.font.render(f"Leben: {self.player.lives}", True, (255, 255, 255))
            self.screen.blit(score_text, (10, self.height * CELL_SIZE - 40))
            self.screen.blit(lives_text, (200, self.height * CELL_SIZE - 40))
            if self.game_over:
                msg = "Gewonnen!" if self.pellets == set() and self.player.lives > 0 else "Game Over"
                msg_surface = self.font.render(msg + " – Drücke ESC zum Beenden", True, (255, 255, 255))
                rect = msg_surface.get_rect(center=(self.width * CELL_SIZE // 2, self.height * CELL_SIZE // 2))
                self.screen.blit(msg_surface, rect)
                if keys[pygame.K_ESCAPE]:
                    pygame.quit()
                    sys.exit()
            pygame.display.flip()

    def _draw_maze(self) -> None:
        """Zeichnet die Wände des Labyrinths."""
        for (x, y) in self.walls:
            rect = pygame.Rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            pygame.draw.rect(self.screen, (0, 0, 255), rect)

    def _draw_pellet(self, pellet: Tuple[int, int]) -> None:
        x, y = pellet
        cx = x * CELL_SIZE + CELL_SIZE // 2
        cy = y * CELL_SIZE + CELL_SIZE // 2
        pygame.draw.circle(self.screen, (255, 184, 151), (cx, cy), 4)


if __name__ == "__main__":
    Game().run()