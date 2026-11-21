# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: vorbereitet, Umsetzung noch nicht begonnen. Stand: 21. November 2026. Branch: `feat/shared-search-architecture`.

Grundlagen: [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Regeln nicht als zweite vollständige Matrix in diesem Task pflegen.

## Ziel

Bestehende Suche gemäß Zielstruktur ordnen und die vereinbarten Titelwege über die gemeinsame Hindernismatrix bewerten. Titel ist vorhandener Abnahmefall der gemeinsamen Architektur, kein eigener Parser. Erst nach dem Durchstich wird der nächste konkrete Anwendungsfall gewählt; das kann beispielsweise ein Keyword sein.

## Umfang und Grenzen

Gemeinsamer Coordinator, Hindernisbewertung, Grenzverträge, zentrale Anwendungstexte und minimal nötige Terminaldarstellung. Bestehende Sessionbindung, JSON-Interpretation und Provideradapter erhalten. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Datenbank, generische Regel-Engine, vollständige Internationalisierung oder Web-UI. Kein erneuter Prompt-/Modellvergleich.

Automatisierte Tests sind für diese explorative Phase ausdrücklich zurückgestellt: weder neu anlegen noch erweitern, duplizieren oder im Zuge des Umbaus refaktorieren. Bestehende Tests nicht pauschal löschen. Durch Umbenennungen oder Verträge ungültige Tests als bekannte Lücke protokollieren; keine Ausschlüsse, Konfigurationsänderungen oder Kompatibilitätsschichten allein zum Verbergen solcher Fehler. Automatisierte Testläufe sind hier kein verpflichtender Abnahmeschritt; nicht ausgeführte Tests nicht als grün melden. Typecheck und Lint bleiben vorgesehen.

## Umsetzungsschritte

- [ ] Aktuellen Code und Aufrufer gegen die Zielstruktur prüfen; benötigte Funktionen zuordnen.
- [ ] `workflow.ts` zu `flow.ts` umbenennen, benötigte Koordination aus `coordinator.ts`/`submit.ts` zusammenführen; alte Koordinationsschichten entfernen.
- [ ] `matrix.ts` für gemeinsame Hindernisbewertung herstellen. Jeder passende Weg erhält denselben Kriterienstand; vollständigen Suchumfang und Kriterienabdeckung prüfen.
- [ ] HTTP-Einstieg nach `server/api/search/index.post.ts` verschieben, zusammengehörige externe Suchverträge konsolidieren; Produktionsimporte nachziehen.
- [ ] Gemeinsame LLM-Interpretation/Validierung sinnvoll ordnen, keinen Parser je Suchweg und keinen neuen Vertrag auf Vorrat einführen.
- [ ] Anwendungseigene Fragen/Hinweise zentral gemäß Textkatalog verwalten; freie Modellnachrichten davon unterscheiden.
- [ ] Vorhandene TMDb-Adapter wiederverwenden; keine zusätzliche `title.ts` als reine Weiterleitung.
- [ ] Terminal nur soweit nötig für Kriterien, gebundene Fragen, Execute und kompakte Treffer ergänzen.
- [ ] Codeprüfung, manuelle Fälle, Typecheck und Lint durchführen und protokollieren. Testinkompatibilitäten notieren, nicht beheben oder verdecken.
- [ ] Findings in Konzept/Matrix/Zielstruktur zurückführen; nächsten Suchweg gesondert auswählen.

## Abnahmekriterien

| ID | Beobachtbares Kriterium | Vorgesehene Prüfung |
| --- | --- | --- |
| AC1 | Betroffene Produktionsdateien entsprechen der Zielstruktur; keine abgelösten Koordinationsschichten oder alten Produktionsimporte bleiben parallel bestehen. Unveränderte Testimporte sind gesondert als mögliche Altlast erfasst. | Codeprüfung, Typecheck |
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
| AC1 | Nicht geprüft | — |
| AC2 | Nicht geprüft | — |
| AC3 | Nicht geprüft | — |
| AC4 | Nicht geprüft | — |
| AC5 | Nicht geprüft | — |
| AC6 | Nicht geprüft | — |
| AC7 | Nicht geprüft | — |
| AC8 | Nicht geprüft | — |
| AC9 | Nicht geprüft | — |
| AC10 | Nicht geprüft | — |
| AC11 | Nicht geprüft | — |

Erlaubte Status: nicht geprüft, teilweise geprüft, erfüllt, fehlgeschlagen, blockiert. Ein Code-Review ist kein vollständiger Parallelitätsnachweis. Ungeprüfte Teile eines Kriteriums bleiben sichtbar, keine pauschale Vollabnahme.

| Check | Ergebnis |
| --- | --- |
| Typecheck | Nicht ausgeführt |
| Lint | Nicht ausgeführt |
| Automatisierte Tests | Bewusst zurückgestellt; kein aktueller Erfolgsnachweis |

## Findings, Risiken und Abschluss

Noch keine neuen Findings. Änderungen an Regeln mit Grund und betroffenem Dokument festhalten. Beobachtete Risiken und zurückgestellte Testinkompatibilitäten hier ergänzen. Umsetzung, manuelle Abnahme und offene Absicherung getrennt berichten. Ein explorativer Zwischenstand ist keine Produktionsfreigabe; ungeprüfte Kriterien nicht als erfüllt schließen.

Task 02 erst nach Auswahl des nächsten Anwendungsfalls mit eigenen Abnahmekriterien anlegen, nicht vorsorglich alle Suchwege planen.
