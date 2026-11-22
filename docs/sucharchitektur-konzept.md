# NuxtWatch – Sucharchitektur

Stand: 22. November 2026. Dauerhafte Referenz für Regeln, Struktur und Erweiterungsgrenzen der gemeinsamen Suche. Der erste Such-/Titel-Durchstich ist im vereinbarten Umfang abgeschlossen. Geprüfter Codebezug `d6e071c`, Branch `feat/shared-search-architecture`; spätere Dokumentationsänderungen sind keine neuen Funktionsprüfungen. Kein vollständiger Produktions-, Race-, Browser- oder Modellnachweis.

## Grundlage und Arbeitsweise

Ausgangspunkt sind [TMDb-Analyse](tmdb-api-analysis.md) und [geprüfte Suchbeispiele](tmdb-search-examples.md). API-Fähigkeit, Produktentscheidung und implementierter Stand bleiben getrennt. Titel ist erster Abnahmefall der gemeinsamen Architektur, nicht Grundlage getrennter Parser je Suchstrecke.

Neue Suchwege einzeln belegen und vertikal umsetzen: API prüfen, gemeinsame Kriterien und Hindernisse ergänzen, konkreten Ablauf prüfen und Findings zurückführen. Keine vollständige Matrix, Regel-Engine, zweite Routing-Matrix, Speicherarchitektur oder Wrapper/Dateien auf Vorrat. Gemeinsame Methoden wiederverwenden, keine Fachregeln zwischen Prompt, Matrix, Adapter und Oberfläche duplizieren.

## Verantwortlichkeiten

- LLM: natürliche Sprache und gebundene Freitextantworten interpretieren und Kriterienänderungen vorschlagen; die Vorschlagsvalidierung erfolgt im gemeinsamen LLM-Modul. Keine Zustandsübernahme, Endpunktwahl oder Suche. LLM-`ready` ist keine Ausführungsfreigabe.
- Matrix: konkrete Wege gegen denselben Kriterienstand auf vollständige Abdeckung prüfen und Hindernisse liefern. Keine Texte, Fragebindung oder Sessionverwaltung.
- Flow: validierte Änderungen übernehmen, Aktualität prüfen, nächste Aktion bestimmen, Fragen binden und Ausführung reservieren.
- Adapter: Providerparameter, Transport, Antwortvalidierung, Karten und Gesamtzahlen. Keine Änderung der Suchabsicht oder Session.
- HTTP/Session: externe Verträge und Statusabbildung beziehungsweise Cookiebindung, Ablage und Lebensdauer.
- Oberflächen: serverseitige Fragen, Optionen und Ergebnisse darstellen; keine zweite fachliche Suchmatrix. Kandidatenauflösung ist keine Treffersuche.

## Struktur

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
│       └── errors.ts              # Fehlercodes, Status, stabile englische Texte
└── utils/search-session.ts       # Cookie, prozesslokale Ablage, Lebensdauer
src/lib/
├── schemas/search.ts             # Kriterien, Vorschläge, Fragen, Aktionen, Antworten
└── parser/
    ├── instructions.ts           # Versionierter Systemauftrag
    └── clarification-instructions.ts
scripts/search.mjs               # HTTP-Terminalclient, lokaler Darstellungskatalog
```

Suchbereich, kein vollständiger Projektbaum. Weitere TMDb-Transport-/Mappingmodule sowie Runtime-/Provider-/Kartenverträge bleiben separat. Im geprüften Suchkern wurden alte Workflow-/Coordinator-/Submission-/ausführende Parsermodule entfernt; alte Chat-Verträge/Export und Spike-Fehleralias wurden gezielt bereinigt. Kein projektweiter Vollscan behauptet.

## Kriterien und Wege

Das gemeinsame Kriterienobjekt beschreibt den Wunsch, nicht den Endpunkt. Aktuell unterstützt: Titel, Medientyp und optionales Einzeljahr. Bestätigte Kriterien bleiben erhalten, sofern nicht ausdrücklich geändert. Prompt 1.5.3 präzisiert diesen Kriterienerhalt; Modellbefolgung bleibt separat zu bewerten.

| Kriterien | Verhalten |
| --- | --- |
| Titel fehlt | Bei gemeinter Titelstrecke Titel klären; andere Absichten nicht umdeuten |
| Titel, `all`, kein Jahr | Multi; keine optionale Typ-/Jahresfrage |
| Titel, `movie`, optional Jahr | Movie; Jahr über `primary_release_year` |
| Titel, `tv`, optional Jahr | TV; Jahr über `first_air_date_year` |
| Titel, Jahr, `all` | Gebundene Auswahl `movie` oder `tv`; keine Treffersuche |

Nicht genannter Typ und ausdrücklich Filme und Serien bedeuten `all`, sofern kein bestätigter anderer Typ fortgilt. Ausdrückliche Aufhebung auf beide Medien ist erlaubt. Mit Jahr ist `all` ein zu klärender Zwischenstand: Titel/Jahr erhalten, Typ auswählen, danach Execute. Kein geratenes Medium, entferntes Jahr, Zusammenführen von Listen oder eigene Jahres-Nachfilterung. Das ist eine Produktentscheidung, keine grundsätzliche API-Unmöglichkeit.

Mehrfachtreffer allein sind kein Pflichtklärungsgrund. Jahresbereiche sind nicht umgesetzt; genaue Daten nicht ungefragt verkürzen. Filmjahr meint primäres Veröffentlichungsjahr, Serienjahr Erstausstrahlungsjahr. Discover ersetzt keinen freien Titelabgleich. Weitere Kriterien erst mit ihrem konkreten API-Beleg und Durchstich ergänzen.

## Aktionen, Zustand und Bindungen

- `submit`: neuer ausdrücklicher Auftrag auf Basis bestätigter Serverkriterien. Er erhält eine neue `requestId` und ersetzt den bisherigen Auftrag bereits vor dem Modellaufruf. Die bisherigen Kriterien bleiben zunächst erhalten; alte Frage- und Execute-Bindungen sind nicht mehr aktuell. Scheitert die Interpretation, wird der vorherige Auftrag nicht automatisch wiederhergestellt. Ohne verbleibenden Klärungsbedarf darf der neue Auftrag direkt suchen. Kein clientseitiger Ersatzstand.
- `clarify`: gebundene Antwort prüfen, übernehmen und erneut bewerten, niemals Treffersuche. Angebotene Medienauswahl ohne LLM; Freitext über gemeinsame Interpretation. Der Antwortstatus `clarified` bedeutet, dass die Antwort verarbeitet wurde. Er kann eine Folgefrage enthalten und ist allein keine Ausführungsfreigabe.
- `execute`: aktuelle bestätigte Revision erneut prüfen und ausdrücklich ausführen, ohne erneute LLM-Interpretation. Nach abgeschlossener Klärung erforderlich. Eine offene Frage oder laufende Freitextklärung blockiert die Ausführung.
- `reset`: bisherige Sessionzuordnung entfernen und einen neuen Sessionkontext ohne alte Kriterien erzeugen.

Validierte Kriterien können bereits während offener Klärung gespeichert sein; eine offene Frage startet keine Treffersuche. Ein gespeicherter Kriterienstand ist nicht automatisch ausführbar.

`requestId`, `revision` und `questionId` binden Antworten an Auftrag, Stand und Frage. Die Revision gilt innerhalb eines Auftrags und beginnt bei jedem neuen Auftrag mit `1`. Sie wird bei der Übernahme eines Kriterien-/Klärungsergebnisses erhöht, nicht bei jedem HTTP-Aufruf oder Ausführungsergebnis. Unterschiedliche Aufträge sind über ihre Request-ID zu unterscheiden, nicht durch einen Vergleich ihrer Revisionsnummern.

Verspätete Ergebnisse dürfen keinen neueren Stand überschreiben oder alte Fragen wieder öffnen. Vor der Übernahme asynchroner Ergebnisse wird deren Aktualität erneut geprüft. Externe Aufrufe müssen dafür nicht abbrechbar sein. Diese serverseitige Absicherung ist kein vollständiger Nachweis gegen Browser-Cookierennen.

Submit und Execute teilen die Reservierung vor dem Provideraufruf. Eine laufende oder erfolgreiche Revision darf nicht erneut gestartet werden; ein technischer Ausführungsfehler erlaubt einen ausdrücklichen Neuversuch derselben Revision. Ein neuer Submit ist dagegen ein neuer Auftrag und kann dieselben Kriterien erneut ausführen. Keine Zusicherung für Submit-Idempotenz oder erneute Ergebnisauslieferung bei wiederholtem Execute.

Die Sessionablage ist prozesslokal: 30 Minuten Inaktivität, maximal 1.000 Sessions, nicht neustartfest oder instanzübergreifend. Ein mitgesendetes, nicht mehr vorhandenes oder abgelaufenes Sessioncookie führt zu `410`. Nicht anwendbare Frage- oder Execute-Bindungen führen bei gültiger Session und verfügbarer erforderlicher Konfiguration zu `409`. Da die Konfigurationsprüfung teilweise vor der Bindungsprüfung erfolgt, kann fehlende Konfiguration zuvor `503` auslösen. Zugriffsschutz und Betriebsgrenzen vor öffentlichem Betrieb separat bewerten.

## Karten und Gesamtzahlen

Personen aus Multi werden nicht zu Titelkarten. `include_adult=true`, keine Adult-basierte Ausfilterung. Locale/Pagination sind Ausführungsoptionen, Sprache ist nicht Providerregion. ID und Medientyp identifizieren eine Karte gemeinsam.

Titeladapter liefert `results` und `totalResults`. Movie/TV nutzen direkte Providerzahlen; Multi zieht eine gesonderte plausible Personenzählung mit gleichem Suchtext/Adult-Parameter und gleichen Standardwerten ab. Unverfügbare oder unplausible Zählung ergibt `null`, gültige Karten bleiben. Keine Rückkehr zur ungefilterten Multi-Zahl. Leere Seite ist nicht gleich Gesamtzahl null; keine Auffüllung, weiteren Seiten oder Neusortierung.

Technischen Fehler, erfolgreiche leere Liste und Trefferliste unterscheiden. Keine Altresultate als neue Ergebnisse einer blockierten Revision darstellen. Optionale Ergebnisverfeinerung ist von Pflichtklärung vor Ausführung getrennt und nicht vollständig umgesetzt.

## Texte und Oberflächen

`searchTexts` liefert Anwendungs-, HTTP- und Sessiontexte. Der Flow bindet die Medienfrage als Pflichtfeld `message`; HTTP validiert, CLI zeigt sie an. Derselbe gebundene Text dient dem Freitextkontext mit ursprünglichem Auftrag, bestätigten Kriterien, auftragsbezogenen Antworten und aktueller Frage. Kein allgemeiner Chatverlauf auf Vorrat; Optionen nicht aus Modellprosa ableiten.

Reine Terminalhilfen/Labels/Vorlagen bleiben in `terminalTexts`. Normaler Text ohne offene Frage ist Submit, sonst gebundene Antwort. `/submit TEXT`, `/select NUMMER`, `/execute`, `/reset` und `/exit` sind explizit; `/select` klärt Medien und wählt keine Treffer. Kompakte Tabelle mit Titel, Typ, Datum und ID; Seiten-/Gesamtzahl getrennt.

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration sind nötig. Keine Providerzugangsdaten im Terminalclient. TMDb-Fehlertexte sind seit `0e7c642` unter drei stabilen englischen Schlüsseln in `server/services/tmdb/errors.ts` gebündelt; Wortlaut, Codes und HTTP-Abbildung unverändert. Keine zusätzliche i18n-Infrastruktur oder Sprachauswahl. Freie Modellnachrichten bleiben separat. Web-/Wizardanbindung ist nicht abgenommen.

## Prüfstand des abgeschlossenen Titel-Durchstichs

Stand vom 22. November 2026; Nachweise nicht auf spätere Verhaltensänderungen übertragen.

| Nachweis | Umfang und Herkunft |
| --- | --- |
| `8172f08` | Titeladaptertests: Endpunkte/Jahr, Karten, direkte/Multi-Zahlen, Metadaten, isolierter Personen-Zählungsfehler und leere Seiten; Nutzer bestätigt Testlauf |
| `0e0e002` | Echter Flow/Matrix/Vorschlagsvalidierung/Adapter mit kontrollierten äußeren Grenzen: Kriterienerhalt/-änderung, Klärung, Execute, Bindungen, Reservierung und expliziter Neuversuch nach Fehler; Nutzer bestätigt Tests |
| `e885a7c` | Echter Handler/Session über isoliertes H3-HTTP: Validierung, Cookies, Sessiontrennung, Reset, Konflikte, Antwortvertrag, no-store; Nutzer bestätigt Tests |
| `d6e071c` | Lint-Korrektur: Provider-Gate-Prüfung vor Ausführung statt Throw im finally |
| Projektchecks | Nutzer bestätigt um 18:17 CET Tests, Lint und Typecheck, anschließend Coverage über 80%; keine genaue Quote, Metrik oder Testanzahl genannt; keine eigenen Projektbefehlsläufe des Assistants |
| Live-HTTP | Nutzerlauf gegen localhost:3000, 18:23 CET: acht PASSED, null FAILED, null BLOCKED; Konsolenausgabe und JSON-Bericht in der Unterhaltung geprüft |

Live-Fälle: neuer Auftrag bei offener Frage; falsche Request-/Frage-ID und Revision; doppelte Antwort; Reset mit alten Bindungen und Cookie; veraltetes Execute; Wiederholung nach Erfolg; zwei gleichzeitig abgesendete Executes; ausdrücklich Filme und Serien mit Jahr. Erwartete Konflikte beobachtet, gültiger aktueller Stand danach nutzbar. Parallelfall einmal completed/200 und einmal 409, kein Beweis interner Überlappung oder Provideraufrufzahl. Alle protokollierten Antworten no-store.

Live-Bericht `search-flow-audit-report.json`: 17:23:14.748Z bis 17:23:31.397Z; Commitangabe `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69` vom Aufrufer, nicht gegen den Server verifiziert. Audit-Skript nur lokal bereitgestellt und mit node --check geprüft; Skript und Rohberichte nicht committed. Der Audit prüft benötigte Felder, nicht das vollständige gemeinsame Schema.

Geprüfte Suchproduktionspfade ohne blockierenden Struktur-/Import-/Textzuordnungsbefund; projektweiter Vollscan ausdrücklich aus dem Abschlussumfang genommen und nicht durchgeführt. Kein vollständiger projektweiter Testbestandsaudit behauptet. Die vorherige Testzurückstellung wurde durch separat vereinbarte gezielte Blöcke ergänzt; [Testregeln](testing.md) und [Entwicklungsregeln](../AGENTS.md) gelten weiterhin.

Das ausführliche [historische Abschlussprotokoll von Task 01](https://github.com/upstroke/NuxtWatch/blob/5ac52968b8f68acfd2db0f838ac012c127c7357c/docs/tasks/search-architecture/01-shared-search-matrix.md) bleibt über den festen Commit erreichbar. Es enthält auch frühere B-/R-/D-Nachweise und deren Grenzen. R04-Freitext select 1 bleibt historisch fehlgeschlagen und außerhalb des vereinbarten Terminalumfangs; kein stillschweigender Fix. D01/D02 bleiben mit ihren damaligen Nachweisgrenzen historisch, nicht als neue Vollabnahme.

## Offene Architektur- und Sicherheitsgrenzen

1. Konkrete Matrix-Wegkennung wird nicht bis zur Ausführung durchgereicht. Bei Erweiterung die eindeutige Weitergabe der Wegentscheidung bewerten.
2. Medienfrage bleibt pauschaler Restfall nach fehlendem Titel/passendem Weg. Neue Kriterien benötigen passende Klärung oder begründete Ablehnung statt ungeprüfter Wiederverwendung.
3. Allgemeine Teilübernahme bei LLM-Klärung ist nicht vollständig umgesetzt. Unabhängige Kriterien und gekoppelte Änderungen benötigen eine eigene fachliche Entscheidung.
4. Prompt-Injection-Resistenz wurde nicht gezielt abgenommen. Schema-gültig ist nicht gleich auftragstreu; Modellantworten bleiben nicht vertrauenswürdig. Deterministische Grenztests und adversariale Modelltests separat vereinbaren. Sicherheitsregeln sind kein bestandener Sicherheitsaudit.

Nicht vollständig nachgewiesen: dauerhafte LLM-Semantik, instrumentierte Live-Provideraufrufzahlen, garantierte interne Execute-Überlappung, gezielt verzögerte TMDb-Antworten, kontrollierte reale Provider-/Personenzählungsausfälle, Browser-Cookierennen, Sessionablauf/Kapazitätsgrenze, Mehrinstanz-/Neustartverhalten. Kontrollierte Servicefehler/-neuversuche ersetzen keine realen Ausfallsimulationen.

Kein Produktionsfreigabenachweis. Weitere Suchwege, Web-Wizard, optionale Ergebnisverfeinerung, vollständige i18n, Betriebs- und Sicherheitsarbeit separat beauftragen. Kein nächster Suchweg vorweggenommen; Keyword ist eine Möglichkeit, keine festgelegte Folgeimplementierung.
