# Beitragende‑Leitfaden

Vielen Dank, dass du dieses Projekt unterstützen möchtest!  Mit deinen Beiträgen kannst du Pacman weiter verbessern.  Bevor du loslegst, lies bitte diese Richtlinien.

## Allgemeine Hinweise

- Halte dich an den [Verhaltenskodex](CODE_OF_CONDUCT.md).
- Eröffne ein Issue, bevor du größere Änderungen beginnst, um sie mit dem Maintainer abzustimmen.
- Für kleine Fehler oder Verbesserungen kannst du direkt einen Pull Request (PR) einreichen.
- Kommentiere deinen Code sinnvoll und nutze sprechende Bezeichner.

## Entwicklungsumgebung

1. Forke dieses Repository und klone deinen Fork lokal.
2. Lege eine virtuelle Umgebung an und installiere die Abhängigkeiten:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r games/pacman-python/requirements.txt
   ```
3. Entwickle deine Änderungen in einem neuen Branch.
4. Schreibe Unit‑Tests für neue Funktionen.
5. Führe `pytest` aus, um sicherzustellen, dass alle Tests bestehen.
6. Erstelle einen Pull Request gegen den `main`‑Branch dieses Repositories.

## Commit‑Nachrichten

- Formuliere kurze, prägnante Beschreibungen im Präsens.  Beispiel: `Fix collision detection`.
- Beschreibe im PR‑Text, was du geändert hast und warum.

Vielen Dank für deine Unterstützung!