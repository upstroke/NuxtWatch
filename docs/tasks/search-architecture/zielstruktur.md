# Zielstruktur der gemeinsamen Suche

Stand: 21. November 2026. Beschlossenes Ziel nach dem Durchstich; Umbenennungen und Zusammenführungen sind noch umzusetzen. [Konzept mit Architekturbild und Matrix](../../sucharchitektur-konzept.md), [Arbeitsstand und nächste Schritte](README.md). Namen sollen Zuständigkeiten sichtbar machen; keine Dateien allein zur optischen Vollständigkeit anlegen.

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

Der Baum zeigt den Suchbereich, nicht sämtliche Projektdateien. Runtime-Verträge und bestehende Provider-/Kartenverträge bleiben an ihren fachlich passenden Stellen.

## Zuständigkeiten und Umbau

| Ziel | Aufgabe | Ausgangspunkt / notwendige Änderung |
| --- | --- | --- |
| `server/api/search/index.post.ts` | Aktionen und Runtime an der Grenze validieren, Session zuordnen, Coordinator aufrufen, HTTP-Antwort abbilden | Bestehende `server/api/search.post.ts` verschieben; URL bleibt `POST /api/search` |
| `server/services/search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Fragebindung, gemeinsame Ausführung und Reservierung koordinieren | `workflow.ts` umbenennen; benötigte Übernahme-/Ausführungsfunktionen aus `coordinator.ts` und `submit.ts` integrieren; keine parallelen Koordinationsschichten behalten |
| `server/services/search/matrix.ts` | Vorhandene Suchmöglichkeiten und deren Hindernisse gegen denselben Stand bewerten; vollständige Kriterienabdeckung verlangen | Titelbezogene Entscheidung aus `coordinator.ts` ablösen; keine vollständige Kombinationsliste und keine duplizierten Fachregeln |
| `server/services/search/llm.ts` | Gemeinsame Modellinterpretation für Submit und gebundenen Freitext; Ausgabe validieren | `parser.ts` und vorhandenen Transport auf sinnvolle Zusammenführung prüfen; nötige Funktionen behalten, keine Parser je Suchweg |
| `server/services/search/texts.ts` | Zentrale übersetzbare Anwendungstexte und Zuordnung fachlicher Frageanlässe | Bisher verstreute Texte bündeln; keine vorsorgliche Katalog-Infrastruktur; fachliche Fragenwahl bleibt in der Anwendung |
| `server/services/tmdb/` | Ausgewählten Weg auf Providerparameter abbilden, aufrufen, validieren und Treffer normalisieren | Bestehenden Titeladapter wiederverwenden; keine zusätzliche `search/title.ts`, solange sie nur weiterleitet |
| `server/utils/search-session.ts` | Sessionzuordnung und konkrete Ablage | Getrennt vom frameworkfreien Coordinator behalten |
| `src/lib/schemas/search.ts` | Zusammengehörige externe Kriterien-, Aktions-, Vorschlags- und Ergebnisverträge; Typen aus Zod ableiten | Vorhandene Suchverträge konsolidieren, ohne Runtime-/Provider-/Kartenverträge blind einzuziehen; interne Auftragstypen gehören zu `flow.ts` |
| `src/lib/parser/instructions.ts` | Versionierter Systemauftrag, getrennt von Nutzerdaten | Behalten; keine erneute Format-/Thinking-Optimierung als Teil des Umbaus |
| `scripts/search.mjs` | HTTP-Client, gebundene Eingaben, Auswahl und kompakte Ergebnisse | Bestehenden Client behalten und nur für den nächsten Durchstich erweitern |

Eine eigene `title.ts` oder ein `title/`-Ordner entsteht erst bei benötigter eigenständiger Titelfachlogik, nicht aufgrund des älteren Zielbaums. Wiederverwendbare Funktionen auslagern; keine generischen Helferschichten auf Vorrat. Unterschiedliche Jahresparameter gehören zur Providerabbildung, nicht in mehrere Parser.

## Nachweis beim Umbau

Importe, Aufrufer, Tests und Dokumentverweise nachziehen. Gleiches Verhalten erhalten, außer wo Konzeptänderungen ausdrücklich festgelegt sind. Geänderte Struktur ist erst nach Umsetzung und Checks Iststand. Keine neue Suchstrecke, neues Speichersystem oder vollständiger Terminal-Ausbau im bloßen Strukturumbau. Der erneute Titel-Durchstich prüft Matrix, Bindung, Execute und kompakte Darstellung; Findings fließen zurück ins Konzept.
