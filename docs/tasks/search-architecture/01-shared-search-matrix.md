# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: in Umsetzung, nicht vollständig fachlich abgenommen. Stand: 22. November 2026. Codebezug `a806145`, Branch `feat/shared-search-architecture`.

Grundlagen: [Konzept/Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Keine zweite vollständige Regelmatrix.

## Ziel und Umfang

Bestehende Suche gemäß Zielstruktur ordnen, Titelwege gemeinsam bewerten. Titel ist Abnahmefall gemeinsamer Architektur, kein eigener Parser. Nächsten Anwendungsfall erst nach Abschluss auswählen; Keyword möglich, nicht beauftragt.

Umfang: gemeinsamer Coordinator, Hindernisbewertung, externe Verträge, zentrale Texte und nötige Terminaldarstellung. Sessionbindung, JSON-Interpretation und Adapter erhalten. Gesamtzählung ausdrücklich nachbeauftragt: Multi zusätzliche Personenabfrage, Movie/TV direkte Zahlen; keine Personensuchoberfläche. Medienfragekorrektur mit `0715d10`/`a806145` ebenfalls ausdrücklich beauftragt. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Datenbank, Regel-Engine, vollständige i18n, Web-UI oder Modellvergleich.

## Verbindliche Medienklärung

LLM interpretiert, Matrix bewertet Kriterien-/Umfangsabdeckung, Flow bestimmt nächsten Schritt und bindet Frage, `texts.ts` formuliert, Oberfläche zeigt an. Keine zusätzlichen Koordinationsschichten.

Titel bei `all` ohne Jahr → Multi. Titel + Jahr + `all` → verpflichtend Film/Serie auswählen, auch bei ausdrücklich „Filme und Serien“. `all` nur ungeklärter Zwischenstand; vor Ausführung Nutzerauswahl nach `movie`/`tv` übernehmen, Titel/Jahr erhalten. LLM errät keinen Typ, entfernt kein Jahr und stellt diese Pflicht-Anwendungsfrage nicht vorweg. `ready` beim LLM bedeutet darstellbarer Vorschlag, nicht Ausführbarkeit. Explizite Einzeltypen optional mit Jahr → Movie/TV. Bestehende bestätigte Kriterien nur auf ausdrücklichen Wunsch ändern. Keine Listen-Zusammenführung/Jahres-Nachfilterung.

Strukturierte Frage enthält seit `a806145` Pflichtfeld `message`, Optionen und Bindung. Zentraler Text: „Bei einer Titelsuche mit Jahresangabe musst du zwischen Film und Serie wählen. Möchtest du nach einem Film oder einer Serie suchen?“ Flow bindet Text; Anzeige/Klärungskontext nutzen ihn. CLI validiert und zeigt statt eigener fachlicher Formulierung. Keine Optionen aus Modellprosa. Auswahl ohne LLM, Freitext über gemeinsame Interpretation; Clarify sucht nie, erst Execute nach Klärung.

## Prüfvereinbarung

Allgemeiner Testausbau bis abschließendem Audit zurückgestellt. Keine vorsorgliche Migration, pauschale Löschung, Ausschluss-/Coverage-/Checkkonfigurationsänderung zum Verbergen von Fehlern. Gezielte Codeprüfung und dokumentierte manuelle Fälle; grüne Checks kein fachlicher Nachweis. Race-Fälle ohne passende Prüfung offen.

Freigegebene Ausnahmen am 22. November:

- Zwei veraltete Submission-Tests entfernt; Ersatzabsicherung offen.
- `title-search.spec.ts`: zunächst nur `include_adult: 'true'` zur Multi-Erwartung.
- `search-parser.spec.ts`: nur Import `search/parser` → `search/llm`, Fälle erhalten.
- `ed031e3`: bestehende Adapter-Arrayzugriffe/-erwartungen minimal auf `.results`, Fälle/Mocks/Fehlererwartungen erhalten, veralteten Lückenkommentar entfernt. Kein Logik-/Testausbau, umfangreicher Zählungstestentwurf nicht committed.
- Vorhandene Tests auf Nutzerauftrag ausgeführt; letzte grüne Nutzerbestätigung 08:29 CET nach `794788f`. Keine Freigabe allgemeinen Testausbaus, kein Nachweis späterer Änderungen.

## Umsetzungsschritte

- [ ] Vollständige Struktur-/Produktionsimportprüfung abschließen; bisher gezielte Prüfung.
- [x] Flow zusammenführen, HTTP/Session anbinden, Workflow/Coordinator/Submit entfernen.
- [ ] Matrix vollständig fachlich prüfen/manuell abnehmen.
- [x] Suchverträge konsolidieren, fünf geprüfte Produktionsdateien direkt umstellen, vier Re-Exports entfernen.
- [x] HTTP-Zielpfad herstellen; URL erhalten.
- [x] Interpretation/Validierung nach `llm.ts`, Flow/Testimport umstellen, Parsermodul entfernen.
- [x] Zentrale Servertexte/lokale Terminaltexte; vollständige AC9-Prüfung offen.
- [x] Bestehenden Titeladapter ohne Wrapper wiederverwenden.
- [x] Kompakte Treffer und getrennte Gesamtzahl implementieren; Live-Abnahme offen.
- [x] Bestehende Adaptertests minimal auf `.results` anpassen, keine Zählungsabsicherung.
- [x] Promptzuständigkeit korrigieren (`0715d10`, Version `1.5.2`).
- [x] Medienfragetext über Schema/Flow/Terminal durchreichen (`a806145`).
- [ ] Aktuelle Checks und manuelle Regression nach `a806145` protokollieren.
- [ ] Findings zurückführen und Architekturabschluss bewerten, nächsten Weg separat wählen.
- [ ] Zuletzt bestehenden Testbestand auditieren; konkrete Änderungen anschließend vereinbaren.

Abgehakt bedeutet umgesetzt, nicht fachlich abgenommen.

## Abnahmekriterien

| ID | Beobachtbares Kriterium | Prüfung |
| --- | --- | --- |
| AC1 | Produktionsdateien gemäß Zielstruktur, keine alten Schichten/Importe; Testlücken erfasst | Codeprüfung, Typecheck |
| AC2 | Wege gegen denselben Stand, alle bestätigten Kriterien/Umfang erhalten, keine mehrfachen Fachregeln | Code, manuelle Fälle |
| AC3 | Titel allein bei all über Multi, keine optionale Typ-/Jahresfrage | Terminal, Wegwahl im Code |
| AC4 | Expliziter Film/Serie über Movie/TV, Jahr über primary_release_year/first_air_date_year | Terminal, Parameterabbildung |
| AC5 | Titel/Jahr/all erzeugt gebundene Anwendungsfrage mit Film-/Serienoptionen und zentralem Text, kein Trefferaufruf; auch ausdrücklich Filme und Serien/Jahr | Terminal, Übergang im Code |
| AC6 | Auswahl ohne LLM wechselt zu movie/tv; Freitext erhält Wunsch/Fragekontext; Titel/Jahr erhalten oder ausdrücklich korrigiert | Terminal, Code |
| AC7 | Clarify sucht nicht, Execute nutzt bestätigten gebundenen Stand ohne erneutes LLM | Terminal, Code |
| AC8 | Alte Antworten überschreiben nichts; wiederholte/parallele Starts reservierter Revision ohne zweiten Trefferaufruf | Reproduzierte Fälle, Code; ungeprüfte Rennen offen |
| AC9 | Gründe/Formulierung getrennt; zentrale Anwendungsfrage via message bis CLI/Klärungskontext; keine doppelte Medienfrage im Client/i18n auf Vorrat | Codeprüfung |
| AC10 | Kriterien/Fragen/kompakte Treffer, Seiten-/Gesamtzahl getrennt; unbekannt nicht verfügbar, leere Seite nicht automatisch null; Fehler/leer/Treffer und Altresultate unterscheidbar | Terminal, Adapter |
| AC11 | Aktuelle Typecheck-/Lint-Ergebnisse und manuelle offene Abnahmen einzeln dokumentiert; Testausbau bis Audit zurückgestellt | Protokoll |

Gesamtzahl ausdrücklich nachbeauftragt; keine rückwirkende Abnahme.

## Historische manuelle Beobachtungen

Nutzermitschnitt 22. November 08:39 CET, `node scripts/search.mjs http://localhost:3000`; lokaler SHA unbekannt, vor `e06cb2c` und vor beiden Medienfragecommits. Zahlen beobachtet, keine dauerhaften Erwartungen. Je neuem Fall Ausgangskriterien, Eingabe/Aktion, resultierenden Stand/Frage, belegte Wegwahl und Suchstart erfassen. Providerparameter nicht allein aus Anzeige ableiten, keine Zugangsdaten committen.

| Fall | Beobachtung | Restprüfung |
| --- | --- | --- |
| 1 Reset/Titel | Reset → all; Inception/all direkt ohne Frage, 13 Treffer | Codeweg/Regression nach Änderungen |
| 2 Film/Serie | Inception/movie zwölf, Dark/tv 20 Treffer | Provideraufrufe separat |
| 3 Einzeljahr | `suche den Film Inceptionvon 2010` → Inception/movie/2010, drei Treffer; Dark/tv/2017, 17 Treffer, Datumswerte 2017 | Jahresparameter separat |
| 4 Auswahl | Nicht erreicht: Dune/2021 freie LLM-Frage statt Optionen | Nach a806145 beide all/Jahr-Varianten, Text/Optionen, /select und Execute |
| 5 Freitext | Dune/2021 zweimal zunächst nur all, LLM fragt; Film bzw. Ich meine den Film → Dune/movie/2021 ready, keine Suche | Aktuelle Regression, Jahreskorrektur, Bindung/Execute |
| 6 Neuer Auftrag/Reset | Reset nach ready gesehen, nicht bei offener Frage | Submit/Reset bei offener Frage, alte Bindung, verzögerte Antwort reproduzieren |
| 7 Ausführung | Kein Execute dokumentiert | Execute, Wiederholung, kontrollierter Fehler/Neuver such, Parallelstarts; CLI-Ablehnung beweist keine Serverreservierung |
| 8 Darstellung | Film/Serie, Datum/ID, fehlendes Datum als —, Antwortzahl sichtbar | Leer/Fehler/Altresultate, integrierte Gesamtzahl/Ausfallpfad |

Historischer JSON-Stand `81dc0e8`: Morgenbogen/1999 mit freien Film-/Serienantworten → movie/1999 bzw. tv/1999, explizite Jahreskorrektur → movie/2001; Titel erhalten, ready ohne Suche. Execute ungeprüft, frühere Fehlerursache nicht isoliert. Kein aktueller Regressionsnachweis. Keine eigenen Terminalfälle und keine Vollabnahme aus diesen Nutzerläufen.

## Separater API-Zählversuch

Nutzerrückmeldung 09:13 CET, language=de-DE, include_adult=true, page=1. Verglichen total_results, nicht Seitenlänge.

| Suchtext | Multi | Movie | TV | Person | Multi − Person | Movie + TV |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Inception | 13 | 12 | 1 | 0 | 13 | 13 |
| Dark | 6296 | 4991 | 511 | 794 | 5502 | 5502 |
| Dune | 1409 | 1227 | 96 | 86 | 1323 | 1323 |
| Tom Hanks | 10 | 8 | 1 | 1 | 9 | 9 |
| Batman | 248 | 185 | 24 | 39 | 209 | 209 |

Abweichung in allen fünf Fällen null; Stichprobe, kein API-Vertrag oder Mengen-/ID-Vergleich. Implementiert nur zusätzliche Personenzählung bei Multi, keine getrennten Ergebnislisten. Kein integrierter Live-Nachweis nach e06cb2c.

## Prüfprotokoll

| Kriterium | Status | Beleg/Lücke |
| --- | --- | --- |
| AC1 | Teilweise geprüft | Gezielte Struktur-/Vertragsprüfung; Vollscan/aktuelle Checks offen |
| AC2 | Teilweise geprüft | Implementiert, vollständige Kriterienabdeckung offen |
| AC3 | Teilweise geprüft | Historischer Inception/all-Lauf, aktuelle Regression offen |
| AC4 | Teilweise geprüft | Historische Typ-/Jahrübernahme sichtbar; Parameter separat prüfen |
| AC5 | Teilweise geprüft | Historisch freie Frage ohne sichtbare Suche; Anwendungspfad jetzt korrigiert, Live-Nachweis offen |
| AC6 | Teilweise geprüft | Historische freie Antworten bis ready; aktuelle Auswahl/Erhalt/Korrektur/Bindung offen |
| AC7 | Teilweise geprüft | Historisch Clarify ohne Suche; Execute nicht durchlaufen |
| AC8 | Nicht geprüft | Altbindung/Wiederholung/Parallelität offen |
| AC9 | Teilweise geprüft | Kataloge und Textdurchreichung implementiert; vollständige Zuordnungsprüfung offen |
| AC10 | Teilweise geprüft | Historische Erfolgsansicht, vor Zählung; weitere Zustände/aktuelle Live-Abnahme offen |
| AC11 | Teilweise geprüft | Historische grüne Meldung nach 794788f; aktuelle Checks/manuelle Fälle offen |

Statuskategorien: nicht geprüft, teilweise geprüft, erfüllt, fehlgeschlagen, blockiert. Keine Vollabnahme aus Review/grünen Tests.

| Check | Letzter gemeldeter Stand |
| --- | --- |
| Typecheck | Nutzerbestätigung 08:29 CET nach 794788f; spätere Änderungen einschließlich 0715d10/a806145 offen |
| Lint | Dieselbe Rückmeldung/Grenze |
| Vorhandene Tests | Dieselbe Rückmeldung; ed031e3 und spätere Änderungen nicht durch neuen Lauf bestätigt |
| Terminal | Historische Teilnachweise 08:39, kein neuer Durchstich nach Medienfragekorrektur |
| Gesamtzählung | Implementiert, integrierter Live-Nachweis fehlt; API-Stichprobe kein Ersatz |

Keine eigenen Projektbefehlsläufe. Keine Befehle/Zahlen/Coverage/Browser- oder HTTP-Suite aus pauschaler Rückmeldung ableiten. Uhrzeiten sind Rückmeldungen, keine gemessenen Laufzeitpunkte. Historisch TS2345 mit 6861dff korrigiert, danach Typecheck erfolgreich; Multi-Erwartung mit 07200b5 korrigiert, danach alle drei Checks grün gemeldet. Weitere grüne Meldung nach 9010afb um 08:14, zuletzt nach 794788f um 08:29 CET.

## Umsetzungschronik

| Commit | Änderung |
| --- | --- |
| 2e9a27b | Gemeinsame Matrix |
| 377b977, 26312c4 | Flow zusammenführen, HTTP/Session anbinden |
| 235e0d2, 63ab5df, 932e41d | Workflow/Submit/Coordinator entfernen |
| 6861dff | HTTP-Ergebnistyp ohne Cast korrigieren |
| 25aaf44, 7940ca3 | Zwei alte Submission-Tests auf Wunsch entfernen |
| 3f87bd7, 5cf625f | Suchverträge konsolidieren |
| 464649b | Fünf Produktionsdateien auf direkte Schemaimporte |
| 49ad728, 3e3027e, 51f8810, 5244cb3 | Vier Re-Exports entfernen |
| 07200b5 | Titeltesterwartung include_adult |
| d70769e, 9010afb | Interpretation/Typen nach LLM, Imports umstellen, Parser entfernen |
| 83b393f | Kompakte Terminaltreffer |
| 22f6cd2 | Sieben HTTP-/zwei Sessionmeldungen zentral, Wortlaut/Codes/Kontrollfluss erhalten |
| 794788f | Lokale Terminaltexte, Befehle/HTTP/Bindung erhalten |
| 664851a | Früheren Arbeitsstand/grüne Nutzerchecks dokumentieren |
| e06cb2c | results/totalResults durch Adapter/Flow/HTTP/CLI, Multi minus Personen, null bei Zählfehler |
| ed031e3 | Bestehende Adaptertests nur auf .results, Lückenkommentar entfernen |
| 0715d10 | Prompt 1.5.2: Pflicht-Medienfrage der Anwendung überlassen, Regeln/Beispiele anpassen |
| a806145 | Zentralen Medienfragetext via Pflichtfeld message an Flow/Terminal/Klärungskontext binden |

Ursprüngliche Commits für HTTP-Zielpfad/Klärungstexte mangels ermitteltem Beleg nicht nachgetragen. LLM-Modulumbau erhielt JSON-Kontext, Generator-Injektion, JSON-/Schemaprüfung, Konfigurations-/Leerantwortfehler, maxOutputTokens 256, maxRetries 0; spätere Promptkorrektur separat ausgewiesen. Kriterienübernahme/Ausführung im Flow, Vorschlagsvertrag im Schema.

## Textzuordnung und Gesamtzahl

Die frühere Feststellung „kein Auftrag zur Prompt-/Vertragskorrektur“ ist durch die ausdrückliche Beauftragung überholt. Historisch fragte das LLM vor Kriterienübernahme; seit 0715d10 soll der darstellbare Vorschlag die Matrix erreichen. Seit a806145 erhält die strukturierte Anwendungsfrage ihren zentralen Text. Umsetzung kein Nachweis zuverlässigen Live-Modellverhaltens. Allgemeine Teilübernahme bei LLM-Klärung weiterhin nicht beauftragt; Auswahl konkreter Treffer nicht implementiert.

Terminaltexte lokal, keine zusätzlichen Serverimporte/Katalogdatei/i18n. Freie Modelltexte separat. Adapter validiert Primärantwort/Karten wie bisher und Metadaten separat. Multi zählt zusätzlich Personen mit gleichem Suchtext/adult/Standardwerten; Differenz nur plausibel, mindestens sichtbare Karten, Personenzahl mindestens Personen erster Multi-Seite. Fehler/fehlende/unplausible Metadaten → null, gültige Karten erhalten. Movie/TV ohne Zusatzaufruf. Kein Rückfall auf ungefilterte Multi-Zahl, keine Auffüllung/Pagination/Neusortierung. Leere erste Seite nicht null insgesamt, null keine erfolgreiche Zählung. Keine zusätzliche automatisierte Absicherung durch ed031e3.

## Importprüfung und offene Absicherung

Produktionsprüfung gezielt, kein vollständiger Scan. Auf 5244cb3 alle 20 TypeScript-Testdateien gelesen (14 Unit, zwei HTTP, ein Mock, drei Fixtures): keine direkten/relativen/Mock-/dynamischen Verweise auf vier entfernte Schemas. Kein Testlauf. Parser-Testimport danach ausdrücklich auf llm umgestellt.

| Entfernte Datei | Historischer Grund | Offene Ersatzabsicherung |
| --- | --- | --- |
| tests/unit/services/search-submission.spec.ts | Alter Coordinatorimport, mit 25aaf44 auf Wunsch entfernt | Kriterienkopie/Jahr entfernen/unabhängige Kriterien |
| tests/integration/tmdb/search-submission.spec.ts | Alter Submitimport/veraltete Erwartungen, mit 7940ca3 entfernt | Direktsuche/Klärung ohne Trefferaufruf/vollständige Kriterien |

Entfernter Integrationstest erwartete historisch kein include_adult und lehnte Film-/Serie-Jahr fälschlich ab. Kennungen SEARCH-SUBMIT-INT-001 bis 005 ausgemustert. Keine Kompatibilitätsmodule/Ausschlüsse/Checkänderungen. Erhaltene Tests ersetzen keine Flow-/Race-/Zählungsabsicherung.

## Findings und Architekturabschluss

Zielpfad, Kataloge, Terminaldarstellung, Zählung und Medienfragekorrektur implementiert. Nächste Prüfung: vollständige Produktionsimporte/Struktur/Textzuordnung, dann aktuelle manuelle Fälle und Checks. Findings in gemeinsame Regeln zurückführen, Architekturabschluss bewerten. Keine Vollabnahme, Produktionsfreigabe oder neuer Suchweg aus diesem Stand.

## Letzter Arbeitspunkt: Audit bestehender Tests

- [ ] Erst nach Architekturumbau und manuellen Durchstichen auditieren.

Bestand auf fachliche Aktualität, Grenzen Matrix/Flow/LLM/Provider/HTTP, Doppelungen und fehlende Zusicherungen prüfen. Kriterienübernahme/Jahrentfernung, Klärung/Execute, Altbindungen/Reservierung/Parallelität und Zählung einbeziehen. Ergebnis priorisierte Bestandsbewertung; konkrete Teständerungen separat vereinbaren. Nicht durchgeführt, keine allgemeine Freigabe zur Migration/Erweiterung/Löschung.
