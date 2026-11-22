# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: in Umsetzung, noch nicht fachlich abgenommen. Stand: 22. November 2026. Codebezug: `9010afb`, Branch: `feat/shared-search-architecture`.

Grundlagen: [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Keine zweite vollständige Regelmatrix in diesem Task.

## Ziel und Umfang

Bestehende Suche gemäß Zielstruktur ordnen und vorhandene Titelwege über die gemeinsame Hindernismatrix bewerten. Titel ist Abnahmefall der gemeinsamen Architektur, kein eigener Parser. Erst danach nächsten konkreten Anwendungsfall wählen; Keyword ist möglich, nicht bereits beauftragt.

Umfang: gemeinsamer Coordinator, Hindernisbewertung, zusammengehörige externe Verträge, zentrale Anwendungstexte und minimal nötige Terminaldarstellung. Sessionbindung, JSON-Interpretation und Provideradapter erhalten. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Datenbank, generische Regel-Engine, vollständige Internationalisierung, Web-UI oder neuer Modellvergleich.

## Prüfvereinbarung und ausdrücklich freigegebene Ausnahmen

Automatischer Testausbau bleibt zurückgestellt: keine neuen, erweiterten, duplizierten oder vorsorglich refaktorierten Tests. Keine pauschale Löschung, keine geänderten Ausschlüsse oder Coverage-/Checkkonfiguration zum Verbergen von Fehlern. Kriterien zunächst per Codeprüfung und dokumentierten Terminalfällen abnehmen; Typecheck/Lint sind technische Checks, kein fachlicher Nachweis.

Einzelentscheidungen vom 22. November, keine allgemeine Freigabe für weitere Testarbeiten:

- Zwei veraltete Submission-Testdateien auf ausdrücklichen Nutzerwunsch entfernt; Ersatzabsicherung weiter offen.
- In `title-search.spec.ts` ausschließlich `include_adult: 'true'` zur exakten Multi-Aufruferwartung ergänzt, nach gezeigtem Testfehler und Freigabe.
- In `search-parser.spec.ts` ausschließlich den Import von `search/parser` auf `search/llm` umgestellt, im Zuge der ausdrücklich beauftragten Zusammenführung. Erwartungen und Testumfang erhalten.
- Vorhandene Tests auf Nutzerauftrag ausgeführt; Ergebnisse als Nutzerbericht erfasst. Dies hebt die Zurückstellung neuer automatisierter Absicherung nicht auf.

## Umsetzungsschritte

- [ ] Vollständige Struktur-/Aufruferprüfung abschließen; bisher gezielte Dateiprüfungen, kein vollständiger repositoryweiter Produktionsimportscan.
- [x] Koordination in `flow.ts` zusammenführen, HTTP und Session anbinden; `workflow.ts`, `coordinator.ts`, `submit.ts` entfernen.
- [ ] Matrix vollständig abnehmen: `matrix.ts` implementiert und angebunden, Kriterienabdeckung und Verhalten noch manuell zu prüfen.
- [x] Kriterien-, Vorschlags-, Frage-, Aktions- und Antwortverträge in `src/lib/schemas/search.ts` konsolidieren; fünf geprüfte Produktionsdateien auf direkte Importe umstellen; vier alte Schema-Re-Exports entfernen.
- [ ] HTTP-Einstieg von `server/api/search.post.ts` nach `server/api/search/index.post.ts` verschieben; URL beibehalten.
- [x] Gemeinsame Interpretation/Validierung in `llm.ts` zusammenführen; Flow und freigegebenen Testimport umstellen, `parser.ts` entfernen.
- [ ] Anwendungseigene Fragen/Hinweise in `texts.ts` bündeln; freie Modellnachrichten unterscheiden.
- [x] Vorhandenen TMDb-Titeladapter ohne zusätzlichen Titel-Wrapper wiederverwenden.
- [ ] Terminal bedarfsgerecht um kompakte Trefferdarstellung ergänzen.
- [ ] Fachliche Codeprüfung und manuelle Fälle durchführen; nach weiteren Änderungen technische Checks erneut protokollieren.
- [ ] Findings in Konzept/Matrix/Zielstruktur zurückführen und nächsten Suchweg gesondert auswählen.

Abgehakte Umbauten sind Umsetzungsstatus, keine automatische fachliche Abnahme.

## Abnahmekriterien

| ID | Beobachtbares Kriterium | Prüfung |
| --- | --- | --- |
| AC1 | Produktionsdateien entsprechen der Zielstruktur; keine abgelösten Koordinationsschichten oder alten Produktionsimporte. Verbliebene Testinkompatibilitäten/entfernte Tests sind als Lücken erfasst. | Codeprüfung, Typecheck |
| AC2 | Passende Wege werden gegen denselben Kriterienstand bewertet. Kein bestätigtes Kriterium entfällt, der Suchumfang wird nicht verengt; keine mehrfachen Fachregeln. | Codeprüfung, manuelle Fälle |
| AC3 | Titel allein führt über Multi zur Suche, ohne Frage nach optionalem Typ/Jahr. | Terminal, Wegwahl im Code |
| AC4 | Expliziter Film/Serie nutzt Movie/TV; Einzeljahr wird über `primary_release_year`/`first_air_date_year` berücksichtigt. | Terminal, Parameterabbildung |
| AC5 | Titel/Jahr ohne Typ liefert eine gebundene Frage, keinen Trefferaufruf; gewählte Produktstrategie. | Terminal, Übergang im Code |
| AC6 | Angebotene Auswahl ohne LLM; Freitext erhält ursprünglichen Wunsch und Fragekontext. Titel/Jahr bleiben erhalten oder werden ausdrücklich korrigiert. | Terminal, Codeprüfung |
| AC7 | Clarify sucht nicht. Erst ausdrückliches Execute verwendet den bestätigten gebundenen Stand ohne erneute LLM-Interpretation. | Terminal, Codeprüfung |
| AC8 | Alte Antworten überschreiben keinen neuen Stand; wiederholte/parallele Starts einer reservierten Revision erzeugen keinen zweiten Trefferaufruf. | Codeprüfung, reproduzierte Fälle; ungeprüfte Rennen offen |
| AC9 | Anwendungstexte zentral, fachliche Gründe und Formulierung getrennt; keine i18n-Infrastruktur auf Vorrat. | Codeprüfung |
| AC10 | Terminal zeigt Kriterien, Fragen und kompakte Treffer. Fehler/leer/Treffer unterscheidbar; keine alten Ergebnisse als neue ausgeben. | Terminal |
| AC11 | Typecheck/Lint ausgeführt und protokolliert; manuelle Fälle und offene Punkte einzeln ausgewiesen. Automatischer Testausbau zurückgestellt. | Prüfprotokoll |

## Manuelle Fälle

Je Fall Ausgangskriterien, Eingabe/Aktion, beobachtete Kriterien/Frage, belegte Wegwahl und Suchstart protokollieren. Keine feste Live-Trefferzahl voraussetzen oder Zugangsdaten/sensible Verläufe committen. Providerparameter nicht allein aus Terminalausgabe ableiten, sondern Code oder sichere lokale Diagnose heranziehen.

1. Nach Reset nur Titel.
2. Titel ausdrücklich als Film, separat als Serie.
3. Film mit Jahr, Serie mit Erstausstrahlungsjahr.
4. Titel/Jahr ohne Typ, angebotene Auswahl, Suche erst durch Execute.
5. Gebundene freie Film-/Serienantwort und separat Jahreskorrektur.
6. Neuer `/submit TEXT` sowie Reset während offener Frage; alte Bindung ungültig. Verzögerte Antwort nur als geprüft markieren, wenn reproduziert.
7. Execute nach Erfolg wiederholen; technischer Fehler mit ausdrücklicher Wiederholung soweit kontrolliert möglich. Parallelstarts separat ausweisen.
8. Kompakte Trefferansicht sowie leere Liste und Fehler soweit reproduzierbar.

Alle acht Fälle für den aktuellen Umbau noch nicht dokumentiert durchgeführt. Nicht reproduzierte Fälle bleiben offen.

## Prüfprotokoll

| Kriterium | Status | Beleg / Lücke |
| --- | --- | --- |
| AC1 | Teilweise geprüft | Flow/LLM/Verträge konsolidiert, alte Module entfernt, technische Checks nach `9010afb` laut Nutzer grün. HTTP-Zielpfad und Texte noch offen; kein vollständiger Produktionsimportscan. |
| AC2 | Nicht geprüft | Matrix implementiert, vollständige fachliche Abnahme offen. |
| AC3 | Nicht geprüft | Kein aktueller Terminalbeleg. |
| AC4 | Nicht geprüft | Kein aktueller Terminalbeleg. |
| AC5 | Nicht geprüft | Kein aktueller Terminalbeleg. |
| AC6 | Nicht geprüft | Kein aktueller Terminalbeleg nach Zusammenführung. |
| AC7 | Nicht geprüft | Kein aktueller Terminalbeleg für Clarify/Execute. |
| AC8 | Nicht geprüft | Keine reproduzierte Parallelitäts-/Race-Prüfung. |
| AC9 | Nicht geprüft | Zentrale Texte noch umzusetzen. |
| AC10 | Nicht geprüft | Kompakte Ausgabe und Durchstich offen. |
| AC11 | Teilweise geprüft | Typecheck/Lint/Tests nach `9010afb` laut Nutzer erfolgreich; manuelle Abnahmen fehlen. |

Status: nicht geprüft, teilweise geprüft, erfüllt, fehlgeschlagen, blockiert. Keine Vollabnahme aus Review oder grünem Testlauf ableiten.

| Check | Letzter gemeldeter Stand |
| --- | --- |
| Typecheck | Nach Parser-/LLM-Zusammenführung und Löschung `9010afb` am 22. November um 08:14 CET laut Nutzer erfolgreich. |
| Lint | Nach `9010afb` laut derselben Rückmeldung erfolgreich. |
| Vorhandene Tests | Nach `9010afb` laut derselben Rückmeldung erfolgreich; kein Nachweis einer neuen Flow-/Parallelitätsabsicherung. |
| Manuelle Terminal-Abnahme | Für aktuellen Umbau nicht dokumentiert. |

Keine eigenen Tool-Läufe der Projektbefehle. Keine Testzahlen, Coverage oder Browser-/HTTP-Suite-Ausführung aus der pauschalen Nutzerbestätigung ableiten. Frühere Meldungen: TS2345 im HTTP-Handler, mit `6861dff` korrigiert; nachfolgend Typecheck erfolgreich. Veraltete Multi-Parametererwartung durch Nutzerlauf bestätigt, mit `07200b5` korrigiert. Nutzer meldete danach bereits alle drei Checks grün; jüngste Bestätigung gilt dem neuen Stand `9010afb`.

## Umsetzungschronik

| Commit | Änderung |
| --- | --- |
| `2e9a27b` | Gemeinsame Matrix eingeführt. |
| `377b977`, `26312c4` | Flow zusammengeführt, HTTP und Session angebunden. |
| `235e0d2`, `63ab5df`, `932e41d` | Workflow, Submit und Coordinator entfernt. |
| `6861dff` | HTTP-Ergebnistyp für Submit und Execute korrigiert, ohne Cast. |
| `25aaf44`, `7940ca3` | Zwei alte Submission-Testdateien auf Wunsch entfernt. |
| `3f87bd7`, `5cf625f` | Vorschlagsvertrag und übrige externe Suchverträge konsolidiert. |
| `464649b` | HTTP, Flow, Parser, Matrix und Titeladapter auf direkte Schemaimporte umgestellt. |
| `49ad728`, `3e3027e`, `51f8810`, `5244cb3` | Vier vorübergehende Schema-Re-Export-Dateien entfernt. |
| `07200b5` | Bestehende Titeltest-Erwartung um `include_adult: 'true'` ergänzt. |
| `d70769e`, `9010afb` | Parserfunktion/Typen nach LLM übernommen, Flow/Testimport angepasst, altes Parsermodul entfernt. |

Der LLM-Umbau erhält Prompt und JSON-Kontext, Generator-Injektion, `JSON.parse`/Schema-Prüfung, Konfigurations-/Leerantwortfehler, `maxOutputTokens: 256` und `maxRetries: 0`. Kriterienübernahme und Ausführung bleiben im Flow, externer Vorschlagsvertrag im Schema.

## Importprüfung und offene Absicherung

Produktionsprüfung bisher gezielt, kein vollständiger repositoryweiter Scan. Im Testbaum wurden auf Stand `5244cb3` alle 20 TypeScript-Dateien gelesen (14 Unit-Dateien, zwei HTTP-Dateien, ein Mock, drei Fixtures): keine direkten, relativen oder Mock-/dynamischen Importverweise auf die vier entfernten Suchschemadateien. Diese Aussage ist kein Testlauf. Nachfolgend bekannter Parserimport im bestehenden Test ausdrücklich auf `llm.ts` umgestellt.

| Entfernte Datei | Historischer Grund / Status | Offene Ersatzabsicherung |
| --- | --- | --- |
| `tests/unit/services/search-submission.spec.ts` | Alter Coordinatorimport; auf Wunsch mit `25aaf44` entfernt. | Kriterienkopie, Jahr entfernen und unabhängige Kriterien erhalten am neuen Flow absichern. |
| `tests/integration/tmdb/search-submission.spec.ts` | Alter Submitimport, veraltete Erwartungen; mit `7940ca3` entfernt. | Direktsuche, Klärung ohne Trefferaufruf und vollständige Kriterienabdeckung am neuen Flow absichern. |

Historisch erwartete der entfernte Integrationstest beim Multi-Aufruf kein `include_adult` und lehnte explizite Filmsuche sowie Serie/Jahr fälschlich ab. Seine Kennungen `SEARCH-SUBMIT-INT-001` bis `SEARCH-SUBMIT-INT-005` bleiben ausgemustert. Keine Kompatibilitätsmodule zur Rettung alter Tests, keine Testausschlüsse oder Konfigurationsänderungen. Die erhaltenen Parser-Vertragstests wurden nur im Import angepasst, keine zusätzlichen dedizierten LLM-Tests angelegt.

## Findings und Abschluss

Offen: HTTP-Zielpfad, zentrale Texte, kompakte Terminaldarstellung, fachliche Durchstiche und vollständiger Produktionsimportnachweis. Grüne Checks schließen weder die Ersatzabsicherungslücken noch Parallelitätsrisiken. Findings mit Grund in gemeinsame Regeln zurückführen. Task 02 erst nach Wahl des nächsten Anwendungsfalls anlegen. Keine Produktionsfreigabe oder vollständige Abnahme durch diesen Dokumentationsstand.
