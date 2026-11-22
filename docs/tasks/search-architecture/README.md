# Sucharchitektur – Arbeitsstand und Tasks

Stand: 22. November 2026, Abschluss nach Nutzerlauf um 18:23 CET. Branch `feat/shared-search-architecture`, Codebezug `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69`.

## Abschlussstand

[Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung](01-shared-search-matrix.md) ist im vereinbarten Such-/Titelumfang abgeschlossen. Das ist keine vollständige Produktions-, Race-, Browser- oder Modellabnahme.

- Gemeinsamer Flow, Matrix, konsolidierte Verträge, zentrale Texte, Titeladapter und HTTP-/Sessionanbindung implementiert.
- Titel/all ohne Jahr über Multi; Titel/Jahr/all verlangt gebundene Medienauswahl, auch bei ausdrücklich beiden Medien. Nach Klärung erst Execute.
- Kriterienerhalt, ausdrückliche Änderungen, Bindungen/Reservierung und robuste Gesamtzahlen gezielt automatisch abgesichert.
- Adaptertests (`8172f08`), Flowtests (`0e0e002`), echte H3-HTTP-/Sessionintegration (`e885a7c`) und Lint-Korrektur (`d6e071c`) vom Nutzer erfolgreich geprüft.
- Tests, Lint und Typecheck am 22. November um 18:17 CET als erfolgreich bestätigt; Coverage anschließend als über 80% bestätigt. Keine genaue Quote, Metrik oder Testanzahl aus dieser Rückmeldung ableiten.
- Lokaler Live-Audit gegen `http://localhost:3000`: acht bestanden, null fehlgeschlagen, null blockiert; JSON-Bericht in der Unterhaltung geprüft. Commitangabe vom Aufrufer, nicht gegen den Server verifiziert.

Der aktuelle Abschluss ersetzt ältere Offenmeldungen, nicht historische Ergebnisse. Quellenzuordnung, einzelne Live-Fälle, Testabgrenzung, frühere Findings und verbleibende Grenzen stehen im Task. Audit-Skript nur lokal bereitgestellt; weder Skript noch Rohberichte mit diesem Abschluss committed.

## Grundlagen und Benutzung

Verbindlich: [Konzept](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [Requests](../../tmdb-search-examples.md), [Testing](../../testing.md), [Typing](../../typing.md).

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration nötig. Normaler Text ohne Frage ist Submit, mit Frage gebundene Antwort. `/submit TEXT`, `/select NUMMER`, `/execute`, `/reset`, `/exit` sind explizite Aktionen; `/select` ist keine Trefferauswahl. Treffer als kompakte Tabelle, Seiten-/Gesamtzahl getrennt.

## Nächster Anwendungsfall

Kein weiterer Suchweg beauftragt. Task 02 erst nach ausdrücklicher Auswahl; Keyword ist eine Möglichkeit, keine festgelegte nächste Implementierung. Projektweiter Vollscan wurde ausdrücklich aus dem Abschlussumfang genommen und ist kein offener Pflichtauftrag. Weitere Simulationen, Betriebsfreigabe, Browser-/Wizardintegration und Modellzuverlässigkeit bleiben separat zu vereinbaren. Keine pauschale Testlöschung, Migrationsfreigabe oder neue Infrastruktur aus diesem Abschluss ableiten.
