# Zielstruktur der gemeinsamen Suche

Stand: 22. November 2026. Codebezug `ed031e3`; Struktur, Textkataloge, kompakte Terminalanzeige und Gesamtzählung implementiert, vollständige fachliche Abnahme offen. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [Task 01 und Prüfprotokoll](01-shared-search-matrix.md). Umsetzung ist nicht automatisch Abnahme.

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

Suchbereich, nicht vollständiger Projektbaum. Runtime-/Provider-/Kartenverträge bleiben separat. Keine Dateien allein zur optischen Vollständigkeit.

## Zuständigkeiten und Umsetzungsstand

| Ziel | Verantwortung | Stand |
| --- | --- | --- |
| `server/api/search/index.post.ts` | Aktionen/Runtime validieren, Session zuordnen, Flow aufrufen, HTTP abbilden | Zielpfad vorhanden; alte `server/api/search.post.ts` im zuvor geprüften API-Verzeichnis nicht vorhanden. URL bleibt `POST /api/search`. |
| `search/flow.ts` | Auftrag, Kriterienübernahme, Revision, Fragebindung, Ausführung/Reservierung | Zusammengeführt; Workflow/Coordinator/Submit entfernt. Reicht Karten und `totalResults` aus dem Adapter weiter, keine eigene Zählungslogik. |
| `search/matrix.ts` | Wege gegen denselben Stand bewerten, Hindernisse und vollständige Abdeckung | Implementiert; vollständige fachliche Abnahme offen. Keine Kombinationsliste oder doppelten Regeln. |
| `search/llm.ts` | Gemeinsame Interpretation für Submit/gebundene Antwort, Modelltransport und Vorschlagsvalidierung | Zusammengeführt; `parser.ts` entfernt. Keine Zustandsübernahme, Matrixentscheidung oder Treffersuche. |
| `search/texts.ts` | Anwendungseigene Klärungsformulierungen und technische HTTP-/Sessionmeldungen | Flow, HTTP und Session verwenden Katalog; freie Modellnachrichten separat. Vollständige Textzuordnungsprüfung/AC9 offen. |
| `services/tmdb/title-search.ts` | Parameterabbildung, Providerantwort validieren, Karten normalisieren und verfügbare Titelgesamtzahl ermitteln | Liefert `{ results, totalResults }`. Nur Multi zählt zusätzlich Personen und subtrahiert sie. Movie/TV verwenden eigene Providerzahlen. Zählungsfehler → null statt Verlust gültiger Karten. Keine neue Sortierung oder weitere Ergebnisseiten. |
| `utils/search-session.ts` | Cookie-Zuordnung und konkrete Ablage | Getrennt vom frameworkfreien Flow; Typimport auf Flow, Meldungen aus `texts.ts`. |
| `schemas/search.ts` | Externe Kriterien-, Vorschlags-, Frage-, Aktions- und Antwortverträge, abgeleitete Typen | Konsolidiert; vier alte Schema-Re-Exports entfernt. Completed-Antwort enthält `totalResults: number` oder `null` für nicht verfügbar. |
| `parser/instructions.ts` und Klärungszusatz | Feste Modellanweisungen getrennt von Nutzerdaten | Unverändert erhalten; keine Format-/Thinking-Optimierung im Umbau. |
| `scripts/search.mjs` | HTTP-Eingaben, gebundene Antworten, Auswahl und Darstellung | Lokaler `terminalTexts`-Katalog; Tabelle und getrennte Anzeige von Seiten-/Gesamtzahl. Keine Serverimporte. Integrierte Gesamtzahlanzeige noch nicht live abgenommen. |

`texts.ts` ist der serverseitige Anwendungskatalog; `terminalTexts` enthält reine Terminaldarstellung einschließlich Medienauswahl-Beschriftung, Hilfen, Prompts, Fehler und Vorlagen. Kein gemeinsamer server-/clientübergreifender Katalog oder i18n-Infrastruktur. Freie Nachrichten unverändert; technische Aktions-/Statuswerte und Befehlsauswertung nicht übersetzen. `/select` dient der Medienklärung, nicht der Auswahl gefundener Werke.

Zählung bleibt im Provideradapter, nicht in Matrix/LLM/CLI. Die Gleichheit Multi − Person = Movie + TV wurde für fünf Suchtexte mit de-DE/adult=true lokal beobachtet, nicht als API-Garantie belegt. Implementierung verwendet für beide Multi-/Personenaufrufe dieselben Standardwerte und denselben Suchtext/adult-Parameter; unplausible Zahlen werden nicht angezeigt.

Eigene `title.ts`/`title/` nur bei eigenständiger benötigter Fachlogik. Wiederverwendung statt Wrapper-/Helferschichten auf Vorrat. Jahresparameter gehören zur Providerabbildung, nicht zu mehreren Parsern.

## Taskstruktur

```text
docs/tasks/search-architecture/
├── README.md
├── zielstruktur.md
└── 01-shared-search-matrix.md
```

Ein aktiver Task mit Umfang, ACs, Prüfprotokoll und Findings. Nächste Datei erst für konkret gewählten Anwendungsfall, keine historische Notiz pro Schritt. Audit als letzter Arbeitspunkt im bestehenden Task, keine neue Auditdatei auf Vorrat.

## Prüfung und nächste Reihenfolge

Letzte grüne Nutzerbestätigung: Typecheck/Lint/vorhandene Tests nach `794788f`, Rückmeldung 22. November 08:29 CET. Keine neuen Läufe nach `e06cb2c`/`ed031e3` gemeldet, kein eigener Lauf. Keine Befehle, Testzahlen oder Coverage ableiten. Frühere grüne Meldung nach `9010afb` um 08:14 CET historisch erhalten.

Nutzer-Mitschnitt 08:39 belegt direkte Titelsuchen und freie Dune-Klärungen bis ready, nicht die strukturierte Auswahl und nicht Execute. Exakter lokaler SHA nicht genannt; vor Gesamtzählungsänderung. Keine Vollabnahme von Live-Modell-/Parallelitätsverhalten oder AC9/AC10. Details im Task; vollständiger Produktionsimportscan offen.

Minimaler Ausnahmefall `ed031e3`: bestehende Adaptertests auf `.results` angepasst; Fälle/Mocks/Fehlererwartungen erhalten. Keine zusätzliche automatisierte Zählungsabsicherung. Keine Testlöschungen, Checkausschlüsse oder vorsorgliche Migration. Allgemeiner Testausbau bis zum Audit zurückgestellt.

Reihenfolge: Architektur-/Textzuordnungsprüfung und Produktionsimporte abschließen; manuelle Durchstiche einschließlich Gesamtzahl fortführen; Findings zurückführen und aktuelle Checks erfassen. Keine neue Suchstrecke oder Speicherlösung als Teil dieses Umbaus.

## Letzter Arbeitspunkt: Audit der bestehenden Tests

Nach Architekturumbau und manuellen Durchstichen Bestand auf Aktualität, passende Modul-/Vertragsgrenzen, Doppelungen und fehlende Zusicherungen prüfen. Offene Flow-/Race- und Zählungslücken einbeziehen. Ergebnis als priorisierte Bestandsbewertung dokumentieren; konkrete Teständerungen separat vereinbaren. Jetzt nur eingeplant, weder gestartet noch Freigabe einer allgemeinen Testmigration.
