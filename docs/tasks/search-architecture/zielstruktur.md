# Zielstruktur der gemeinsamen Suche

Stand: 22. November 2026. Codebezug `794788f`; Struktur, Textkataloge und kompakte Terminalanzeige implementiert, vollständige fachliche Abnahme offen. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [Task 01 und Prüfprotokoll](01-shared-search-matrix.md). Umsetzung ist nicht automatisch fachliche Abnahme.

## Zielbaum

```text
server/
├── api/search/index.post.ts       # Gemeinsamer HTTP-Einstieg
├── services/
│   ├── search/
│   │   ├── flow.ts                # Gemeinsamer Coordinator
│   │   ├── matrix.ts              # Fähigkeiten und Hindernisse
│   │   ├── llm.ts                 # Transport, Interpretation und Validierung
│   │   └── texts.ts               # Anwendungseigene Klärungs-/HTTP-/Sessiontexte
│   └── tmdb/                     # Bestehender Transport, Adapter und Mapping
└── utils/search-session.ts       # Cookie, Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Gemeinsame externe Suchverträge
└── parser/
    ├── instructions.ts           # Versionierter Systemauftrag
    └── clarification-instructions.ts # Bestehender Klärungszusatz
scripts/search.mjs               # HTTP-Terminalclient mit lokalem Textkatalog
```

Suchbereich, nicht vollständiger Projektbaum. Runtime-/Provider-/Kartenverträge bleiben fachlich separat. Keine Dateien allein zur optischen Vollständigkeit.

## Zuständigkeiten und Umsetzungsstand

| Ziel | Verantwortung | Stand |
| --- | --- | --- |
| `server/api/search/index.post.ts` | Aktionen/Runtime validieren, Session zuordnen, Flow aufrufen, HTTP abbilden | Zielpfad vorhanden; alte `server/api/search.post.ts` im geprüften API-Verzeichnis nicht mehr vorhanden. URL bleibt `POST /api/search`. |
| `search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Fragebindung, Ausführung/Reservierung | Zusammengeführt und angebunden; Workflow/Coordinator/Submit entfernt. Interne Auftragstypen bleiben hier. |
| `search/matrix.ts` | Wege gegen denselben Stand bewerten, Hindernisse und vollständige Abdeckung | Implementiert; manuelle/fachliche Abnahme offen. Keine Kombinationsliste oder doppelten Regeln. |
| `search/llm.ts` | Gemeinsame Interpretation für Submit/gebundene Antwort, Modelltransport und Vorschlagsvalidierung | Zusammengeführt; `parser.ts` entfernt. Keine Zustandsübernahme, Matrixentscheidung oder Treffersuche. |
| `search/texts.ts` | Anwendungseigene Klärungsformulierungen und technische HTTP-/Sessionmeldungen | Flow, HTTP und Session verwenden den Katalog; freie Modellnachrichten separat. Keine vorsorgliche i18n-Infrastruktur. Vollständige Textzuordnungsprüfung/AC9 offen. |
| `services/tmdb/` | Parameterabbildung, Provideraufruf, Validierung und Normalisierung | Vorhandenen Titeladapter wiederverwendet, kein zusätzlicher Titel-Wrapper. |
| `utils/search-session.ts` | Cookie-Zuordnung und konkrete Ablage | Getrennt vom frameworkfreien Flow; Typimport auf Flow, Sessionmeldungen aus `texts.ts`. |
| `schemas/search.ts` | Externe Kriterien-, Vorschlags-, Frage-, Aktions- und Antwortverträge, Zod-abgeleitete Typen | Konsolidiert; vier alte Schemadateien inklusive Übergangs-Re-Exports entfernt. |
| `parser/instructions.ts` und Klärungszusatz | Feste Modellanweisungen getrennt von Nutzerdaten | Unverändert erhalten; keine Format-/Thinking-Optimierung im Umbau. |
| `scripts/search.mjs` | HTTP-Eingaben, gebundene Antworten, Auswahl und Darstellung | Kompakte Treffertabelle und lokaler `terminalTexts`-Katalog implementiert; keine Serverimporte oder neue Datei. Manuelle Abnahme offen. |

`texts.ts` ist der serverseitige Anwendungskatalog; `terminalTexts` enthält ausschließlich Terminaldarstellung einschließlich lokaler Medienauswahl-Beschriftung, Hilfen, Prompts, Fehler und Ausgabevorlagen. Kein gemeinsamer server-/clientübergreifender Katalog. Freie Server-/Modellnachrichten bleiben unverändert. Technische Aktions-/Statuswerte und Befehlsauswertung sind keine übersetzbaren Texte.

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

Typecheck, Lint und vorhandene Tests für den Stand nach `794788f` am 22. November um 08:29 CET laut Nutzer erfolgreich. Kein eigener Tool-Lauf und keine Ableitung konkreter Befehle, Testzahlen oder Coverage. Daraus keine vollständige fachliche, Live-Modell- oder Parallelitätsabnahme ableiten. Manuelle Fälle im Task noch offen. Frühere grüne Rückmeldung nach `9010afb` um 08:14 CET historisch erhalten.

Automatischer Testausbau bleibt zurückgestellt. Einzelne ausdrücklich freigegebene Löschungen sowie Titeltest-Korrektur und Parser-Testimportanpassung sind im Task dokumentiert; keine allgemeine Testmigration. Keine Prüfkonfiguration oder Ausschlüsse zum Verbergen von Fehlern. Vollständiger repositoryweiter Produktionsimportscan noch nicht nachgewiesen. AC9 und AC10 nicht allein aufgrund implementierter Kataloge/Tabelle oder grüner Checks abgenommen.

Keine neue Suchstrecke, Speicherlösung oder vollständiger Terminal-Ausbau als Teil des Strukturumbaus. Findings aktualisieren Konzept und Matrix.
