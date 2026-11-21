# Zielstruktur der gemeinsamen Suche

Stand: 21. November 2026. Beschlossenes Ziel, noch kein umgesetzter Strukturumbau. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [aktiver Task 01](01-shared-search-matrix.md). Namen machen Zuständigkeiten sichtbar; keine Dateien allein zur optischen Vollständigkeit.

## Zielbaum

```text
server/
├── api/search/index.post.ts       # Gemeinsamer HTTP-Einstieg
├── services/
│   ├── search/
│   │   ├── flow.ts                # Ein gemeinsamer Coordinator
│   │   ├── matrix.ts              # Fähigkeiten und Hindernisse
│   │   ├── llm.ts                 # Gemeinsame Interpretation samt Validierung
│   │   └── texts.ts               # Zentrale Anwendungstexte/Fragezuordnung
│   └── tmdb/                     # Transport, Titeladapter und Mapping
└── utils/search-session.ts       # Cookie, Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Zusammengehörige externe Suchverträge
└── parser/instructions.ts        # Versionierter Systemauftrag
scripts/search.mjs               # Explorativ ausgebauter Terminal-Wizard
```

Der Baum zeigt den Suchbereich, nicht sämtliche Dateien. Runtime- und Provider-/Kartenverträge bleiben fachlich passend eingeordnet.

## Zuständigkeiten und Umbau

| Ziel | Aufgabe | Änderung |
| --- | --- | --- |
| `server/api/search/index.post.ts` | Aktionen/Runtime validieren, Session zuordnen, Coordinator aufrufen, HTTP abbilden | `server/api/search.post.ts` verschieben; URL bleibt `POST /api/search` |
| `server/services/search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Fragebindung, Ausführung/Reservierung koordinieren | `workflow.ts` umbenennen, benötigte Koordination aus `coordinator.ts`/`submit.ts` integrieren; keine parallelen Schichten |
| `server/services/search/matrix.ts` | Wege gegen denselben Kriterienstand bewerten; Hindernisse und vollständige Abdeckung | Entscheidung aus `coordinator.ts` ablösen; keine Kombinationsliste oder doppelten Fachregeln |
| `server/services/search/llm.ts` | Submit/gebundene Antwort interpretieren, Ausgabe validieren | `parser.ts`/Transport sinnvoll zusammenführen; kein Parser je Weg |
| `server/services/search/texts.ts` | Zentrale übersetzbare Texte und Fragezuordnung | Verstreute Texte bündeln, keine vorsorgliche i18n-Infrastruktur; Fragenwahl bleibt fachlich |
| `server/services/tmdb/` | Ausgewählten Weg auf Parameter abbilden, aufrufen, validieren, normalisieren | Vorhandenen Titeladapter nutzen; keine zusätzliche `search/title.ts` als Wrapper |
| `server/utils/search-session.ts` | Cookie-Zuordnung/Ablage | Vom frameworkfreien Coordinator getrennt behalten |
| `src/lib/schemas/search.ts` | Zusammengehörige externe Suchverträge und Zod-abgeleitete Typen | Konsolidieren, keine blinde Übernahme von Runtime/Provider/Karten; interne Auftragstypen zu `flow.ts` |
| `src/lib/parser/instructions.ts` | Versionierter Systemauftrag | Behalten, keine neue Format-/Thinking-Optimierung |
| `scripts/search.mjs` | HTTP-Client, gebundene Eingabe, Auswahl, kompakte Ergebnisse | Nur bedarfsgerecht erweitern |

Eigene `title.ts`/`title/` erst bei benötigter eigenständiger Fachlogik. Wiederverwendung/DRY statt generischer Helferschichten. Unterschiedliche Jahresparameter gehören zur Providerabbildung, nicht zu mehreren Parsern.

## Taskdokumentation

```text
docs/tasks/search-architecture/
├── README.md
├── zielstruktur.md
└── 01-shared-search-matrix.md
```

Ein aktiver Task mit Umfang, Abnahmekriterien, Prüfprotokoll und Findings. Nächste Taskdatei erst für einen ausgewählten konkreten Anwendungsfall anlegen; beispielsweise Keyword ist möglich, nicht bereits beauftragt. Keine neue historische Notiz pro Umsetzungsschritt.

## Nachweis beim Umbau

Produktionsimporte, Aufrufer und Dokumentverweise nachziehen. Automatisierte Tests sind in dieser explorativen Phase zurückgestellt: keine neuen/erweiterten/duplizierten Tests, kein Testrefactoring. Unveränderte Tests nicht pauschal löschen; durch Pfade/Verträge entstandene Inkompatibilitäten im Task dokumentieren. Nicht durch Ausschlüsse oder unnötige Produktionskompatibilität verstecken.

Codeprüfung, manuelle Terminalfälle, Typecheck und Lint getrennt protokollieren. Nicht ausgeführte Tests und nicht reproduzierte Rennen bleiben offen; bei Checkfehlern Ursache nennen, keinen erfolgreichen Abschluss behaupten. Geänderte Struktur erst nach Umsetzung als Iststand führen. Keine neue Suchstrecke, Speicherlösung oder vollständiger Terminal-Ausbau als Teil des Strukturumbaus. Findings aus dem Durchstich aktualisieren Konzept und Matrix.
