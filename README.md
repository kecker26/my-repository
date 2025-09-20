# Pacman (Python &amp; HTML)

Willkommen in deinem Pacman‑Projekt!  Dieses Repository enthält zwei unabhängige Implementierungen eines Pacman‑Klonspiels:

* **Python/pygame‑Version** –  ein voll funktionsfähiges Desktop‑Spiel mit pygame.  Diese Version eignet sich zum Lernen von Spielmechanik, Spielschleifen und objektorientierter Programmierung in Python.
* **HTML/JavaScript‑Version** –  ein browserbasiertes Pacman‑Spiel, das in jedem modernen Webbrowser läuft.  Ideal, um Webtechnologien wie HTML5‑Canvas und JavaScript kennenzulernen.

## Live‑Demo

GitHub Pages kann genutzt werden, um die Web‑Version öffentlich bereitzustellen.  Aktiviere dazu Pages für den Ordner `web/pacman-html` in den Repository‑Einstellungen.

## Installation &amp; Ausführung

### Python (pygame)

1. Wechsle ins Verzeichnis:
   ```bash
   cd games/pacman-python
   ```
2. Erstelle eine virtuelle Umgebung und aktiviere sie:
   ```bash
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # Linux/macOS: source .venv/bin/activate
   ```
3. Installiere die Abhängigkeiten:
   ```bash
   pip install -r requirements.txt
   ```
4. Starte das Spiel:
   ```bash
   python -m src.game
   ```

### HTML/JavaScript

Öffne die Datei `web/pacman-html/index.html` in einem Webbrowser oder nutze die GitHub Pages‑Demo.

## Roadmap

- [ ] Level‑Editor implementieren
- [ ] Highscore in Datei speichern
- [ ] Mobile‑Steuerung für Touchgeräte

## Lizenz

Dieses Projekt steht unter der MIT‑Lizenz – siehe [`LICENSE`](LICENSE) für Details.

## Beiträge

Beiträge sind willkommen!  Bitte beachte die Richtlinien in [`CONTRIBUTING.md`](CONTRIBUTING.md) und den Verhaltenskodex in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).