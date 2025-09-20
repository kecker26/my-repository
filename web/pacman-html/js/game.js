// Pacman‑Webspiel mit HTML5‑Canvas

/*
Dieses Skript implementiert ein einfaches Pacman‑Spiel im Browser.  Die
Level‑Definition entspricht der Python‑Version.  Pacman wird mit den
Pfeiltasten gesteuert, Geister bewegen sich zufällig.  Wenn alle Pellets
gesammelt sind, ist das Spiel gewonnen.  Kollision mit einem Geist führt
zu einer Niederlage.
*/

(() => {
  const CELL_SIZE = 24;
  const MAZE = [
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
  ];

  const canvas = document.getElementById('gameCanvas');
  const infoEl = document.getElementById('info');
  const ctx = canvas.getContext('2d');
  canvas.width = MAZE[0].length * CELL_SIZE;
  canvas.height = MAZE.length * CELL_SIZE + 30;

  // Leveldaten
  const walls = new Set();
  let pellets = new Set();
  let playerStart = null;
  const ghostStarts = [];
  for (let y = 0; y < MAZE.length; y++) {
    const row = MAZE[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '#') {
        walls.add(`${x},${y}`);
      } else if (ch === 'P') {
        playerStart = { x, y };
        pellets.add(`${x},${y}`);
      } else if (ch === 'G') {
        ghostStarts.push({ x, y });
        pellets.add(`${x},${y}`);
      } else {
        // Leerzeichen und Punkte gelten als Pellet
        pellets.add(`${x},${y}`);
      }
    }
  }
  if (!playerStart) {
    throw new Error('Spielerstartposition P fehlt im Level');
  }

  // Hilfsfunktionen
  function isWall(x, y) {
    return walls.has(`${x},${y}`);
  }

  function removePellet(x, y) {
    pellets.delete(`${x},${y}`);
  }

  class Entity {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.dir = { dx: 0, dy: 0 };
      this.color = color;
      this.speed = 0.1;
    }
    update() {
      const newX = this.x + this.dir.dx * this.speed;
      const newY = this.y + this.dir.dy * this.speed;
      const cellX = Math.round(newX);
      const cellY = Math.round(newY);
      if (!isWall(cellX, cellY)) {
        this.x = newX;
        this.y = newY;
      }
    }
    draw() {
      const px = this.x * CELL_SIZE + CELL_SIZE / 2;
      const py = this.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(px, py, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  class Player extends Entity {
    constructor(x, y) {
      super(x, y, '#FFFF00');
      this.score = 0;
      this.lives = 3;
    }
    handleKey(e) {
      // Nur Pfeiltasten
      if (e.key === 'ArrowLeft') {
        if (!isWall(Math.round(this.x - 0.1), Math.round(this.y))) {
          this.dir = { dx: -1, dy: 0 };
        }
      } else if (e.key === 'ArrowRight') {
        if (!isWall(Math.round(this.x + 0.1), Math.round(this.y))) {
          this.dir = { dx: 1, dy: 0 };
        }
      } else if (e.key === 'ArrowUp') {
        if (!isWall(Math.round(this.x), Math.round(this.y - 0.1))) {
          this.dir = { dx: 0, dy: -1 };
        }
      } else if (e.key === 'ArrowDown') {
        if (!isWall(Math.round(this.x), Math.round(this.y + 0.1))) {
          this.dir = { dx: 0, dy: 1 };
        }
      }
    }
    update() {
      super.update();
      const cx = Math.round(this.x);
      const cy = Math.round(this.y);
      const key = `${cx},${cy}`;
      if (pellets.has(key)) {
        pellets.delete(key);
        this.score += 10;
      }
    }
  }

  class Ghost extends Entity {
    constructor(x, y) {
      super(x, y, '#FF0000');
      const dirs = [ { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 } ];
      this.dir = dirs[Math.floor(Math.random() * dirs.length)];
      this.speed = 0.08;
    }
    update() {
      // Prüfe Kreuzung oder Wandkollision
      const cx = Math.round(this.x);
      const cy = Math.round(this.y);
      const nextX = this.x + this.dir.dx * this.speed;
      const nextY = this.y + this.dir.dy * this.speed;
      const nextCellX = Math.round(nextX);
      const nextCellY = Math.round(nextY);
      if (isWall(nextCellX, nextCellY) || this.atIntersection()) {
        const dirs = [ { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 } ];
        const opposite = { dx: -this.dir.dx, dy: -this.dir.dy };
        const possible = dirs.filter(d => (d.dx !== opposite.dx || d.dy !== opposite.dy) && !isWall(cx + d.dx, cy + d.dy));
        if (possible.length > 0) {
          this.dir = possible[Math.floor(Math.random() * possible.length)];
        }
      }
      super.update();
    }
    atIntersection() {
      const cx = Math.round(this.x);
      const cy = Math.round(this.y);
      // Nur prüfen, wenn wir in der Mitte einer Zelle sind
      if (Math.abs(this.x - cx) > 0.05 || Math.abs(this.y - cy) > 0.05) {
        return false;
      }
      let count = 0;
      const dirs = [ { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 } ];
      for (const d of dirs) {
        if (!isWall(cx + d.dx, cy + d.dy)) count++;
      }
      return count > 2;
    }
  }

  let player = new Player(playerStart.x, playerStart.y);
  let ghosts = ghostStarts.map(s => new Ghost(s.x, s.y));
  let running = true;

  function resetPositions() {
    // Reduziere Leben
    player.lives -= 1;
    if (player.lives <= 0) {
      running = false;
    }
    // setze Positionen zurück
    player.x = playerStart.x;
    player.y = playerStart.y;
    player.dir = { dx: 0, dy: 0 };
    ghosts = ghostStarts.map(s => new Ghost(s.x, s.y));
  }

  function drawMaze() {
    // Hintergrund
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Wände
    ctx.fillStyle = '#0000FF';
    walls.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
    // Pellets
    ctx.fillStyle = '#FFB897';
    pellets.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const cx = x * CELL_SIZE + CELL_SIZE / 2;
      const cy = y * CELL_SIZE + CELL_SIZE / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  function update() {
    if (!running) return;
    player.update();
    ghosts.forEach(g => g.update());
    // Kollision mit Geistern?
    for (const g of ghosts) {
      if (Math.round(g.x) === Math.round(player.x) && Math.round(g.y) === Math.round(player.y)) {
        resetPositions();
        break;
      }
    }
    // Sieg prüfen
    if (pellets.size === 0) {
      running = false;
    }
  }

  function draw() {
    drawMaze();
    player.draw();
    ghosts.forEach(g => g.draw());
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText(`Punkte: ${player.score}`, 10, MAZE.length * CELL_SIZE + 20);
    ctx.fillText(`Leben: ${player.lives}`, 160, MAZE.length * CELL_SIZE + 20);
    if (!running) {
      const msg = pellets.size === 0 && player.lives > 0 ? 'Gewonnen!' : 'Game Over';
      ctx.fillText(msg + ' – Seite neu laden zum Neustart', 320, MAZE.length * CELL_SIZE + 20);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Tastatureingabe
  document.addEventListener('keydown', e => {
    player.handleKey(e);
  });

  // Setze Fokus, damit Tastaturereignisse empfangen werden
  canvas.focus();
  loop();
})();