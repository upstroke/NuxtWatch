# Sucharchitektur – Arbeitsstand und nächste Schritte

Stand: 21. November 2026. Branch: `feat/shared-search-architecture`. Dokumentierter Implementierungsstand: `81dc0e8`; Zielbild aktualisiert mit `dcb41e6`. Dokumentation ist kein Nachweis bereits erfolgter Code-Umstrukturierung oder neuer Checks.

## Verbindliche Grundlage

- [Konzept, Architekturbild und Hindernismatrix](../../sucharchitektur-konzept.md): gemeinsame Regeln.
- [Zielstruktur](zielstruktur.md): Namen, Zuständigkeiten und Umbau.
- [TMDb-Analyse](../../tmdb-api-analysis.md), [verifizierte Requests](../../tmdb-search-examples.md), [Wizard](../../ideas/clarificaton-wizzard-flow.md), [übersetzbare Texte](../../ideas/translation-catalog.md).
- [Testing](../../testing.md) und [Typing](../../typing.md): unveränderte gemeinsame Entwicklungsregeln.

Historische Durchstichsnotizen sind nach dieser Konsolidierung keine aktuelle Arbeitsanweisung mehr.

## Implementierung und Nachweise

- HTTP und Terminal unterstützen Submit, gebundene Klärung, Execute und Reset. Serverkriterien, Auftrag, Revision und konkrete Frage sind getrennt gebunden. Der Suchbereich besteht noch aus `workflow.ts`, `coordinator.ts`, `submit.ts`, `parser.ts`, `llm.ts`; die neue gemeinsame `matrix.ts` fehlt.
- Titel ohne Medientyp/Jahr: Multi; Film/Serie optional mit Einzeljahr: Movie/TV. Titel plus Jahr ohne Medientyp: Klärung gemäß aktueller Produktentscheidung. Keine Zusammenführung zweier Titellisten, keine Jahres-Nachfilterung. Multi-Personen werden nicht zu Titelkarten; `include_adult=true`, keine Adult-basierte Treffer-Ausfilterung.
- Clarify sucht nicht. Submit/Execute teilen die Reservierung; Execute interpretiert nicht erneut. Dieselbe laufende/erfolgreiche Revision startet nicht nochmals; technischer Fehler erlaubt ausdrücklichen neuen Versuch. Session-Map: 30 Minuten Inaktivität, maximal 1.000 Sessions, prozesslokal, nicht neustartfest.
- JSON seit `81dc0e8`, aktuelle Interpretationsregeln beibehalten. Drei vom Nutzer gezeigte Fälle nach „Finde Morgenbogen von 1999“: „Ich meine den Film“ → movie/1999, „ich meine die Serie“ → tv/1999, „ich meine den Film von 2001“ → movie/2001. Titel erhalten, ready, keine Titelrückfrage/automatische Suche. Execute dabei nicht geprüft. Zuvor vier erfolgreiche Textläufe; Ursache des früheren Fehlers nicht isoliert bestimmt.
- Typecheck/Lint für den früheren Textstand bestätigt, erneute ausdrückliche Bestätigung für `81dc0e8` nicht dokumentiert. Keine neue Testsuite oder lokale Checks durch diese Konsolidierung.

## Abgeschlossener Parservergleich: übernommenes Fazit

Qwen und Gemma wurden jeweils mit 14 Fällen, drei Varianten und drei Wiederholungen geprüft: jeweils 126 abgeschlossene Aufrufe. Qwen: A 38/42 vertragsgültig, B/C jeweils 42/42; kein Tokenlimit-Abbruch. Gemma: 126/126 vertragsgültig, kein Abbruch; B/C stellten die erwarteten Fragen bei Titel/Jahr und mehrdeutiger Fortführung. B war bevorzugter Integrationskandidat, C ohne erkennbaren zusätzlichen Nutzen. Die bevorzugte Titelrückfrage bei fehlendem Titel wurde auch mit Gemma nicht zuverlässig erreicht.

Gemma: `google_gemma-4-26b-a4b-it`, Q4_K_M, Lauf am 21. November ab 10:19:23.618Z, Vergleichsstand `6baabbd`. Kontext laut damaliger Nutzerangabe 20066, null ausgewiesene Reasoning-Tokens im vollständigen Lauf. Vergleichslimit 2048 gegenüber Qwen 256; angezeigte Gemma-Samplingwerte sind kein vollständiger Nachweis effektiver API-Defaults. Deshalb kein isolierter Modelleffekt und keine allgemeine Zuverlässigkeitsabnahme. Diese historischen Vergleichswerte sind nicht automatisch Einstellungen jedes späteren App-Aufrufs.

Vertragsgültigkeit ist keine semantische Erfolgsquote. Der Zusatzkontext wurde ohne nichtleere offene Frage getestet; sein fehlender Nutzen widerlegt nicht den später erprobten gebundenen Klärungskontext. Kein weiterer vollständiger Modellvergleich als offene Architekturpflicht. Rohantworten bleiben lokal, keine ungeprüfte Veröffentlichung oder pauschale Löschung lokaler `test-results/`.

## Terminal bedienen

Bei laufendem Nuxt, Modellserver und lokaler Konfiguration:

```sh
node scripts/search.mjs
# Abweichender Nuxt-Server:
node scripts/search.mjs http://localhost:3001
```

Der Client nutzt HTTP und Cookie-Zuordnung, keine direkten Serverimporte oder eigenen Providerzugangsdaten. Ohne offene Frage ist Text Submit; bei offener Frage gebundene Freitextantwort. `/select NUMMER` beantwortet angebotene Auswahl, `/submit TEXT` eröffnet ausdrücklich einen neuen Auftrag, `/execute` startet den geklärten Stand, `/reset` neuen Kontext, `/exit` beendet den Client. Kein automatischer Suchstart nach Clarify. Wizard und kompakte Trefferansicht werden bedarfsgerecht erweitert, nicht als fertig behauptet.

## Übernommene Abnahme- und Regressionsplanung

Bestandsangaben aus der früheren Inventur, beim Umbau am Code prüfen, kein aktueller Nachweis grüner Tests:

| Zusicherung | Grenze und vorhandener Ansatz / Lücke |
| --- | --- |
| Direkter Titel startet ohne zweite Freigabe; Klärung/Unsupported starten keinen Trefferaufruf | Kontrollierte Integration: `tests/integration/tmdb/search-submission.spec.ts`; vorhandene SEARCH-SUBMIT-INT-Kennungen nicht neu vergeben |
| Änderungen auf Kopie; Jahrentfernung; ungenannte Kriterien bleiben | Coordinator/Flow: bisher `tests/unit/services/search-submission.spec.ts`; auf neue Zuständigkeiten anpassen |
| Systemauftrag getrennt, Nutzerdaten keine Instruktionen, ungültige Vorschläge abweisen | Bestehende Parser-Vertragsgrenze: `tests/unit/services/search-parser.spec.ts` |
| Multi/Movie/TV-Parameter, Mapping, Personen ausschließen, leere Antwort versus Fehler | Vorhandener Adapter: `tests/unit/services/title-search.spec.ts`; keine identische Mapping-Matrix im Flow wiederholen |
| Auswahl ohne LLM/Treffersuche; Freitext mit ursprünglichem Wunsch und Fragekontext | Klärungsablauf gezielt prüfen; Titel/Jahr erhalten, Jahreskorrektur übernehmen, Folgefragen ermöglichen |
| Veraltete/doppelte Antwort, neuer Submit/Reset während Interpretation | Flow mit kontrollierten asynchronen Grenzen; keine alte Übernahme oder reaktivierte Suche |
| Execute nur auf aktuellem freigegebenem Stand, doppelte/parallele Starts, ausdrückliche Fehlerwiederholung | Gemeinsame Ausführung/Reservierung; keine erneute LLM-Interpretation |
| Aktionen, Cookie/Reset, sichere Fehler, no-store, ungültige Antwort | HTTP-Integration; interne Fallmatrix nicht vollständig duplizieren |
| Eingabeabsicht, Kriterien, Folgefrage und kompakte Ergebnisse | Manueller Terminal-Durchstich, keine fixe Live-Trefferzahl |

Die alten Ablehnungsfälle für konkreten Medientyp/Jahr sind keine heutigen Sollregeln; sie müssen die vorhandenen Movie-/TV-Wege absichern. Frühere Nutzerentscheidung bleibt: keine zusätzlichen dedizierten Tests für `llm.ts` ohne neue Vereinbarung. Keine Schema-Primitivtests oder Coverage-Ziele pro Datei.

Aus dem Vergleich übernommen: eindeutiger Film/Serie, Titel allein, Titel/Jahr ohne Typ, Titelkorrektur und ausdrückliche Fortführung mit erhaltenen Filtern, ausdrücklicher Neustart ohne Einschränkungen, Jahr entfernen, Medientyp aufheben, Mehrdeutigkeit der Fortgeltung, fehlender Titel, Medienwort innerhalb des Titels und nicht unterstützte Bewertungsbedingung. Versuchserwartungen sind keine nachträgliche Produktregel. Neuer Submit erhält grundsätzlich bestätigte Kriterien; Reset entfernt sie. Sprachlich verlangtes Entfernen wird nur nach validierter Interpretation übernommen.

## Nächste Schritte und offene Punkte

1. Nach Freigabe dieser Konsolidierung historische Notizen entfernen: `clarification-flow.md`, `cli-abnahme.md`, `cli-direkt.md`, `gemma-clarification-2026-11-21.md`, `http-submit.md`, `interaction-state-decisions.md`, `llm-search-preparation.md`, `llm-search-preparation-draft.md`, `session-request-decision.md`, `test-inventory.md`.
2. `parser-comparison/` einschließlich seiner sechs Dateien zusammen mit `scripts/compare-search-parser.mjs` entfernen. Das Skript liest Candidate/Fallpaket direkt; nicht als kaputtes Restwerkzeug stehen lassen. Terminal-Client und reguläre Tests bleiben. Die Löschung erfolgt nicht durch diesen Dokumentationscommit.
3. Code nach Zielstruktur umbauen, Importe und betroffene Tests nachziehen, Typecheck/Lint und angemessene Tests ausführen. Keine parallelen Koordinationsschichten behalten.
4. Titel erneut durchstechen: allein, Film/Serie mit/ohne Jahr, gebundene Klärung samt Korrektur, ausdrückliches Execute, Ergebnisdarstellung; Findings in Regeln übernehmen.
5. Nächste Suchwege jeweils erst gegen offizielle TMDb-Dokumentation und bei Unsicherheit mit Requests prüfen, dann einzeln durchstechen. Keine vollständige Matrix oder Suchinfrastruktur auf Vorrat.

Offen bleiben unabhängige Teilübernahme bei Modellklärung, Submit-Idempotenz/Ergebniswiederholung, optionale Eingrenzung nach leeren/vielen Ergebnissen samt aussagekräftiger Gesamtzählung sowie die konkrete Umsetzung zentraler Texte und kompakter Terminaldarstellung. Allgemeine Modellfragen enthalten zunächst Text; keine Auswahloptionen aus ihrem Wortlaut extrahieren. Mehrfachtreffer sind ein gültiges Suchergebnis, kein automatischer Pflichtklärungsgrund. Weitere Kriterien und Zugriffsschutz/Ressourcenlimits separat bearbeiten.
