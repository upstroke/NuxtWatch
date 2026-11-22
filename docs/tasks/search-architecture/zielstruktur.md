# Zielstruktur der gemeinsamen Suche

Stand: 22. November 2026. Codebezug `d6e071c`, Branch `feat/shared-search-architecture`. Im vereinbarten Such-/Titelumfang umgesetzt und geprüft; kein vollständiger Projektbaum oder Produktionsfreigabenachweis. [Konzept](../../sucharchitektur-konzept.md), [Arbeitsstand](README.md), [Abschlussprotokoll](01-shared-search-matrix.md).

## Produktionsstruktur

```text
server/
├── api/search/index.post.ts       # HTTP-Verträge, Runtime, Statusabbildung
├── services/
│   ├── search/
│   │   ├── flow.ts                # Kriterien, Aktualität, Fragen, Reservierung
│   │   ├── matrix.ts              # Fähigkeiten und Hindernisse
│   │   ├── llm.ts                 # Transport, Interpretation, Vorschlagsvalidierung
│   │   └── texts.ts               # Anwendungs-, HTTP- und Sessiontexte
│   └── tmdb/
│       ├── title-search.ts        # Titelparameter, Karten und Gesamtzahlen
│       └── errors.ts              # Fehlercodes, Status und stabile englische Texte
└── utils/search-session.ts       # Cookie, prozesslokale Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Kriterien, Vorschläge, Fragen, Aktionen, Antworten
└── parser/
    ├── instructions.ts           # Versionierter Systemauftrag
    └── clarification-instructions.ts
scripts/search.mjs               # HTTP-Terminalclient, lokaler Darstellungskatalog
```

Runtime-/Provider-/Kartenverträge bleiben separat. Keine alten Workflow-/Coordinator-/Submission-/ausführenden Parsermodule im geprüften Suchkern. Alte Chat-Verträge/Export und TMDb-Spike-Fehleralias wurden gezielt entfernt; Historie im Task. Kein projektweiter Vollscan behauptet.

## Verantwortungsgrenzen

Matrix bewertet vollständige Kriterien-/Umfangsabdeckung ohne Texte oder Zustand. LLM interpretiert/validiert ohne Suche oder Zustandsübernahme; Prompt 1.5.3 präzisiert Kriterienerhalt. Flow bindet zentrale Frage und entscheidet nächste Aktion. HTTP validiert Ein-/Ausgabe und übersetzt Fehler, Session ordnet Cookie und Ablage zu. Adapter bildet Jahresparameter ab und liefert `results`/`totalResults`; Zählfehler lassen gültige Karten bestehen.

`message` wird vom zentralen Suchkatalog über Flow und Response-Schema bis CLI/Freitextkontext durchgereicht. Reine Terminaltexte bleiben lokal, freie Modellnachrichten separat. Keine zusätzliche i18n-Infrastruktur. Drei englische TMDb-Fehlertexte zentralisiert, ohne Änderung von Codes/Status/Wortlaut.

## Gezielte Teststruktur

```text
tests/unit/services/title-search.spec.ts         # Endpunkte, Mapping, robuste Gesamtzahlen
tests/unit/services/search-flow.spec.ts          # Echter Flow/Matrix/Parser mit äußeren Testgrenzen
tests/integration/search/search-http.spec.ts     # Echter Handler/Session über H3-HTTP-Server
tests/integration/search/README.md              # Aufbau und Grenzen des HTTP-Harness
```

Flowtests kontrollieren Modellgenerierung und injizierten TMDb-Transport; HTTP-Tests zusätzlich Runtime-Konfiguration und Nuxt-Autoimportbereitstellung durch echte H3-Funktionen. Interne Suchmodule bleiben echt. H3-HTTP ist kein vollständiger Nuxt-/Nitro- oder Browserlauf. Keine Änderung der Runner-/Coverage-Regeln zum Abschluss.

Nutzer bestätigt Tests, Lint, Typecheck und Coverage über 80%; lokaler Live-Audit acht von acht bestanden. Details und Nachweisgrenzen im Task, keine rohen Berichte oder lokales Audit-Skript im Zielbaum.

## Erweiterungen

Konkrete Matrix-Wegkennung wird noch nicht durchgereicht; pauschale Restfall-Medienfrage bei neuen Kriterien neu bewerten. Weitere Wege erst nach API-Beleg und eigener Beauftragung, keine vorsorglichen Wrapper/Dateien/State-Machine-Bibliothek. Gemeinsame Methoden wiederverwenden, nicht Regeln zwischen Prompt/Matrix/Adapter duplizieren.

Dokumentation bleibt bei README, Zielstruktur und einem Task je gewähltem Durchstich. Historische Detailstände sind über die Git-Historie erreichbar; kein neues Zwischenstandsverzeichnis.
