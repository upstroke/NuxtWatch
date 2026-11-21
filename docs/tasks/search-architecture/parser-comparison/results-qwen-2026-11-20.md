# Qwen-Vergleich und Übergabe

Stand: 20. November 2026, Tagesabschluss. Grundlage: vom Nutzer lokal ausgeführter Dry-run, separater Smoke-Test und vollständiger Vergleich; anschließend im Chat bereitgestellte responses.jsonl und metadata.json ausgewertet. Keine Rohlogs oder realen Gesprächsverläufe werden mit diesem Dokument committet.

## Versuchsstand

- Branch feat/shared-search-architecture, Git-Stand 6baabbdc441913da11e81f7a1d7b8b0f98b981d4; metadata.json meldet ein sauberes Arbeitsverzeichnis.
- [Vergleichspaket 0.1](README.md), [Kandidat](candidate-0.1.md), [14 Fälle](cases-0.1.json), [Bedienung](RUNNING.md). Vorherige Schritte: Entwurf 095d62d, festgeschriebene Artefakte 22b0463, Script 6baabbd. Produktionsprompt weiterhin 1.4.0 aus d9f93fc.
- LM Studio, Modell-ID qwen3-coder-30b-a3b-instruct; vom Nutzer dokumentierte Quantisierung Q4_K_M. Hardware laut Nutzer: Apple M1 Max mit 32 GB gemeinsamem Speicher.
- Lokaler API-Endpunkt localhost:1234/v1, Node v26.6.0.
- Maximal 256 Ausgabetokens, maxRetries 0, Timeout 120000 ms. Temperatur nicht ausdrücklich gesetzt. Effektive Sampling-/Serverdefaults, Kontextgröße und Seed nicht vollständig dokumentiert; keine vollständige Reproduzierbarkeitszusage.
- Beginn des vollständigen Laufs laut Metadaten: 2026-11-20T17:03:05.872Z. 14 unabhängige Fälle mal drei Varianten mal drei Wiederholungen. A: bestehender Prompt; B: Kandidat mit bisherigen Kriterien/Fähigkeiten; C: derselbe Kandidat mit begrenztem Zusatzkontext.
- Hash des Fallpakets: 8465681eab2b2eda07dca4c48fe0fc5d84c37f8d9cd9244b320871a53fd8f420. Prompt A: e0987310c4ca34a292b86117f9dd3c7ad24d16ee1e4105c519b367b2d71cf773. Prompt B/C: c555bc85deb0389de2347a42ce165b132679ecc9e2f156d951e023db22d1a672.

## Durchführung und Ergebnisse

Dry-run erfolgreich gemeldet. Der separate Smoke-Test V01/A lieferte korrekt Morgenbogen, movie, 1999; Vertrag gültig, nicht abgeschnitten. Er zählt nicht zum vollständigen Lauf.

| Messung                        |   A |   B |   C |
| ------------------------------ | --: | --: | --: |
| Abgeschlossene Aufrufe         |  42 |  42 |  42 |
| Vertragsgültige Antworten      |  38 |  42 |  42 |
| Ungültige Antworten            |   4 |   0 |   0 |
| Wegen Tokenlimit abgeschnitten |   0 |   0 |   0 |

Insgesamt 126/126 abgeschlossen, kein Abbruch. Vertragsgültigkeit ist keine semantische Erfolgsquote.

### V14: nicht unterstützter Bewertungsfilter

A schlug dreimal ein unerlaubtes Änderungsfeld rating mit Wert 8 vor; der bestehende Validator lehnte die Antworten ab. B/C antworteten jeweils dreimal mit unsupported und benannten die fehlende Bewertungsbeschränkung. Das ist der deutlichste beobachtete Vorteil des Kandidaten, aber noch kein allgemeiner Zuverlässigkeitsnachweis. Eine B-Erklärung bezeichnete Morgenbogen unbegründet als Film; mehrere Antworten ergänzten Hinweise auf manuelles Prüfen. Diese sprachlichen Zusätze getrennt von der korrekten Unsupported-Entscheidung bewerten.

### V10: mehrdeutiger Titelwechsel

Keine der neun Antworten stellte die vorab erwartete Rückfrage zur Fortgeltung von Serie und Jahr 2005. Alle wählten inhaltlich die Fortführung mit anderem Titel. Bei A/Wiederholung 2 machten zusätzliche abschließende Markdown-Backticks die Antwort außerdem zu ungültigem JSON. Dies ist der vierte ungültige Aufruf. Die Fortführung ist sprachlich plausibel, verfehlt aber die festgelegte Versuchserwartung. Diese Erwartung wird nicht nachträglich geändert und ist keine bereits beschlossene produktive Neustartregel.

### Übrige Fälle und redundante Änderungen

V01–V09 und V11–V13 ergaben in allen Varianten und Wiederholungen den erwarteten resultierenden Kriterienstand. Bei V04 und V12 lieferten auch B/C stets ready mit den erkannten Kriterien statt der vom Kandidaten bevorzugten Modellfrage. Nach den vorab festgelegten Regeln sind diese Vorschläge zulässig. Sie belegen nicht, dass der Kandidat die gewünschte Fragepolitik umsetzt. Die Integration allgemeiner Modellfragen bleibt offen.

C setzte bei V06 dreimal das bereits vorhandene Jahr 2005 erneut; bei V10 einmal den bereits vorhandenen Medientyp tv. Zustandsneutral, aber Abweichung vom minimalen Änderungsauftrag.

## Aussagegrenzen und Entscheidungen

- Die Matrix zeigt keinen erkennbaren semantischen Nutzen des getesteten Zusatzkontexts gegenüber B. Er wiederholt überwiegend bereits bestätigte Kriterien. Kein vollständiger Gesprächsverlauf wurde getestet; openQuestion war immer null. Kein Schluss, dass Gesprächsverlauf grundsätzlich nutzlos wäre.
- Der Nutzer möchte vorerst keinen Verlaufstest. Keine zusätzliche produktive Kontextverwaltung einführen.
- Noch keine Produktionsintegration des Kandidaten und keine Vertragsänderung freigegeben. Der zuvor vorgeschlagene bereinigte Produktionsprompt wird zunächst zurückgestellt.
- Nächster Schritt ist ein Modellvergleich bei unverändertem Prompt-/Fallpaket, nicht weiterer Prompt-Feinschliff. Die beobachteten Grenzen sind noch nicht eindeutig dem Modell oder dem Prompt zuzuordnen.
- Ergebnisse gelten für dieses kleine synthetische Fallpaket und diesen Modell-/Einstellungsstand. Drei Wiederholungen sind keine statistisch belastbare Abnahme.

## Übergabe: nächster lokaler Kandidat

Ausgewählt: bartowski/google_gemma-4-26B-A4B-it-GGUF, Datei gemma-4-26B-A4B-it-Q4_K_M.gguf. Die im Chat gezeigte Dateiliste nennt 17,04 GB. Auswahl als Gegenkandidat, nicht als nachgewiesen besseres Modell.

Zum Tagesabschluss meldet der Nutzer einen noch laufenden Download. Abschluss, Laden und tatsächliche API-Modell-ID sind nicht bestätigt. Kein Gemma-Smoke-Test und kein Gemma-Vergleich ausgeführt.

Wiedereinstieg:

1. Downloadabschluss prüfen, Coder-Modell entladen und Gemma laden.
2. Tatsächliche API-ID sowie Runtime-/Chat-Template, Kontextgröße, Thinking- und Sampling-Einstellungen dokumentieren. Kontrollmarkierungen und eventuelle Reasoning-Ausgaben dürfen nicht unbemerkt als JSON-Interpretationsfehler gewertet werden.
3. NUXT_LLM_MODEL nur lokal anpassen; .env nicht committen.
4. Zunächst ausdrücklich einen einzelnen Smoke-Test gemäß RUNNING.md ausführen. Rohtext, Finish-Grund und Kriterien prüfen; er ist kein Teil des vollständigen Vergleichs.
5. Erst nach Prüfung den vollständigen Vergleich gesondert starten. Kandidatenprompt und Fälle unverändert lassen. Notwendige Änderungen an Runtime oder Tokenlimit vor dem Lauf dokumentieren; keine stillschweigende Vergleichbarkeit mit unbekannten Qwen-Serverdefaults behaupten.
6. Danach beide Modellläufe auswerten, bevor Produktionsmodell/-prompt geändert werden.

Das vollständige lokale Qwen-Ergebnisverzeichnis einschließlich Prompts und Metadaten aufbewahren. Rohantworten liegen unter dem ignorierten test-results/parser-comparison/ und werden nicht automatisch veröffentlicht.

## Prüfstand

Der Parser-Vergleich ist keine Testsuite und keine Abnahme der Such-/Sessionpfade. Dry-run, Smoke-Test und Vergleich wurden lokal vom Nutzer ausgeführt. Es liegen dadurch keine neuen bestätigten Typecheck-, Lint- oder Testergebnisse vor. Dieser Dokumentationsschritt verändert weder Produktionscode noch Tests und führt keine weiteren Checks oder Modell-/Provideraufrufe aus.
