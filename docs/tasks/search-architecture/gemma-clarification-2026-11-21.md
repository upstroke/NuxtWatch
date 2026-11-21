# Gemma: gebundene Freitextklärung am 21. November 2026

## Grundlage und aktueller Stand

Branch: `feat/shared-search-architecture`. Textphase: `4c7bea0`; aktueller JSON-Stand: `81dc0e8` (`refactor(search): send clarification input as JSON with current interpretation rules`). Grundlage sind vom Nutzer gepostete CLI-Ausgaben, eine LM-Studio-Antwort aus der Textphase und seine Checkbestätigung für den Textstand. Lokale Prüfungen wurden nicht vom Assistant ausgeführt.

Dies ist eine manuelle Smoke-Test- und Übergabenotiz, kein vollständiger Lauf des eingefrorenen Vergleichspakets und kein Nachweis einer allgemeinen Überlegenheit eines Eingabeformats.

## Fehler und Änderungen

Nach `/reset` und „Finde Morgenbogen von 1999“ fragte das LLM nach Film oder Serie. Zunächst wurde auf eine Klärungsantwort nur `mediaType: movie` übernommen; Titel und Jahr fehlten, die Anwendung fragte nach dem Titel.

`c585f4f` ergänzte den Auftrag, ursprünglichen ungeklärten Suchwunsch und Klärungsantwort gemeinsam zu interpretieren und alle nötigen Änderungen gegenüber bestätigten Kriterien vorzuschlagen. Danach funktionierte „Film“ in einem geposteten Lauf, „ich meine den Film“ scheiterte weiterhin. Tatsächliche Requests und Rohantworten der Fehlerläufe wurden nicht aufgezeichnet; die genaue Fehlerstelle bleibt unbelegt.

`4c7bea0` stellte die Klärungseingabe auf beschriftete Textabschnitte um und passte den ergänzenden Klärungsauftrag auf Version `1.1.0` an. Hauptprompt und JSON-Ausgabeschema blieben unverändert.

`81dc0e8` übergibt den gesamten auftragsbezogenen Eingabeinhalt wieder als ein JSON-Objekt mit `context` und `userText`. Bei Klärung enthält `context` zusätzlich `originalUserText`, `clarificationTurns` und `openQuestion.message`. Der feste Systemauftrag bleibt separat. Die aktuellen inhaltlichen Interpretationsregeln und das Beispiel bleiben erhalten; nur formatbezogene Hinweise und Feldzuordnung wurden angepasst. Klärungszusatz: `1.1.1`. Kein Rücksetzen auf den älteren Promptstand; keine Änderung an JSON-Ausgabeschema, Validierung, Modell-, Thinking-, Sampling- oder Tokenlimitkonfiguration.

Anwendung: Kontext und Bindungen verwalten, Vorschlag validieren und übernehmen, ausdrücklich ausführen. LLM: Sprache und Zusammenhang interpretieren und JSON-Vorschlag liefern. Keine heuristische Titel-/Jahrextraktion in der Anwendung ergänzt.

## Historische Textphase: vier erfolgreiche Durchläufe

Jeweils `/reset`, dann „Finde Morgenbogen von 1999“, anschließend die Medientypfrage beantworten:

| Antwort | Gezeigte erfolgreiche Läufe | Übernommene Kriterien |
| --- | --- | --- |
| ich meine den Film | 2 | Morgenbogen, movie, 1999 |
| Film | 1 | Morgenbogen, movie, 1999 |
| Die Serie bitte | 1 | Morgenbogen, tv, 1999 |

Alle vier melden `ready`, ohne erneute Titelrückfrage und ohne automatische Suche. Kein `/execute` geprüft.

## Aktueller JSON-Gegencheck: drei erfolgreiche Durchläufe

Vom Nutzer um 15:04 gepostet, jeweils nach `/reset` und „Finde Morgenbogen von 1999“:

| Antwort | Übernommene Kriterien | Ergebnis |
| --- | --- | --- |
| Ich meine den Film | Morgenbogen, movie, 1999 | ready |
| ich meine die Serie | Morgenbogen, tv, 1999 | ready |
| ich meine den Film von 2001 | Morgenbogen, movie, 2001 | ready |

Titel bleibt in allen Fällen erhalten. Der dritte Fall ersetzt das ursprüngliche Jahr ausdrücklich durch 2001. Keine erneute Titelrückfrage, keine automatische Suche; `/execute` nicht geprüft. Drei unterschiedliche Fälle, nicht drei Wiederholungen je Fall. Kein neuer Rohantwort-/Metadatenauszug für diese JSON-Läufe gepostet.

## Bestätigte Modellangaben aus der Textphase

LM-Studio-Antwort vom 21. November 2026, 14:38:53, zum erfolgreichen Serienfall:

- API-Modell-ID und system_fingerprint: `google_gemma-4-26b-a4b-it`.
- Finale Antwort: `{"status":"ready","changes":[{"field":"title","operation":"set","value":"Morgenbogen"},{"field":"mediaType","operation":"set","value":"tv"},{"field":"year","operation":"set","value":1999}]}`.
- `reasoning_content: ""`, `reasoning_tokens: 0`: kein ausgewiesener Reasoning-Inhalt für diesen Aufruf, kein Beleg für den exakten UI-Schalterzustand oder die späteren JSON-Läufe.
- `finish_reason: "stop"`: kein gemeldeter Tokenlimit-Abbruch.
- 1979 Prompt-Tokens, 50 Completion-Tokens, 2029 insgesamt; `tool_calls: []`.

Ausgewählter Download zuvor: `bartowski/google_gemma-4-26B-A4B-it-GGUF`, Datei `gemma-4-26B-A4B-it-Q4_K_M.gguf`. API-ID allein belegt nicht die geladene Quantisierung. Rechner laut Nutzer: Apple M1 Max, 32 GB RAM.

Kontextlänge, effektive Temperature/Top-P/Top-K, Seed sowie Chat-Template-/Runtime-Version sind nicht belegt. Im zuletzt eingesehenen Anwendungscode: `maxOutputTokens: 256`, `maxRetries: 0`. Der diskutierte Wert 2048 wurde nicht implementiert.

## Checks und Schlussfolgerung

Typecheck und Lint wurden für den Textstand ausdrücklich als erfolgreich bestätigt. Für `81dc0e8` fehlt noch eine erneute ausdrückliche Bestätigung. Keine neuen automatisierten Tests oder vollständigen Modellvergleiche ausgeführt.

Die aktuelle JSON-Übergabe besteht die drei gezeigten Fälle einschließlich Jahreskorrektur. JSON ist damit nicht grundsätzlich ungeeignet; eine allgemeine Überlegenheit von Text ist nicht belegt. Welche Änderung den früheren Fehler ausschlaggebend behoben hat, ist nicht isoliert nachgewiesen. Die kleine manuelle Stichprobe garantiert keine Fehlerfreiheit.

## Vereinbarter Wiedereinstieg

Format-Gegencheck vorerst abgeschlossen; JSON beibehalten und gemäß Nutzerwunsch Architekturarbeit fortsetzen. Keine weitere Format-/Thinking-Optimierung als unmittelbarer nächster Schritt. Architekturstand und nächste konkrete Änderung anhand der Architektur-/Interaktionsdokumente klären.

Vollständiger Gemma-Vergleich, fehlende Laufparameter, mehrstufige Klärungen, Ausführung nach Klärung und technische Absicherung bleiben offen, blockieren aber nicht die nächste Architekturarbeit. Eingefrorenes Paket unter `parser-comparison/` nicht rückwirkend anpassen. Rohantworten und Metadaten möglichst lokal aufbewahren; keine sensiblen Requests ungefragt committen.
