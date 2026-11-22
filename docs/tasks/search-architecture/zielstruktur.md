# Zielstruktur der gemeinsamen Suche

Stand: 22. November 2026. Zielbild teilweise umgesetzt, Codebezug `9010afb`. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [Task 01 und Prüfprotokoll](01-shared-search-matrix.md). Umsetzung ist nicht automatisch fachliche Abnahme.

## Zielbaum

```text
server/
├── api/search/index.post.ts       # Gemeinsamer HTTP-Einstieg; Verschiebung offen
├── services/
│   ├── search/
│   │   ├── flow.ts                # Gemeinsamer Coordinator
│   │   ├── matrix.ts              # Fähigkeiten und Hindernisse
│   │   ├── llm.ts                 # Transport, Interpretation und Validierung
│   │   └── texts.ts               # Zentrale Texte/Fragezuordnung; noch offen
│   └── tmdb/                     # Bestehender Transport, Adapter und Mapping
└── utils/search-session.ts       # Cookie, Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Gemeinsame externe Suchverträge
└── parser/
    ├── instructions.ts           # Versionierter Systemauftrag
    └── clarification-instructions.ts # Bestehender Klärungszusatz
scripts/search.mjs               # Bedarfsgerecht erweiterter HTTP-Terminalclient
```

Suchbereich, nicht vollständiger Projektbaum. Runtime-/Provider-/Kartenverträge bleiben fachlich separat. Keine Dateien allein zur optischen Vollständigkeit.

## Zuständigkeiten und Umsetzungsstand

| Ziel | Verantwortung | Stand |
| --- | --- | --- |
| `server/api/search/index.post.ts` | Aktionen/Runtime validieren, Session zuordnen, Flow aufrufen, HTTP abbilden | Inhalt weiter in `server/api/search.post.ts`; Verschiebung offen, URL bleibt `POST /api/search`. |
| `search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Fragebindung, Ausführung/Reservierung | Zusammengeführt und angebunden; Workflow/Coordinator/Submit entfernt. Interne Auftragstypen bleiben hier. |
| `search/matrix.ts` | Wege gegen denselben Stand bewerten, Hindernisse und vollständige Abdeckung | Implementiert; manuelle/fachliche Abnahme offen. Keine Kombinationsliste oder doppelten Regeln. |
| `search/llm.ts` | Gemeinsame Interpretation für Submit/gebundene Antwort, Modelltransport und Vorschlagsvalidierung | Zusammengeführt; `parser.ts` entfernt. Keine Zustandsübernahme, Matrixentscheidung oder Treffersuche. |
| `search/texts.ts` | Übersetzbare Anwendungstexte und Zuordnung fachlicher Frageanlässe | Noch umzusetzen; keine vorsorgliche i18n-Infrastruktur. |
| `services/tmdb/` | Parameterabbildung, Provideraufruf, Validierung und Normalisierung | Vorhandenen Titeladapter wiederverwendet, kein zusätzlicher Titel-Wrapper. |
| `utils/search-session.ts` | Cookie-Zuordnung und konkrete Ablage | Getrennt vom frameworkfreien Flow; Typimport auf Flow umgestellt. |
| `schemas/search.ts` | Externe Kriterien-, Vorschlags-, Frage-, Aktions- und Antwortverträge, Zod-abgeleitete Typen | Konsolidiert; vier alte Schemadateien inklusive Übergangs-Re-Exports entfernt. |
| `parser/instructions.ts` und Klärungszusatz | Feste Modellanweisungen getrennt von Nutzerdaten | Unverändert erhalten; keine Format-/Thinking-Optimierung im Umbau. |
| `scripts/search.mjs` | HTTP-Eingaben, gebundene Antworten, Auswahl und Darstellung | Vorhandener Client; kompakte Trefferdarstellung noch offen. |

Eigene `title.ts`/`title/` nur bei eigenständiger benötigter Fachlogik. Wiederverwendung statt Wrapper-/Helferschichten auf Vorrat. Jahresparameter gehören zur Providerabbildung, nicht zu mehreren Parsern.

## Taskstruktur

```text
docs/tasks/search-architecture/
├── README.md
├── zielstruktur.md
└── 01-shared-search-matrix.md
```

Ein aktiver Task mit Umfang, Abnahmekriterien, Prüfprotokoll und Findings. Nächste Datei erst für konkret gewählten Anwendungsfall. Keine neue historische Notiz pro Umsetzungsschritt.

## Prüfung

Typecheck, Lint und vorhandene Tests nach `9010afb` laut Nutzer erfolgreich. Kein eigener Tool-Lauf; daraus keine vollständige fachliche, Live-Modell- oder Parallelitätsabnahme ableiten. Manuelle Fälle im Task noch offen. Nach weiterem Umbau Checks erneut protokollieren.

Automatischer Testausbau bleibt zurückgestellt. Einzelne ausdrücklich freigegebene Löschungen sowie Titeltest-Korrektur und Parser-Testimportanpassung sind im Task dokumentiert; keine allgemeine Testmigration. Keine Prüfkonfiguration oder Ausschlüsse zum Verbergen von Fehlern. Produktionsimporte/Dokumentverweise weiter nachziehen; vollständiger repositoryweiter Produktionsimportscan noch nicht nachgewiesen.

Keine neue Suchstrecke, Speicherlösung oder vollständiger Terminal-Ausbau als Teil des Strukturumbaus. Findings aktualisieren Konzept und Matrix.
