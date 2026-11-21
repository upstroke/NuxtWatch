# Gemma: gebundene Freitextklärung am 21. November 2026

## Grundlage und Abgrenzung

Branch: `feat/shared-search-architecture`; Textumstellung: `4c7bea0` (`refactor(search): send clarification dialogue as labeled text`). Grundlage sind vom Nutzer gepostete lokale CLI-Ausgaben, eine LM-Studio-Serverantwort und seine ausdrückliche Bestätigung erfolgreicher Typecheck-/Lint-Läufe. Der Assistant hat die lokalen Prüfungen nicht selbst ausgeführt.

Dies ist eine manuelle Smoke-Test- und Übergabenotiz, kein vollständiger Lauf des eingefrorenen Parser-Vergleichspakets und kein Nachweis einer allgemeinen Überlegenheit von Texteingaben.

## Fehler und Änderung

Nach `/reset` und „Finde Morgenbogen von 1999“ fragte das LLM nach Film oder Serie. Auf eine Klärungsantwort wurde zunächst nur `mediaType: movie` übernommen; Titel und Jahr fehlten. Die Anwendung fragte deshalb nach dem Titel.

`c585f4f` ergänzte den festen Auftrag, ursprünglichen ungeklärten Suchwunsch und Klärungsantwort gemeinsam zu interpretieren und alle nötigen Änderungen gegenüber bestätigten Kriterien vorzuschlagen. Danach funktionierte „Film“ in einem geposteten Lauf, „ich meine den Film“ scheiterte weiterhin. Tatsächliche Requests und Rohantworten dieser Fehlerläufe wurden nicht aufgezeichnet; die genaue Fehlerstelle ist damit nicht abschließend belegt.

`4c7bea0` änderte anschließend die Klärungseingabe: beschriftete Textabschnitte für ursprünglichen Suchwunsch, frühere Frage-/Antwortpaare, aktuelle Frage und aktuelle Antwort. Bestätigte Kriterien und Fähigkeiten bleiben als JSON in eigenen Abschnitten. Normale Submits bleiben im bisherigen JSON-Eingabeformat. Hauptprompt und JSON-Ausgabeschema wurden in diesem Commit nicht verändert; der ergänzende Klärungsauftrag wurde auf die Textabschnitte angepasst und auf Version `1.1.0` gesetzt.

Anwendung: Kontext und Bindungen verwalten, Vorschlag validieren und übernehmen, ausdrücklich ausführen. LLM: Sprache und Zusammenhang interpretieren und JSON-Vorschlag liefern. Keine heuristische Titel-/Jahrextraktion in der Anwendung ergänzt.

## Beobachtete Live-Ergebnisse nach Textumstellung

Jeweils `/reset`, dann „Finde Morgenbogen von 1999“, anschließend die Medientypfrage beantworten:

| Antwort | Gezeigte erfolgreiche Läufe | Übernommene Kriterien |
| --- | --- | --- |
| ich meine den Film | 2 | Morgenbogen, movie, 1999 |
| Film | 1 | Morgenbogen, movie, 1999 |
| Die Serie bitte | 1 | Morgenbogen, tv, 1999 |

Insgesamt vier erfolgreiche Durchläufe in den geposteten Ausgaben. Alle melden `ready`, ohne erneute Titelrückfrage und ohne automatische Suche. `/execute` wurde in diesen Durchläufen nicht geprüft. Es sind nicht drei Wiederholungen pro Variante dokumentiert.

## Bestätigte Modellangaben

LM-Studio-Antwort vom 21. November 2026, 14:38:53, zum erfolgreichen Serienfall:

- API-Modell-ID und system_fingerprint: `google_gemma-4-26b-a4b-it`.
- Finale Antwort: `{"status":"ready","changes":[{"field":"title","operation":"set","value":"Morgenbogen"},{"field":"mediaType","operation":"set","value":"tv"},{"field":"year","operation":"set","value":1999}]}`.
- `reasoning_content: ""`, `reasoning_tokens: 0`: für diesen Aufruf kein ausgewiesener Reasoning-Inhalt. Daraus nicht den exakten Zustand eines UI-Schalters ableiten.
- `finish_reason: "stop"`: kein gemeldeter Tokenlimit-Abbruch.
- 1979 Prompt-Tokens, 50 Completion-Tokens, 2029 insgesamt.
- `tool_calls: []`.

Ausgewählter Download zuvor: `bartowski/google_gemma-4-26B-A4B-it-GGUF`, Datei `gemma-4-26B-A4B-it-Q4_K_M.gguf`. API-ID allein belegt nicht, dass genau diese Quantisierung geladen war. Rechner laut Nutzer: Apple M1 Max, 32 GB RAM.

Kontextlänge, effektive Temperature/Top-P/Top-K, Seed sowie Chat-Template-/Runtime-Version sind im vorliegenden Log nicht belegt. Im zuletzt eingesehenen Anwendungscode: `maxOutputTokens: 256`, `maxRetries: 0`; Thinking, Sampling und Tokenlimit wurden mit der Textumstellung nicht verändert. Der diskutierte Wert 2048 wurde nicht implementiert.

## Checks, Schlussfolgerung und Wiedereinstieg

Typecheck und Lint sind laut ausdrücklicher Nutzerbestätigung erfolgreich. Keine neuen automatisierten Tests oder vollständigen Modellvergleiche ausgeführt. Der konkret beobachtete Verlust von Titel und Jahr trat in den vier gezeigten Textübergabe-Läufen nicht mehr auf; das ist keine garantierte Fehlerfreiheit und kein isolierter Formatvergleich, da auch der ergänzende Klärungsauftrag angepasst wurde.

Als Nächstes fehlende Laufparameter festhalten, weitere Klärungen bei unveränderten Einstellungen prüfen und den vollständigen Gemma-Vergleich separat starten. Das eingefrorene Paket unter `parser-comparison/` nicht rückwirkend an diesen Live-Test anpassen. Rohantworten und Metadaten möglichst lokal aufbewahren; keine sensiblen Requests ungefragt committen.
