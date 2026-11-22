# Zielstruktur der gemeinsamen Suche

Stand: 22. November 2026. Codebezug `a806145`. Struktur, Textkataloge, Terminaldarstellung, Gesamtzählung und Medienfragekorrektur implementiert; vollständige fachliche Abnahme offen. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [Task/Prüfprotokoll](01-shared-search-matrix.md). Umsetzung ist nicht Abnahme.

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
│   └── tmdb/                     # Transport, Adapter, Mapping und Titelgesamtzahl
└── utils/search-session.ts       # Cookie, Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Gemeinsame externe Suchverträge
└── parser/
    ├── instructions.ts           # Versionierter Systemauftrag
    └── clarification-instructions.ts # Bestehender Klärungszusatz
scripts/search.mjs               # HTTP-Terminalclient mit lokalem Textkatalog
```

Suchbereich, kein vollständiger Projektbaum. Runtime-/Provider-/Kartenverträge bleiben separat. Keine Dateien allein zur optischen Vollständigkeit.

## Zuständigkeiten und Stand

| Ziel | Verantwortung und Stand |
| --- | --- |
| `server/api/search/index.post.ts` | Aktionen/Runtime validieren, Session zuordnen, Flow aufrufen, HTTP abbilden. Zielpfad vorhanden; alte `server/api/search.post.ts` im zuvor geprüften API-Verzeichnis nicht vorhanden. URL `POST /api/search` erhalten. |
| `search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Matrixauswertung, nächste Aktion, Fragebindung, Ausführung/Reservierung. Workflow/Coordinator/Submit entfernt. Erzeugt Medienfrage mit zentralem `message`; derselbe gebundene Text dient Anzeige und Klärungskontext. Keine eigene Zählung. |
| `search/matrix.ts` | Wege gegen denselben Stand bewerten; Fähigkeiten, Hindernisse, vollständige Kriterien-/Umfangsabdeckung. Keine Texte, Fragebindungen oder Sessionverwaltung. Implementiert, Vollabnahme offen. |
| `search/llm.ts` | Gemeinsame Interpretation für Submit/gebundene Antwort, Modelltransport und Vorschlagsvalidierung. `parser.ts` entfernt. Keine Zustandsübernahme, Matrixentscheidung oder Suche. |
| `search/texts.ts` | Zentrale Anwendungsfragen und HTTP-/Sessionmeldungen. Medienfrage erklärt Jahresanlass; freie Modellnachrichten separat. AC9-Vollprüfung offen. |
| `services/tmdb/title-search.ts` | Parameter, Transport, Validierung, Karten, Gesamtzählung. Liefert `{ results, totalResults }`; Multi zusätzlich Personenzählung, Movie/TV direkte Zahlen. Zählfehler → null, gültige Karten erhalten; keine neue Sortierung/weiteren Seiten. |
| `utils/search-session.ts` | Cookie und konkrete Ablage, vom frameworkfreien Flow getrennt. Typimport auf Flow, Meldungen aus `texts.ts`. |
| `schemas/search.ts` | Konsolidierte Kriterien-/Vorschlags-/Frage-/Aktions-/Antwortverträge; vier alte Re-Exports entfernt. `select_media_type` hat Pflichtfeld `message`, Optionen und Fragebindung. Completed enthält `totalResults: number` oder `null`. |
| `parser/instructions.ts` und Klärungszusatz | Feste Anweisungen getrennt von Nutzerdaten. Seit `0715d10` Promptversion `1.5.2`: LLM liefert darstellbare Kriterien, nimmt Pflicht-Medienfrage nicht vorweg. Keine Thinking-/Formatoptimierung. |
| `scripts/search.mjs` | HTTP-Client für Eingaben, gebundene Antworten und Darstellung. Validiert/zeigt geliefertes `message` der Medienfrage, keine eigene Fachformulierung. Lokale Hilfen/Labels/Vorlagen in `terminalTexts`; keine Serverimporte. Tabelle/Seiten-/Gesamtzahl vorhanden, Live-Abnahme offen. |

## Medienklärung und Textgrenze

Nicht genannter Medientyp und ausdrücklich „Filme und Serien“ bedeuten `all`, sofern kein bestätigter anderer Typ fortgilt. Titel ohne Jahr bei `all` → Multi. Titel + Jahr + `all` → Matrix erkennt fehlende Abdeckung, Flow fordert gebundene Auswahl `movie`/`tv`; keine Suche. `all` nur Zwischenstand, vor Ausführung Auswahl übernehmen und Titel/Jahr erhalten. Explizites `movie`/`tv` optional mit Jahr → entsprechender direkter Weg. Nach Klärung erst ausdrückliches Execute.

`texts.ts` liefert den serverseitigen Anwendungstext, `terminalTexts` reine Darstellung einschließlich Medienlabels, Hilfen, Prompts, Fehler und Vorlagen. Keine Optionen aus LLM-Prosa ableiten, keine Fachregeln im Client, keine neue i18n-Infrastruktur. Technische Aktions-/Statuswerte und Befehle nicht übersetzen. `/select` klärt Medien, wählt keine Treffer.

Zählung bleibt im Adapter, nicht Matrix/LLM/CLI. Multi − Person = Movie + TV wurde für fünf Suchtexte lokal beobachtet, nicht als API-Garantie belegt. Multi/Person verwenden identischen Suchtext/adult und dieselben Standardwerte. Unplausible Zahlen nicht anzeigen. Eigene `title.ts`/`title/` nur bei benötigter eigenständiger Fachlogik; Jahresparameter bleiben Providerabbildung.

## Taskstruktur

```text
docs/tasks/search-architecture/
├── README.md
├── zielstruktur.md
└── 01-shared-search-matrix.md
```

Ein aktiver Task mit Umfang, ACs, Prüfprotokoll und Findings. Nächste Datei erst für konkret gewählten Anwendungsfall, keine Zwischenstands-/Auditdatei auf Vorrat.

## Prüfung und Reihenfolge

Letzte grüne Nutzerbestätigung: Typecheck/Lint/vorhandene Tests nach `794788f`, Rückmeldung 22. November 08:29 CET; frühere nach `9010afb` um 08:14 CET. Nicht auf spätere Commits übertragen. Kein eigener Projektbefehlslauf; aktuelle Checks einschließlich `0715d10`/`a806145` offen. Keine Befehle, Testzahlen oder Coverage aus pauschaler Rückmeldung ableiten.

Mitschnitt 08:39 belegt damalige direkte Titelwege und freie Dune-Klärung bis ready, nicht strukturierte Auswahl/Execute. Lokaler SHA unbekannt, vor Gesamtzählung und Medienfragekorrektur. Keine Vollabnahme von Modellverhalten, Rennen, AC9/AC10 oder integrierter Zählung. Vollständiger Produktionsimportscan offen.

Ausnahme `ed031e3`: bestehende Adaptertests minimal auf `.results` angepasst, Fälle/Mocks/Fehlererwartungen erhalten; keine zusätzliche Zählungsabsicherung. Allgemeiner Testausbau bleibt zurückgestellt; keine neuen Löschungen, Ausschlüsse oder vorsorgliche Migration.

Als Nächstes Struktur-/Produktionsimport-/Textzuordnungsprüfung abschließen, offene manuelle Fälle und Gesamtzählung durchstechen, aktuelle Checks protokollieren, Findings zurückführen und Architekturabschluss bewerten. Keine neue Suchstrecke/Speicherlösung.

## Letzter Arbeitspunkt: Testaudit

Erst nach Architekturumbau und manuellen Durchstichen bestehenden Bestand auf Aktualität, Modul-/Vertragsgrenzen, Doppelungen und fehlende Zusicherungen prüfen. Flow-/Race-/Zählungslücken einbeziehen; priorisierte Bestandsbewertung dokumentieren. Noch nicht durchgeführt. Konkrete Teständerungen separat vereinbaren, keine allgemeine Migrationsfreigabe.
