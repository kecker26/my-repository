# Pacman game implemented using pygame
# This is a simplified yet relatively complex Pacman implementation

import os
import pygame
from pygame.locals import *

TILE_SIZE = 24
SCREEN_WIDTH = 28 * TILE_SIZE
SCREEN_HEIGHT = 31 * TILE_SIZE

# Map layout: 28x31 grid using characters
# '#' - wall
# '.' - pellet
# 'o' - power pellet
# ' ' - empty

LEVEL = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##### ## #####.#     ",
    "     #.##          ##.#     ",
    "     #.## ###--### ##.#     ",
    "######.## #      # ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "     #.##          ##.#     ",
    "     #.## ######## ##.#     ",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#...##................##...#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
]


class Entity(pygame.sprite.Sprite):
    def __init__(self, image, x, y):
        super().__init__()
        self.image = image
        self.rect = self.image.get_rect(topleft=(x * TILE_SIZE, y * TILE_SIZE))
        self.grid_x = x
        self.grid_y = y

    def update_grid_position(self):
        self.grid_x = self.rect.x // TILE_SIZE
        self.grid_y = self.rect.y // TILE_SIZE


class Pacman(Entity):
    def __init__(self, x, y):
        image = pygame.Surface((TILE_SIZE, TILE_SIZE))
        image.fill((255, 255, 0))
        super().__init__(image, x, y)
        self.direction = pygame.Vector2(0, 0)
        self.next_direction = pygame.Vector2(0, 0)
        self.lives = 3
        self.score = 0

    def update(self, walls):
        if self.next_direction.length_squared() != 0:
            new_rect = self.rect.move(self.next_direction * TILE_SIZE)
            if not any(new_rect.colliderect(w.rect) for w in walls):
                self.direction = self.next_direction
        new_rect = self.rect.move(self.direction * TILE_SIZE)
        if not any(new_rect.colliderect(w.rect) for w in walls):
            self.rect = new_rect
            self.update_grid_position()


class Ghost(Entity):
    COLORS = [(255, 0, 0), (255, 128, 255), (0, 255, 255), (255, 128, 0)]

    def __init__(self, x, y, color_index=0):
        image = pygame.Surface((TILE_SIZE, TILE_SIZE))
        image.fill(Ghost.COLORS[color_index % len(Ghost.COLORS)])
        super().__init__(image, x, y)
        self.direction = pygame.Vector2(1, 0)

    def update(self, walls):
        # simple random-turning AI
        if self.can_move(self.direction, walls):
            if pygame.time.get_ticks() % 20 == 0:
                self.direction = self.random_direction(walls)
        else:
            self.direction = self.random_direction(walls)
        self.rect = self.rect.move(self.direction * TILE_SIZE)
        self.update_grid_position()

    def can_move(self, direction, walls):
        new_rect = self.rect.move(direction * TILE_SIZE)
        return not any(new_rect.colliderect(w.rect) for w in walls)

    def random_direction(self, walls):
        options = [pygame.Vector2(1,0), pygame.Vector2(-1,0),
                   pygame.Vector2(0,1), pygame.Vector2(0,-1)]
        valid = [d for d in options if self.can_move(d, walls)]
        if valid:
            return valid[int(pygame.time.get_ticks()) % len(valid)]
        return pygame.Vector2(0,0)


def build_level():
    pellets = pygame.sprite.Group()
    walls = pygame.sprite.Group()
    power_pellets = pygame.sprite.Group()
    pacman_pos = None
    ghost_positions = []

    for y, line in enumerate(LEVEL):
        for x, ch in enumerate(line):
            if ch == '#':
                wall = Entity(pygame.Surface((TILE_SIZE, TILE_SIZE)), x, y)
                wall.image.fill((0,0,255))
                walls.add(wall)
            elif ch == '.':
                pellet = Entity(pygame.Surface((6,6)), x+0.5, y+0.5)
                pellet.image.fill((255,255,255))
                pellets.add(pellet)
            elif ch == 'o':
                pellet = Entity(pygame.Surface((12,12)), x+0.25, y+0.25)
                pellet.image.fill((255,255,255))
                power_pellets.add(pellet)
            elif ch == '-':
                ghost_positions.append((x,y))
            elif ch == ' ':
                pass
    if ghost_positions:
        pacman_pos = ghost_positions.pop(0)
    return walls, pellets, power_pellets, pacman_pos, ghost_positions


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption('Pacman')

    walls, pellets, power_pellets, pacman_pos, ghost_positions = build_level()
    pacman = Pacman(*pacman_pos)
    ghosts = pygame.sprite.Group(
        *(Ghost(x, y, i) for i, (x, y) in enumerate(ghost_positions))
    )
    all_sprites = pygame.sprite.Group(walls, pellets, power_pellets, pacman, ghosts)

    clock = pygame.time.Clock()

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == QUIT:
                running = False
            elif event.type == KEYDOWN:
                if event.key == K_UP:
                    pacman.next_direction = pygame.Vector2(0, -1)
                elif event.key == K_DOWN:
                    pacman.next_direction = pygame.Vector2(0, 1)
                elif event.key == K_LEFT:
                    pacman.next_direction = pygame.Vector2(-1, 0)
                elif event.key == K_RIGHT:
                    pacman.next_direction = pygame.Vector2(1, 0)

        pacman.update(walls)
        ghosts.update(walls)

        # pellet collision
        for pellet in pygame.sprite.spritecollide(pacman, pellets, True):
            pacman.score += 10
        for pellet in pygame.sprite.spritecollide(pacman, power_pellets, True):
            pacman.score += 50
            # frightened mode could be implemented here

        # ghost collision
        if pygame.sprite.spritecollide(pacman, ghosts, False):
            pacman.lives -= 1
            if pacman.lives <= 0:
                print('Game Over!')
                running = False
            else:
                pacman.rect.topleft = (pacman.grid_x * TILE_SIZE, pacman.grid_y * TILE_SIZE)

        screen.fill((0,0,0))
        walls.draw(screen)
        pellets.draw(screen)
        power_pellets.draw(screen)
        ghosts.draw(screen)
        screen.blit(pacman.image, pacman.rect)

        pygame.display.flip()
        clock.tick(10)

    pygame.quit()


if __name__ == '__main__':
    main()
