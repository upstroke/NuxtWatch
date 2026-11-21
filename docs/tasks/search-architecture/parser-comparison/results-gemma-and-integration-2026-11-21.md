# Gemma-Vergleich und Integrationsentwurf B

Stand: 21. November 2026. Ergänzt die [Qwen-Übergabe](results-qwen-2026-11-20.md); deren Download-/Wiedereinstiegsabschnitt ist historisch. Dokumentierter Entwurf, keine Freigabe für Produktionscode oder Teständerungen.

## Vergleich

Gemma-Lauf ab 2026-11-21T10:19:23.618Z, Modell google_gemma-4-26b-a4b-it, Q4_K_M, Node v26.6.0, sauberer Git-Stand 6baabbdc441913da11e81f7a1d7b8b0f98b981d4. Script-, Fixture-, Prompt- und alle fünf erfassten Quellcode-Hashes stimmen mit dem Qwen-Lauf überein.

126/126 Aufrufe abgeschlossen, keine vertragsungültigen oder abgeschnittenen Antworten. Alle Antworten melden null Reasoning-Tokens; maximal 50 Ausgabetokens. Vertragsgültigkeit ist keine semantische Abnahme.

B/C fragen bei V04 nach dem Medientyp und bei V10 nach Fortgeltung der bisherigen Filter; Qwen hatte diese Fragen nicht gestellt. V12 bleibt auch bei Gemma ohne bevorzugte Titelrückfrage. B/C behandeln V14 korrekt als unsupported. A verwendet dort needs_clarification. Bei V13 leiten A/C movie aus dem Titel Der letzte Film ab; B erhält all. Diese Verhaltensweisen wurden jeweils dreimal beobachtet. B ist der bevorzugte Integrationskandidat; C bringt keinen erkennbaren Vorteil. Kein vollständiger Verlauf getestet, kein Verlaufstest oder zusätzliche Historienverwaltung beschlossen.

Runtime: Kontextlänge laut Nutzer 20066, UI-Reasoning ausgeschaltet und im vollständigen Lauf durch null Reasoning-Tokens bestätigt. Scriptlimit 2048 gegenüber 256 bei Qwen; Timeout 120000 ms, maxRetries 0, keine explizite Script-Temperatur. Angezeigte LM-Studio-Werte: Temperatur 0.1, Top K 40, Top P 0.95, Min P 0.05, Repeat Penalty 1.1. UI-Werte sind kein vollständiger Nachweis effektiver API-Defaults. Qwen-Serverdefaults sind unvollständig dokumentiert. Deshalb Vergleich dokumentierter Modell-/Runtime-Konfigurationen, kein isolierter Modelleffekt.

Vorversuche: ein Transportfehler bei ausgeschaltetem Server; mit Reasoning zweimal Abschneidung bei 256 Tokens; bei 2048 vollständige Antwort trotz Reasoning; nach erneuter Abschaltung erfolgreicher Smoke-Test mit 50 Ausgabetokens und null Reasoning-Tokens. Nicht zum vollständigen Lauf zählen.

## Integrationsentwurf

1. B als neue Produktionsprompt-Version vorschlagen; Vergleichsartefakte unverändert erhalten. Bestehenden Parser, strikten Validator und Eingabe aus bestätigten Kriterien, Fähigkeiten und Nutzereingabe behalten. Kein zweiter Parser, keine neuen Suchkriterien. Modell bleibt konfigurierbar. V12 nicht nebenbei mit ungetestetem Promptnachtrag reparieren.
2. ready bleibt ein validierter Änderungsvorschlag, keine Ausführungserlaubnis. Bestehende Aktualitätsprüfung, Kriterienübernahme, Ausführbarkeitsprüfung und Reservierung bleiben maßgeblich. needs_clarification und unsupported übernehmen keinerlei Änderungen und starten keine Suche.
3. Allgemeine Modellfragen als gebundene offene Frage behandeln. Ursprüngliche ungeklärte Eingabe und aktuelle Frage zusammen mit requestId/revision/questionId erhalten; bestätigte Kriterien bleiben maßgebliche Basis. Keine vollständige Gesprächshistorie. Beispiel: Bei Morgenbogen von 1999 und Antwort Film dürfen Titel/Jahr nicht verloren gehen, weil der Kandidat bei Rückfragen keine Änderungen mitliefert.
4. Diesen Antwortweg gesondert spezifizieren und prüfen: Er ist nicht durch den B-Einzelaufrufvergleich abgenommen. Exakte interne Datenstruktur und Revisionsübergänge sind noch nicht implementiert oder abschließend spezifiziert.
5. Bestehende strukturierte Auswahlfragen weiter ohne LLM verarbeiten. Allgemeine Modellfragen haben nur Text, keine maschinenlesbaren Optionen. Zunächst gebundene Freitextantwort; keine Optionsableitung durch Analyse des Fragetextes. Auswahloptionen für beliebige Modellfragen würden eine spätere ausdrückliche Vertragserweiterung benötigen.
6. Antwortbindung prüfen, Antwort im ungeklärten Auftrag interpretieren, Vorschlag validieren, Kriterien übernehmen, gegebenenfalls erneut klären. Erfolgreiche Klärung startet keine Suche; anschließend ausdrückliches Execute. Veraltete Antworten, technische Fehler und ungültiges JSON dürfen weder unzulässig übernehmen noch auf alte Kriterien zurückfallend ausführen. Bestehenden direkten Submit nicht beiläufig umbauen.

## Umsetzung und Abnahme

Getrennte Freigaben: zunächst Ergebnis/Entwurf dokumentieren; danach Promptübernahme; danach gebundene Freitextklärung und Terminalbedienung. Ein reiner Promptwechsel ist kein fertiger Rückfrageablauf. Keine Code-/Teständerungen durch diese Notiz. Prüf- und Testumfang vor Implementierung ausdrücklich vereinbaren.

Abnahmeszenarien: Titel/Jahr bleiben nach Medientypantwort erhalten; Fortgeltungsfrage führt zum gewünschten Stand; fehlender Titel verhindert unzulässige Suche; Unsupported führt nicht zur Teilübernahme; Antworten nach Reset/neuem Submit ändern keinen veralteten Stand; erfolgreiche Klärung führt nicht automatisch zur Ausführung.

## Lokale Ergebnisaufbewahrung

Vollständige Qwen- und Gemma-Vergleichsverzeichnisse jeweils mit Metadaten, Rohantworten, Zusammenfassung, Plan und Prompt-/Fixture-Snapshots lokal behalten oder vollständig archivieren. Rohlogs nicht ungeprüft committen.

Dry-runs, Server-aus-Versuch smoke-3oacg9 und redundante Smoke-Tests können nach Sicherung relevanter Erkenntnisse entfernt werden. Empfohlen: einen abgeschnittenen Reasoning-Smoke-Test und den letzten erfolgreichen Smoke-Test ohne Reasoning als Diagnosebelege behalten. Keine pauschale Löschung von test-results oder aller smoke-Verzeichnisse. Konkrete übrige lokale Verzeichnisnamen wurden nicht geprüft. Diese Dokumentation löscht keine Dateien und führt keine weiteren Modellaufrufe oder Checks aus.
