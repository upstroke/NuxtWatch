# NuxtWatch – Sucharchitektur

Stand: 22. November 2026. Codebezug `d6e071c`, Branch `feat/shared-search-architecture`. Der gemeinsame Titel-Durchstich ist im vereinbarten Umfang abgeschlossen; kein vollständiger Produktions- oder Race-Nachweis. Maßgeblicher [Abschluss und Prüfstand](tasks/search-architecture/01-shared-search-matrix.md), [Arbeitsstand](tasks/search-architecture/README.md), [Zielstruktur](tasks/search-architecture/zielstruktur.md).

## Grundlage und Zuständigkeiten

Ausgangspunkt sind [TMDb-Analyse](tmdb-api-analysis.md) und [Suchbeispiele](tmdb-search-examples.md). Titel ist erster Abnahmefall der gemeinsamen Architektur, nicht die Grundlage getrennter Parser je Suchstrecke. Neue Suchwege einzeln belegen und vertikal umsetzen; keine vollständige Matrix, Regel-Engine oder Speicherarchitektur auf Vorrat.

- LLM: natürliche Sprache und gebundene Freitextantworten interpretieren, JSON-Vorschläge validieren. Keine Zustandsübernahme, Endpunktwahl oder Suche. LLM-`ready` ist keine Ausführungsfreigabe.
- Matrix: Wege gegen denselben Kriterienstand auf vollständige Abdeckung prüfen und Hindernisse liefern. Keine Texte oder Sessionverwaltung.
- Flow: validierte Änderungen übernehmen, Aktualität prüfen, nächste Aktion bestimmen, Fragen binden und Ausführung reservieren.
- Adapter: Providerparameter, Transport, Validierung, Karten und Gesamtzahlen. Keine Änderung der Suchabsicht.
- HTTP/Session: externe Verträge, Statusabbildung, Cookiebindung und prozesslokale Ablage.
- Oberflächen: gelieferte Fragen/Optionen/Ergebnisse darstellen, keine zweite fachliche Suchmatrix.

## Aktuelle Kriterien und Wege

Bestätigte Kriterien bleiben erhalten, sofern nicht ausdrücklich geändert. Das gemeinsame Objekt beschreibt Titel, Medientyp und optionales Einzeljahr, keine Endpunkte.

| Kriterien | Verhalten |
| --- | --- |
| Titel fehlt | Bei gemeinter Titelstrecke Titel klären; andere Absichten nicht umdeuten |
| Titel, `all`, kein Jahr | Multi; keine optionale Typ-/Jahresfrage |
| Titel, `movie`, optional Jahr | Movie mit `primary_release_year` |
| Titel, `tv`, optional Jahr | TV mit `first_air_date_year` |
| Titel, Jahr, `all` | Gebundene Auswahl `movie` oder `tv`; keine Treffersuche |

Nicht genannter Typ und ausdrücklich Filme und Serien bedeuten `all`, sofern kein bestätigter anderer Typ fortgilt. Ausdrückliche Änderung auf beide Medien ist erlaubt. Mit Jahr ist `all` nur Zwischenstand: Titel/Jahr erhalten, Typ auswählen, danach Execute. Keine geratenen Typen, entfernten Jahre, zusammengeführten Movie-/TV-Listen oder eigene Jahres-Nachfilterung. Dies ist eine Produktentscheidung, keine grundsätzliche API-Unmöglichkeit. Mehrfachtreffer allein sind kein Pflichtklärungsgrund. Jahresbereiche sind nicht umgesetzt; genaue Daten nicht ungefragt verkürzen. Discover ersetzt keinen freien Titelabgleich.

Personen aus Multi werden nicht zu Titelkarten. `include_adult=true`, keine Adult-basierte Ausfilterung. Locale/Pagination sind Ausführungsoptionen. Movie/TV liefern direkte Gesamtzahlen; Multi zieht eine gesonderte plausible Personenzählung ab. Fehlerhafte/fehlende Zählmetadaten ergeben `null`, gültige Karten bleiben. Leere Seite ist nicht gleich Gesamtzahl null. Keine weiteren Seiten oder Neusortierung.

## Aktionen und Bindungen

- `submit`: neuer Auftrag auf Basis bestätigter Kriterien; ersetzt den bisherigen und darf ohne Klärungsbedarf direkt suchen.
- `clarify`: gebundene Antwort übernehmen und erneut bewerten, niemals Treffersuche. Angebotene Medienauswahl ohne LLM; Freitext über gemeinsame Interpretation.
- `execute`: aktuelle bestätigte Revision erneut prüfen und ausführen, ohne erneute LLM-Interpretation. Nach Klärung ausdrücklich erforderlich.
- `reset`: neuer Sessionkontext ohne alte Kriterien.

`requestId`, `revision` und `questionId` schützen die Aktualität. Submit/Execute teilen die Reservierung vor dem Provideraufruf; laufende/erfolgreiche Revision nicht erneut ausführen, technischer Fehler erlaubt ausdrücklichen Neuversuch. Keine Zusicherung für Submit-Idempotenz oder erneute Ergebnisauslieferung.

Sessionablage: ein Prozess, 30 Minuten Inaktivität, maximal 1.000 Sessions, nicht neustartfest oder instanzübergreifend. Alte Bindungen im neuen Kontext ergeben `409`; ein nicht mehr vorhandenes altes Cookie ergibt `410`. Keine öffentliche Produktionsfreigabe; Zugriffsschutz und Betriebsgrenzen separat bewerten.

## Texte und Oberfläche

`searchTexts` liefert Anwendungs-, HTTP- und Sessiontexte. Der Flow bindet die Medienfrage als Pflichtfeld `message`; HTTP validiert, CLI zeigt sie an. Derselbe Text dient dem Freitextkontext zusammen mit ursprünglichem Auftrag, bestätigten Kriterien, auftragsbezogenen Antworten und aktueller Frage. Kein allgemeiner Chatverlauf auf Vorrat. Optionen nicht aus Modellprosa ableiten.

Reine Terminalhilfen/Labels/Vorlagen bleiben in `terminalTexts`; `/select` klärt Medien, wählt keine Treffer. TMDb-Fehlertexte sind seit `0e7c642` unter drei stabilen englischen Schlüsseln in `services/tmdb/errors.ts` gebündelt; Wortlaut, Codes und HTTP-Abbildung unverändert. Keine Sprachauswahl oder zusätzliche i18n-Infrastruktur. Freie Modellnachrichten bleiben separat.

## Abschluss und Erweiterungsgrenzen

Gezielt vereinbarte Adapter-, Flow- und HTTP-/Sessiontests sowie der lokale Live-Audit sind abgeschlossen; Nutzer bestätigt Tests, Lint, Typecheck und Coverage über 80%. Nachweisumfang und historische Befunde ausschließlich im [Task](tasks/search-architecture/01-shared-search-matrix.md).

Konkrete Matrix-Wegkennung wird noch nicht bis zur Ausführung durchgereicht; Medienfrage bleibt ein pauschaler Restfall nach fehlendem Titel/passendem Weg. Bei neuen Kriterien neu bewerten. Allgemeine Teilübernahme bei LLM-Klärung, optionale Ergebnisverfeinerung, Web-Wizard, neue Suchwege und vollständige i18n bleiben separate Entscheidungen. Keine generelle Garantie für LLM-Semantik, interne Parallelität oder alle Fehlerfälle aus erfolgreichen Stichproben ableiten.
