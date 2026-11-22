# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: in Umsetzung, noch nicht abgenommen. Stand: 22. November 2026. Branch: `feat/shared-search-architecture`.

Grundlagen: [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Regeln nicht als zweite vollständige Matrix in diesem Task pflegen.

## Ziel

Bestehende Suche gemäß Zielstruktur ordnen und die vereinbarten Titelwege über die gemeinsame Hindernismatrix bewerten. Titel ist vorhandener Abnahmefall der gemeinsamen Architektur, kein eigener Parser. Erst nach dem Durchstich wird der nächste konkrete Anwendungsfall gewählt; das kann beispielsweise ein Keyword sein.

## Umfang und Grenzen

Gemeinsamer Coordinator, Hindernisbewertung, Grenzverträge, zentrale Anwendungstexte und minimal nötige Terminaldarstellung. Bestehende Sessionbindung, JSON-Interpretation und Provideradapter erhalten. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Datenbank, generische Regel-Engine, vollständige Internationalisierung oder Web-UI. Kein erneuter Prompt-/Modellvergleich.

Automatisierte Tests sind für diese explorative Phase ausdrücklich zurückgestellt: weder neu anlegen noch erweitern, duplizieren oder im Zuge des Umbaus refaktorieren. Bestehende Tests nicht pauschal löschen. Durch Umbenennungen oder Verträge ungültige Tests als bekannte Lücke protokollieren; keine Ausschlüsse, Konfigurationsänderungen oder Kompatibilitätsschichten allein zum Verbergen solcher Fehler. Automatisierte Testläufe sind hier kein verpflichtender Abnahmeschritt; nicht ausgeführte Tests nicht als grün melden. Typecheck und Lint bleiben vorgesehen.

Ausdrückliche Einzelentscheidung vom 22. November 2026: Die beiden unten genannten veralteten Suchtests wurden auf Nutzerwunsch entfernt. Dies ist keine pauschale Freigabe zum Löschen weiterer Tests. Die fehlende Ersatzabsicherung bleibt dokumentiert und zurückgestellt.

## Umsetzungsschritte

- [ ] Aktuellen Code und Aufrufer gegen die Zielstruktur prüfen; benötigte Funktionen zuordnen.
- [x] `flow.ts` mit benötigter Koordination aus `workflow.ts`, `coordinator.ts` und `submit.ts` herstellen; diese drei alten Module entfernen. Keine vollständige fachliche Abnahme hierdurch.
- [ ] `matrix.ts` für gemeinsame Hindernisbewertung herstellen. Jeder passende Weg erhält denselben Kriterienstand; vollständigen Suchumfang und Kriterienabdeckung prüfen.
- [ ] HTTP-Einstieg nach `server/api/search/index.post.ts` verschieben, zusammengehörige externe Suchverträge konsolidieren; Produktionsimporte nachziehen.
- [ ] Gemeinsame LLM-Interpretation/Validierung sinnvoll ordnen, keinen Parser je Suchweg und keinen neuen Vertrag auf Vorrat einführen.
- [ ] Anwendungseigene Fragen/Hinweise zentral gemäß Textkatalog verwalten; freie Modellnachrichten davon unterscheiden.
- [ ] Vorhandene TMDb-Adapter wiederverwenden; keine zusätzliche `title.ts` als reine Weiterleitung.
- [ ] Terminal nur soweit nötig für Kriterien, gebundene Fragen, Execute und kompakte Treffer ergänzen.
- [ ] Codeprüfung, manuelle Fälle, Typecheck und Lint durchführen und protokollieren. Testlücken einschließlich ausdrücklich beauftragter Löschungen dokumentieren; keine vorsorgliche Ersatztestsuite.
- [ ] Findings in Konzept/Matrix/Zielstruktur zurückführen; nächsten Suchweg gesondert auswählen.

## Abnahmekriterien

| ID | Beobachtbares Kriterium | Vorgesehene Prüfung |
| --- | --- | --- |
| AC1 | Betroffene Produktionsdateien entsprechen der Zielstruktur; keine abgelösten Koordinationsschichten oder alten Produktionsimporte bleiben parallel bestehen. Verbliebene Testinkompatibilitäten oder ausdrücklich entfernte Tests sind als Absicherungslücken erfasst. | Codeprüfung, Typecheck |
| AC2 | Registrierte passende Wege werden gegen denselben Kriterienstand bewertet. Kein bestätigtes Kriterium wird weggelassen, der gemeinte Suchumfang nicht verengt; Regeln sind nicht mehrfach implementiert. | Codeprüfung, manuelle Fälle |
| AC3 | Titel allein führt über Multi zur Suche, ohne Frage nach optionalem Medientyp/Jahr. | Terminal, gezielte Codeprüfung der Wegwahl |
| AC4 | Expliziter Film/Serie verwendet Movie/TV; Einzeljahr wird als `primary_release_year`/`first_air_date_year` berücksichtigt. | Terminal, Parameterabbildung im Code |
| AC5 | Titel plus Jahr ohne Medientyp liefert eine gebundene Frage und keinen Trefferaufruf; dies bleibt die vereinbarte Produktstrategie. | Terminal, Codeprüfung des Übergangs |
| AC6 | Angebotene Auswahl wird ohne LLM geprüft. Gebundener Freitext erhält ursprünglichen Wunsch und Fragekontext; Titel/Jahr bleiben erhalten oder werden ausdrücklich korrigiert. | Terminal, Codeprüfung |
| AC7 | Clarify führt keine Treffersuche aus. Erst ausdrückliches Execute verwendet den bestätigten gebundenen Stand ohne erneute LLM-Interpretation. | Terminal, Codeprüfung |
| AC8 | Veraltete Antworten überschreiben keinen neueren Stand. Wiederholte/parallele Starts derselben reservierten Revision erzeugen keinen zweiten Trefferaufruf. | Codeprüfung und soweit möglich manuelle Prüfung; nicht reproduzierte Rennen ausdrücklich ungeprüft |
| AC9 | Anwendungseigene Texte liegen zentral; fachliche Gründe und Formulierung bleiben getrennt. Keine neue i18n-Infrastruktur auf Vorrat. | Codeprüfung |
| AC10 | Terminal zeigt Kriterien, nötige Fragen und kompakte Treffer. Fehler, leerer Erfolg und Treffer sind unterscheidbar; alter Ergebnisstand wird nicht als neuer ausgegeben. | Manueller Durchstich |
| AC11 | Typecheck und Lint wurden ausgeführt, Ergebnisse protokolliert. Manuelle Fälle und nicht geprüfte Punkte sind einzeln dokumentiert; automatisierte Tests bleiben zurückgestellt. | Prüfprotokoll |

## Manuelle Fälle

Jeweils Ausgangskriterien, Eingabe/Aktion, beobachtete Kriterien/Frage, gewählten Weg soweit belegt und Suchstart dokumentieren. Keine feste Live-Trefferzahl voraussetzen, keine realen sensiblen Verläufe oder Zugangsdaten committen. Terminalausgabe allein beweist keinen ausgehenden Parameter; dafür Codeprüfung beziehungsweise sichere lokale Diagnose verwenden.

1. Nach Reset: nur Titel.
2. Nach Reset: Titel ausdrücklich als Film, dann separat als Serie.
3. Film mit Jahr und Serie mit Erstausstrahlungsjahr.
4. Titel/Jahr ohne Typ, danach angebotene Auswahl; Suche erst durch Execute.
5. Dasselbe mit freier Film-/Serienantwort; separat Antwort mit Jahreskorrektur.
6. Während offener Frage ausdrücklich neuer `/submit TEXT` und separat Reset; alte Bindung darf nicht mehr gelten. Verzögerte Antwort nur als geprüft markieren, wenn tatsächlich reproduziert.
7. Execute erneut nach Erfolg; technischer Fehler und ausdrückliche Wiederholung soweit kontrolliert möglich. Parallele Starts separat als geprüft/ungeprüft ausweisen.
8. Kompakte Trefferansicht sowie leere Liste und Fehler soweit reproduzierbar. Nicht reproduzierte Fälle bleiben offen.

## Prüfprotokoll

Beleg je Kriterium, nicht pauschal aus einem erfolgreichen Durchlauf ableiten.

| Kriterium | Status | Tatsächliche Prüfung / Beleg / Lücke |
| --- | --- | --- |
| AC1 | Teilweise geprüft | HTTP-Handler und Session-Typimport bei `26312c4` auf `flow.ts` geprüft; drei alte Module danach entfernt. Zwei veraltete Tests auf ausdrücklichen Wunsch entfernt, Absicherungslücken unten erfasst. Typecheck nach `6861dff` laut Nutzer erfolgreich, vor Testlöschungen. Kein vollständiger repositoryweiter Importscan; übrige Zielstruktur noch offen. |
| AC2 | Nicht geprüft | Matrix implementiert, noch keine vollständige Abnahme. |
| AC3 | Nicht geprüft | — |
| AC4 | Nicht geprüft | — |
| AC5 | Nicht geprüft | — |
| AC6 | Nicht geprüft | — |
| AC7 | Nicht geprüft | — |
| AC8 | Nicht geprüft | Keine reproduzierte Parallelitäts-/Race-Prüfung. |
| AC9 | Nicht geprüft | — |
| AC10 | Nicht geprüft | — |
| AC11 | Teilweise geprüft | Nutzer meldet Typecheck nach `6861dff` erfolgreich. Kein erneuter Lauf nach Testlöschungen dokumentiert; Lint und manuelle Durchstiche weiterhin offen. |

Erlaubte Status: nicht geprüft, teilweise geprüft, erfüllt, fehlgeschlagen, blockiert. Ein Code-Review ist kein vollständiger Parallelitätsnachweis. Ungeprüfte Teile eines Kriteriums bleiben sichtbar, keine pauschale Vollabnahme.

| Check | Ergebnis |
| --- | --- |
| Typecheck | Zunächst laut Nutzerlauf mit TS2345 im HTTP-Handler fehlgeschlagen. Nach Korrektur `6861dff` am 22. November laut Nutzer erfolgreich; vor `25aaf44`/`7940ca3`. Kein neuer Lauf nach Testlöschungen dokumentiert, kein eigener Tool-Lauf. |
| Lint | Nicht ausgeführt beziehungsweise kein Ergebnis gemeldet. |
| Automatisierte Tests | Bewusst zurückgestellt; zwei veraltete Dateien auf Nutzerwunsch entfernt, Ersatzabsicherung offen. Kein aktueller Erfolgsnachweis. |

## Umsetzung und bekannte Testlücken – 22. November 2026

- `2e9a27b`: gemeinsame `matrix.ts` eingeführt.
- `377b977`: Koordination in `flow.ts` zusammengeführt.
- `26312c4`: HTTP-Handler und Session-Typimport auf `flow.ts` umgestellt. Handler liegt weiterhin in `server/api/search.post.ts`; Verschiebung und Vertragskonsolidierung stehen aus.
- `235e0d2`: `workflow.ts` entfernt.
- `63ab5df`: `submit.ts` entfernt.
- `932e41d`: `coordinator.ts` entfernt.
- `6861dff`: Parametertyp von `executionResponse` auf die Rückgabetypen von Execute und Submit erweitert, ohne Cast oder Änderung der Runtime-Validierung. Nutzer meldet anschließenden Typecheck erfolgreich.
- `25aaf44`: veralteten Unit-Test `tests/unit/services/search-submission.spec.ts` auf ausdrücklichen Nutzerwunsch entfernt.
- `7940ca3`: veralteten Integrationstest `tests/integration/tmdb/search-submission.spec.ts` auf ausdrücklichen Nutzerwunsch entfernt.

Die Importprüfung war eine gezielte Dateiprüfung des Suchablaufs und der zugehörigen Tests auf Stand `26312c4`, kein vollständiger repositoryweiter Scan. HTTP-Handler und Session-Speicher verwendeten dort bereits `flow.ts`; der Terminal-Client nutzt HTTP ohne Serverimporte. Interne Verweise der drei alten Module entfallen mit deren Löschung. Die zwei dabei gefundenen direkten Testimporte entfallen nun mit den ausdrücklich entfernten Testdateien. Weitere Aufrufer sind damit nicht repositoryweit ausgeschlossen.

| Entfernte Datei | Grund und Status | Zurückgestellte Absicherung |
| --- | --- | --- |
| `tests/unit/services/search-submission.spec.ts` | Importierte `submitSearch` aus dem entfernten `coordinator`; auf ausdrücklichen Nutzerwunsch mit `25aaf44` entfernt, nicht migriert. Kein verbleibender Importfehler aus dieser Datei. | Kriterienübernahme auf Kopie sowie Jahrentfernung mit Erhalt unabhängiger Kriterien später am neuen Flow absichern. Keine Ersatztests angelegt; die Lücke ist nicht durch die Löschung geschlossen. |
| `tests/integration/tmdb/search-submission.spec.ts` | Importierte `submitAndSearch` aus dem entfernten `submit`; zusätzlich veraltete Erwartungen. Auf ausdrücklichen Nutzerwunsch mit `7940ca3` entfernt. Der alte ungebundene Einstieg ist kein beizubehaltender Produktionsvertrag. | Direktsuche, Klärung ohne Trefferaufruf und Kriterienabdeckung später über den aktuellen Flow prüfen; keine bloße Wiederherstellung des alten Einstiegs oder Importumbenennung. |

Historische veraltete Erwartungen des entfernten Integrationstests, kein aktueller Fehler in einer noch vorhandenen Datei:

- `SEARCH-SUBMIT-INT-001` erwartete beim Multi-Aufruf nur `query`, ohne das im vorhandenen Adapter gesetzte `include_adult=true`.
- `SEARCH-SUBMIT-INT-004` erwartete fälschlich eine Ablehnung der heute unterstützten expliziten Filmsuche.
- `SEARCH-SUBMIT-INT-005` erwartete fälschlich eine Ablehnung der heute unterstützten Seriensuche mit Einzeljahr.

Die Kennungen `SEARCH-SUBMIT-INT-001` bis `SEARCH-SUBMIT-INT-005` sind mit der entfernten Datei ausgemustert und dürfen nicht neu vergeben werden. Alle übrigen Tests bleiben durch diese Schritte unverändert. Keine Tests deaktiviert oder ausgeschlossen, keine Coverage-/Checkkonfiguration geändert und keine Kompatibilitätsmodule für alte Tests angelegt. Die ursprünglichen Testimportprobleme waren aus dem Code festgestellt, nicht durch einen Testlauf. Der gemeldete Typecheck-Erfolg ist kein Nachweis ausgeführter oder erfolgreicher Tests. Bei späterer Testarbeit bestehende Abdeckungsgrenzen inventarisieren und doppelte Fallmatrizen vermeiden.

## Findings, Risiken und Abschluss

Die fehlende Ersatzabsicherung der entfernten Tests bleibt bewusst offen. Der Typecheck-Erfolg nach `6861dff` ist laut Nutzer belegt, nicht jedoch ein erneuter Lauf nach den Testlöschungen. Lint und manuelle Terminal-Durchstiche stehen aus; insbesondere Parallelität ist nicht nachgewiesen. Zentrale Texte, Parser-/Vertragskonsolidierung, HTTP-Zielpfad und kompakte Terminaldarstellung bleiben weiterzubearbeiten. Historische Iststandsangaben im Task-README sind durch die obige Umsetzung fortgeschrieben, nicht als aktueller Strukturbeleg zu lesen.

Änderungen an Regeln mit Grund und betroffenem Dokument festhalten. Umsetzung, manuelle Abnahme und offene Absicherung getrennt berichten. Ein explorativer Zwischenstand ist keine Produktionsfreigabe; ungeprüfte Kriterien nicht als erfüllt schließen.

Task 02 erst nach Auswahl des nächsten Anwendungsfalls mit eigenen Abnahmekriterien anlegen, nicht vorsorglich alle Suchwege planen.
