# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: in Umsetzung, nicht vollständig fachlich abgenommen. Stand: 22. November 2026. Codebezug: `ed031e3`, Branch: `feat/shared-search-architecture`.

Grundlagen: [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Keine zweite vollständige Regelmatrix.

## Ziel und Umfang

Bestehende Suche gemäß Zielstruktur ordnen und vorhandene Titelwege über dieselbe Hindernismatrix bewerten. Titel ist Abnahmefall der gemeinsamen Architektur, kein eigener Parser. Erst nach Abschluss dieses Durchstichs nächsten konkreten Anwendungsfall wählen; Keyword ist möglich, nicht beauftragt.

Umfang: gemeinsamer Coordinator, Hindernisbewertung, zusammengehörige externe Verträge, zentrale Anwendungstexte und nötige Terminaldarstellung. Sessionbindung, JSON-Interpretation und Provideradapter erhalten. Gesamtzählung nachträglich ausdrücklich beauftragt: nur Multi benötigt eine zusätzliche Personenabfrage; Movie/TV verwenden direkte Gesamtzahlen. Keine neue Keyword-/Personen-/Discovery-Suchstrecke, Jahresbereiche, Datenbank, Regel-Engine, vollständige Internationalisierung, Web-UI oder neuer Modellvergleich. Personenzählung ist keine Personensuchoberfläche.

## Prüfvereinbarung und freigegebene Ausnahmen

Allgemeiner Testausbau bleibt bis zum abschließenden Audit zurückgestellt. Keine vorsorgliche Testmigration, pauschale Löschung, geänderten Ausschlüsse oder Coverage-/Checkkonfiguration zum Verbergen von Fehlern. Kriterien per Codeprüfung und dokumentierten Terminalfällen prüfen; grüne Checks ersetzen keine fachliche Abnahme.

Einzelentscheidungen am 22. November:

- Zwei veraltete Submission-Testdateien auf Nutzerwunsch entfernt; Ersatzabsicherung offen.
- In `title-search.spec.ts` zunächst nur `include_adult: 'true'` zur Multi-Aufruferwartung ergänzt.
- In `search-parser.spec.ts` nur Import von `search/parser` auf `search/llm` umgestellt; Erwartungen/Testumfang erhalten.
- Mit `ed031e3` bestehende Arrayzugriffe/-erwartungen im Titeladaptertest minimal auf `.results` umgestellt; Fälle, Mocks, Fehlererwartungen erhalten, keine Suchlogik geändert. Veralteten Lückenkommentar entfernt. Der umfangreichere Entwurf neuer Zählungstests wurde nicht committed.
- Vorhandene Tests auf Nutzerauftrag ausgeführt und Ergebnisse als Nutzerbericht erfasst. Letzte grüne Rückmeldung 08:29 CET nach `794788f`; keine Freigabe allgemeinen Testausbaus und kein Prüfnachweis für die späteren Änderungen.

## Umsetzungsschritte

- [ ] Vollständige Struktur-/Aufruferprüfung abschließen; bisher gezielte Dateien, kein vollständiger repositoryweiter Produktionsimportscan.
- [x] Koordination in `flow.ts` zusammenführen, HTTP/Session anbinden; Workflow/Coordinator/Submit entfernen.
- [ ] Matrix vollständig fachlich prüfen und manuell abnehmen.
- [x] Kriterien-, Vorschlags-, Frage-, Aktions- und Antwortverträge in `src/lib/schemas/search.ts` konsolidieren; fünf geprüfte Produktionsdateien direkt umstellen, vier Schema-Re-Exports entfernen.
- [x] HTTP-Zielpfad `server/api/search/index.post.ts` herstellen; URL beibehalten, alte Datei im zuvor geprüften API-Verzeichnis nicht vorhanden.
- [x] Gemeinsame Interpretation/Validierung in `llm.ts` zusammenführen; Flow/freigegebenen Testimport umstellen, Parsermodul entfernen.
- [x] Klärungs-/HTTP-/Sessiontexte in `texts.ts`, reine Terminaltexte lokal in `terminalTexts` bündeln; vollständige AC9-Prüfung offen.
- [x] Bestehenden TMDb-Titeladapter ohne zusätzlichen Titel-Wrapper wiederverwenden.
- [x] Kompakte Terminaltreffer und getrennte Gesamtzahlanzeige implementieren; Live-Abnahme der neuen Gesamtzählung offen.
- [x] Konkrete Adapter-Testinkompatibilität durch minimale `.results`-Anpassung auflösen; keine zusätzliche Zählungsabsicherung.
- [ ] Offene fachliche Codeprüfung/manuelle Fälle fortführen; neue Checks nach `ed031e3` protokollieren.
- [ ] Findings in Konzept/Matrix/Zielstruktur zurückführen und Architekturabschluss bewerten; nächsten Suchweg erst gesondert auswählen.
- [ ] Als letzter Arbeitspunkt nach Architekturumbau und manuellen Durchstichen: Audit der bestehenden Tests durchführen und priorisierten Anpassungsbedarf dokumentieren; konkrete Teständerungen anschließend separat vereinbaren.

Abgehakte Umbauten sind Umsetzungsstatus, keine automatische fachliche Abnahme. Der letzte Auditpunkt wird jetzt nur eingeplant.

## Abnahmekriterien

| ID | Beobachtbares Kriterium | Prüfung |
| --- | --- | --- |
| AC1 | Produktionsdateien entsprechen Zielstruktur; keine abgelösten Koordinationsschichten/alten Produktionsimporte. Testinkompatibilitäten und entfernte Tests als Lücken erfasst. | Codeprüfung, Typecheck |
| AC2 | Passende Wege gegen denselben Stand bewerten. Kein bestätigtes Kriterium entfällt, Umfang nicht verengt, keine mehrfachen Fachregeln. | Codeprüfung, manuelle Fälle |
| AC3 | Titel allein über Multi, keine Frage nach optionalem Typ/Jahr. | Terminal, Wegwahl im Code |
| AC4 | Expliziter Film/Serie nutzt Movie/TV; Jahr über `primary_release_year`/`first_air_date_year`. | Terminal, Parameterabbildung |
| AC5 | Titel/Jahr ohne Typ liefert gebundene Frage, keinen Trefferaufruf; gewählte Strategie. | Terminal, Übergang im Code |
| AC6 | Angebotene Auswahl ohne LLM; Freitext erhält ursprünglichen Wunsch/Fragekontext. Titel/Jahr erhalten oder ausdrücklich korrigiert. | Terminal, Codeprüfung |
| AC7 | Clarify sucht nicht; ausdrückliches Execute verwendet bestätigten gebundenen Stand ohne erneute LLM-Interpretation. | Terminal, Codeprüfung |
| AC8 | Alte Antworten überschreiben keinen neuen Stand; wiederholte/parallele Starts reservierter Revision ohne zweiten Trefferaufruf. | Codeprüfung, reproduzierte Fälle; ungeprüfte Rennen offen |
| AC9 | Anwendungstexte zentral, Gründe/Formulierung getrennt, keine i18n-Infrastruktur auf Vorrat. | Codeprüfung |
| AC10 | Terminal zeigt Kriterien, Fragen, kompakte Treffer und getrennte Seiten-/Gesamtzahl. Zählung unbekannt → nicht verfügbar, leere Seite ≠ automatisch null insgesamt. Fehler/leer/Treffer unterscheidbar; keine Altresultate als neu. | Terminal, Adapterprüfung |
| AC11 | Typecheck/Lint protokolliert; manuelle Fälle/offene Punkte einzeln ausgewiesen. Allgemeiner Testausbau bis abschließendem Audit zurückgestellt. | Prüfprotokoll |

AC10 um die ausdrücklich beauftragte Gesamtzahlanzeige erweitert; daraus keine rückwirkende Abnahme ableiten.

## Manuelle Fälle und tatsächliche Beobachtungen

Je Fall Ausgangskriterien, Eingabe/Aktion, Kriterien/Frage, belegte Wegwahl und Suchstart erfassen. Keine feste Live-Trefferzahl voraussetzen, keine Zugangsdaten committen. Providerparameter nicht allein aus Terminalausgabe ableiten.

Nutzer-Mitschnitt am 22. November um 08:39 CET, Aufruf `node scripts/search.mjs http://localhost:3000`. Exakter lokaler Commit nicht genannt; vor `e06cb2c`, daher kein Nachweis der integrierten Gesamtzählung. Zahlen sind beobachtete Antwortgrößen, keine dauerhaften Erwartungen.

| Fall | Beobachtung | Restprüfung |
| --- | --- | --- |
| 1: Reset, nur Titel | Reset → all. Inception → Inception/all, direkte Suche ohne Rückfrage, 13 Treffer. | Wegwahl ergänzend im Code; Regression nach Zählungsänderung offen. |
| 2: Film/Serie | Inception/movie → 12 Filme; Dark/tv → 20 Serien. | Provideraufrufe nicht allein aus Anzeige bewiesen. |
| 3: Einzeljahr | Exakte Eingabe `suche den Film Inceptionvon 2010` → Inception/movie/2010, drei Treffer. Dark mit Erstausstrahlung 2017 → Dark/tv/2017, 17 Treffer, angezeigte Datumswerte 2017. | Jahresparameter im Code/Diagnose separat belegen. |
| 4: Strukturierte Auswahl | Nicht erreicht: Dune/2021 erzeugte freie LLM-Frage statt nummerierter Optionen. | Angebotene Medienauswahl, `/select NUMMER` und Execute weiterhin offen. |
| 5: Freie Antwort/Korrektur | Zweimal Dune/2021 ohne Typ: Kriterien zunächst nur all, LLM fragt nach Film/Serie. `Film` bzw. `Ich meine den Film` → Dune/movie/2021 und ready, keine automatische Suche. | Explizite Jahreskorrektur und Execute nicht dokumentiert; Bindungs-IDs nicht sichtbar. |
| 6: Neuer Auftrag/Reset | Reset nach ready sichtbar, nicht während offener Frage. | `/submit TEXT`/Reset während offener Frage und gezieltes Wiederabsenden alter Bindung; verzögerte Antworten nur bei Reproduktion abhaken. |
| 7: Ausführung/Wiederholung | Kein `/execute` im Mitschnitt. | Execute nach Klärung/Erfolg, kontrollierter Fehler mit ausdrücklichem neuen Versuch, Parallelstarts gesondert. Lokale CLI-Ablehnung ist kein Beweis serverseitiger Reservierung. |
| 8: Darstellung | Trefferlisten Film/Serie, Datum/ID, fehlendes Datum als `—`, Antwortzahl sichtbar. | Leerliste, technischer Fehler, Altresultate und integrierte Gesamtzahl samt Ausfallpfad offen. |

Nachweise sind Nutzerläufe, keine vom Assistenten ausgeführten Terminalfälle. Keine vollständige Task-/Race-Abnahme aus den beobachteten Erfolgsfällen.

## Separater API-Zählversuch

Nutzer-Rückmeldung am 22. November um 09:13 CET; Parameter `language=de-DE`, `include_adult=true`, `page=1`. Vier Endpunkte pro Suchtext, verglichen wurde `total_results`, nicht die erste Seitenlänge.

| Suchtext | Multi | Movie | TV | Person | Multi − Person | Movie + TV |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Inception | 13 | 12 | 1 | 0 | 13 | 13 |
| Dark | 6296 | 4991 | 511 | 794 | 5502 | 5502 |
| Dune | 1409 | 1227 | 96 | 86 | 1323 | 1323 |
| Tom Hanks | 10 | 8 | 1 | 1 | 9 | 9 |
| Batman | 248 | 185 | 24 | 39 | 209 | 209 |

In allen fünf Fällen Abweichung null. Positiver Stichprobenbefund, kein dokumentierter API-Vertrag oder Mengen-/ID-Vergleich. Die daraufhin beauftragte Implementierung zählt nur bei Multi zusätzlich Personen; keine Implementierung getrennter Movie-/TV-Listen. Kein integrierter Live-Nachweis nach `e06cb2c`/`ed031e3`.

## Prüfprotokoll

| Kriterium | Status | Beleg / Lücke |
| --- | --- | --- |
| AC1 | Teilweise geprüft | Module/Verträge konsolidiert, HTTP-Zielpfad vorhanden. Vollständiger Produktionsimportscan und aktuelle Checks nach ed031e3 offen. |
| AC2 | Nicht vollständig geprüft | Matrix implementiert; vollständige Kriterienabdeckung nicht abgenommen. |
| AC3 | Teilweise geprüft | Nutzerlauf 08:39: Inception/all direkt, keine Typ-/Jahresfrage. Vollständiger Code-/Regressionsnachweis offen. |
| AC4 | Teilweise geprüft | Film/Serie, jeweils auch mit Jahr, sichtbar korrekt übernommen/gesucht. Parameterabbildung separat prüfen. |
| AC5 | Teilweise geprüft | Dune/2021 führt zur freien LLM-Frage, keine sichtbare Suche. Strukturierter Anwendungspfad und Bindungsprüfung nicht belegt. |
| AC6 | Teilweise geprüft | Zwei freie Filmantworten rekonstruieren Dune/2021 bis ready. Strukturierte Auswahl ohne LLM, Jahreskorrektur und Bindungsprüfung offen. |
| AC7 | Teilweise geprüft | Nach freier Klärung keine automatische Suche, Execute-Hinweis sichtbar. Ausdrückliches Execute nicht durchlaufen. |
| AC8 | Nicht geprüft | Kein gezielter Altbindungs-/Wiederholungs-/Parallelitätsnachweis. |
| AC9 | Teilweise geprüft | Server-/Terminalkataloge implementiert, freie Nachrichten separat. Vollständige Textzuordnungsprüfung offen. |
| AC10 | Teilweise geprüft | Erfolgsansicht samt fehlendem Datum manuell gesehen, jedoch vor Gesamtzählung. Leere/Fehler-/Altzustände und integrierte Zählung offen. |
| AC11 | Teilweise geprüft | Letzte grüne Nutzerbestätigung nach 794788f; neue Checks offen. Manuelle Teilnachweise jetzt einzeln erfasst, nicht vollständig. |

Statuskategorien: nicht geprüft, teilweise geprüft, erfüllt, fehlgeschlagen, blockiert. Keine Vollabnahme aus Review/grünen Tests; „nicht vollständig geprüft“ beschreibt die offene AC2-Prüfung, nicht einen erfolgreichen Abschluss.

| Check | Letzter gemeldeter Stand |
| --- | --- |
| Typecheck | Nach `794788f` laut Nutzer erfolgreich, Rückmeldung 08:29 CET. Nach `e06cb2c`/`ed031e3` offen. |
| Lint | Dieselbe Rückmeldung und Grenze. |
| Vorhandene Tests | Dieselbe Rückmeldung; minimale `.results`-Anpassung ed031e3 noch nicht durch neuen Lauf bestätigt. |
| Manuelle Terminal-Abnahme | Teilnachweise 08:39 für damaligen CLI-Stand; offene Fälle siehe Tabelle. |
| Integrierte Gesamtzählung | Implementiert, noch kein manueller App-Durchstich; separater API-Zählversuch kein Ersatz. |

Keine eigenen Tool-Läufe der Projektbefehle. Keine konkreten Befehle, Testzahlen, Coverage oder Browser-/HTTP-Suite aus pauschaler Bestätigung ableiten. Uhrzeiten bezeichnen Rückmeldungen, keine gemessenen Laufzeitpunkte.

Historisch: TS2345 im HTTP-Handler mit `6861dff` korrigiert, danach Typecheck erfolgreich. Multi-Parametererwartung mit `07200b5` korrigiert, danach alle drei Checks grün gemeldet. Weitere grüne Meldung nach `9010afb` um 08:14 CET, zuletzt nach `794788f` um 08:29 CET. Nicht auf spätere Commits übertragen.

## Umsetzungschronik

| Commit | Änderung |
| --- | --- |
| `2e9a27b` | Gemeinsame Matrix. |
| `377b977`, `26312c4` | Flow zusammengeführt, HTTP/Session angebunden. |
| `235e0d2`, `63ab5df`, `932e41d` | Workflow, Submit, Coordinator entfernt. |
| `6861dff` | HTTP-Ergebnistyp für Submit/Execute ohne Cast korrigiert. |
| `25aaf44`, `7940ca3` | Zwei alte Submission-Testdateien auf Wunsch entfernt. |
| `3f87bd7`, `5cf625f` | Vorschlagsvertrag und übrige Suchverträge konsolidiert. |
| `464649b` | HTTP/Flow/Parser/Matrix/Titeladapter auf direkte Schemaimporte umgestellt. |
| `49ad728`, `3e3027e`, `51f8810`, `5244cb3` | Vier Schema-Re-Exports entfernt. |
| `07200b5` | Bestehende Titeltest-Erwartung um include_adult ergänzt. |
| `d70769e`, `9010afb` | Parserfunktion/Typen nach LLM, Flow/Testimport umgestellt, altes Parsermodul entfernt. |
| `83b393f` | Terminaltabelle, Trefferfeldvalidierung, Leermeldung, Antwortzahl. |
| `22f6cd2` | Sieben HTTP-/zwei Sessionmeldungen zentralisiert, Wortlaut/Codes/Kontrollfluss erhalten. |
| `794788f` | Lokaler Terminaltextkatalog; Befehle/HTTP/Bindung unverändert. |
| `664851a` | Vorherigen Arbeitsstand und grüne Nutzerchecks dokumentiert. |
| `e06cb2c` | Adapter liefert results/totalResults; Multi minus Personen, direkte Movie-/TV-Zahlen, null bei Zählungsfehler; Flow/HTTP/CLI durchgereicht. |
| `ed031e3` | Nur bestehende Adaptertests auf .results angepasst und veralteten Lückenkommentar entfernt; kein Testausbau, keine Logikänderung. |

Ursprüngliche Commits für HTTP-Zielpfad/Klärungstexte mangels ermitteltem Commitbeleg nicht nachgetragen. LLM-Umbau erhält Prompt/JSON-Kontext, Generator-Injektion, JSON-/Schema-Prüfung, Konfigurations-/Leerantwortfehler, `maxOutputTokens: 256`, `maxRetries: 0`. Kriterienübernahme/Ausführung im Flow, Vorschlagsvertrag im Schema.

## Textzuordnung, Klärung und Gesamtzahl

`texts.ts` enthält Klärungs-/HTTP-/Sessionformulierungen. Flow/Matrix entscheiden fachlich; freie LLM-Nachrichten bleiben separat. Strukturierte Medienfrage enthält Optionen statt Anzeigetext; CLI beschriftet sie lokal. Aus freier Modellprosa keine Auswahloptionen ableiten. Im Nutzerlauf stellte das LLM die Medienfrage vor Kriterienübernahme, daher kam der Anwendungsauswahlpfad nicht zum Zug. Kein Auftrag, diesen Pfad jetzt durch Prompt-/Vertragsumbau zu erzwingen. Eine Auswahl konkreter Treffer ist nicht implementiert; das diesbezügliche Missverständnis wurde geklärt, keine Änderung der Suchstrategie beauftragt.

`terminalTexts` bündelt Hilfen, Prompts, Fehler, Hinweise, Medienlabels, Tabellenüberschriften und Ausgabevorlagen. Keine Serverimporte, zusätzliche Katalogdatei oder i18n-Infrastruktur. Freie Server-/LLM-Nachrichten unverändert. AC9-Vollprüfung offen.

Gesamtzählung im Titeladapter: Primärantwort/Karten wie bisher validieren; Metadaten separat prüfen. Multi → eine zusätzliche Personenabfrage mit identischem query/adult und gleichen Standardwerten; Differenz nur bei plausiblen Werten, mindestens Anzahl sichtbarer Karten, Personenzahl mindestens Personen auf erster Multi-Seite. Fehler/fehlende Metadaten/unplausible Werte → null, gültige Karten erhalten. Movie/TV ohne Personenaufruf. Kein falscher Rückfall auf ungefilterte Multi-Zahl. Erste Seite bleibt erste Providerseite, keine Auffüllung/Seitennavigation/Neusortierung.

HTTP completed enthält `totalResults: number | null`. CLI zeigt Gesamtzahl oder Nichtverfügbarkeit sowie getrennt angezeigte Titel; leere erste Seite nicht mit null insgesamt verwechseln. Gesamtzahl null ist keine erfolgreiche Zählung. Keine zusätzliche automatisierte Absicherung dieser Logik durch ed031e3; API-Stichprobe bleibt begrenzter empirischer Nachweis.

## Importprüfung und offene Absicherung

Produktionsprüfung bisher gezielt, kein vollständiger Scan. Auf Stand `5244cb3` alle 20 TypeScript-Testdateien gelesen (14 Unit, zwei HTTP, ein Mock, drei Fixtures): keine direkten/relativen/Mock-/dynamischen Verweise auf vier entfernte Suchschemas. Kein Testlauf. Bekannter Parser-Testimport danach ausdrücklich auf llm umgestellt.

| Entfernte Datei | Historischer Grund / Status | Offene Ersatzabsicherung |
| --- | --- | --- |
| `tests/unit/services/search-submission.spec.ts` | Alter Coordinatorimport; auf Wunsch mit 25aaf44 entfernt. | Kriterienkopie, Jahr entfernen, unabhängige Kriterien im neuen Flow. |
| `tests/integration/tmdb/search-submission.spec.ts` | Alter Submitimport/veraltete Erwartungen; mit 7940ca3 entfernt. | Direktsuche, Klärung ohne Trefferaufruf, vollständige Kriterienabdeckung. |

Historisch erwartete der entfernte Integrationstest kein include_adult und lehnte explizite Film-/Serie-Jahr-Suche fälschlich ab. Kennungen `SEARCH-SUBMIT-INT-001` bis `SEARCH-SUBMIT-INT-005` bleiben ausgemustert. Keine Kompatibilitätsmodule, Testausschlüsse oder Prüfkonfigurationsänderungen. Parser-Vertragstest nur im Import geändert. Die neue Adapter-Rückgabeinkompatibilität ist mit ed031e3 im Testcode behoben, nicht mit einem erfolgreichen Lauf bestätigt. Gesamtzählung und neue Flow-/Race-Fälle weiter ohne zusätzliche automatisierte Absicherung.

## Findings und Architekturabschluss

Zielpfad, Kataloge, Terminaldarstellung und Gesamtzählung implementiert. Nächster Architekturschritt: vollständige Produktionsimport-/Strukturprüfung und fachliche Textzuordnung abschließen; konkrete Findings vor weiterem Ausbau beheben. Dann offene manuelle Fälle und Checks fortführen, Findings in gemeinsame Regeln zurückführen. Keine Vollabnahme, Produktionsfreigabe oder neuer Suchweg aus diesem Dokumentationsstand. Der abschließende Testaudit bleibt der letzte Arbeitspunkt.

## Letzter Arbeitspunkt: Audit der bestehenden Tests

- [ ] Erst nach Architekturumbau und manuellen Durchstichen den bestehenden Testbestand auditieren.

Auf fachliche Aktualität, passende Grenzen von Matrix/Flow/LLM/Provider/HTTP, Doppelungen und fehlende Zusicherungen prüfen. Offene Kriterienübernahme-/Jahrentfernungs-, Klärungs-, Execute-, Altbindungs-/Reservierungs-/Parallelitäts- und Zählungslücken einbeziehen. Ergebnis: Bestandsbewertung und priorisierte konkrete Anpassungsvorschläge mit Begründung. Keine automatische Gleichsetzung grün = ausreichend abgesichert. Jetzt nur eingeplant; konkrete Teständerungen anschließend gesondert vereinbaren, keine pauschale Freigabe zur Migration, Erweiterung oder Löschung.
