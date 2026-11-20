# Lokalen Parser-Vergleich ausführen

Das Script scripts/compare-search-parser.mjs ist ein isoliertes Hilfsmittel für das [Vergleichspaket](README.md). Produktionscode, Tests und Prompt bleiben unverändert. Keine Session-, HTTP-Such- oder TMDb-Aufrufe. Noch kein Modelllauf und keine Checks durch diesen Commit ausgeführt.

## Voraussetzungen

Aus dem Repository mit installierten pnpm-Abhängigkeiten starten; Node.js 22 oder neuer und Git erforderlich. Der Baseline-Commit d9f93fc muss lokal verfügbar sein (bei einem flachen Clone gegebenenfalls nachladen). TypeScript, Zod und die vorhandenen AI-SDK-Pakete werden verwendet, keine zusätzliche Abhängigkeit.

Der kleine scriptinterne Loader transpiliert nur eine explizit begrenzte Liste bestehender TS-Module im Speicher und löst deren Importe auf. Er ist kein allgemeiner App-Loader. Der unveränderte parseSearchProposal erhält zur Validierung eine Generierungsfunktion, die ausschließlich die bereits erfasste Rohantwort zurückgibt. Dabei findet kein weiterer Modellaufruf statt. Dadurch bleibt der bestehende Vorschlagsvalidator maßgeblich. Unerwartete lokale Modulabhängigkeiten führen zum Abbruch und müssen geprüft werden. Transpilierung ist kein Typecheck.

## 1. Dry-run ohne Netzwerk

```sh
node scripts/compare-search-parser.mjs
```

Lädt Prompt, Baseline und Fälle, prüft Ausgangskriterien/erwartete Edits und gleicht die Fähigkeiten mit dem bestehenden Parser ab. Schreibt einen Plan für 126 Aufrufe, startet aber keinen davon. Erwartungsmetadaten bleiben außerhalb der Modell-Eingaben. Der Dry-run ersetzt weder Typecheck/Lint noch einen Laufzeitcheck der Provideranbindung.

## 2. Ein ausdrücklicher Probelauf

Erst nach gesonderter Freigabe und laufendem lokalen Modellserver:

```sh
node --env-file-if-exists=.env scripts/compare-search-parser.mjs --run --smoke --model-label 'Tatsaechliches Modell und Quantisierung eintragen'
```

Verwendet NUXT_LLM_PROVIDER, NUXT_LLM_BASE_URL und NUXT_LLM_MODEL wie die App. Ohne --run werden niemals Modellaufrufe gestartet. Erlaubt sind ausschließlich Loopback-Adressen localhost, 127.0.0.1 oder [::1], keine eingebetteten Zugangsdaten, Queryparameter oder Weiterleitungen. Keine API-Key-Erweiterung.

--smoke führt genau V01/A einmal aus, in einem eigenen Ergebnisverzeichnis. Das prüft die grundlegende Anbindung, noch nicht alle Varianten. Der Probelauf zählt nicht zum vollständigen Vergleich. Die übrigen Eingaben sind im Dry-run-Plan sichtbar.

## 3. Vollständiger Vergleich

Erst nach Prüfung des Probelaufs und gesonderter Freigabe:

```sh
node --env-file-if-exists=.env scripts/compare-search-parser.mjs --run --model-label 'Tatsaechliches Modell und Quantisierung eintragen'
```

14 Fälle, drei Varianten, drei Wiederholungen, seriell. Die Variantenreihenfolge rotiert pro Fall/Wiederholung. Jeder Aufruf enthält einen frischen System-/User-Kontext. Keine Selbstkorrektur, keine automatische Reparatur und keine automatischen Wiederholungen. Ein Transport-/SDK-Fehler wird erfasst und stoppt den Lauf; fehlerhafte Modellantworten werden erfasst und der geplante Vergleich wird fortgesetzt. Ein Abbruch wird nicht automatisch fortgesetzt.

Das Ausgabelimit beträgt wie im aktuellen LLM-Aufruf 256 Tokens, Timeout 120000 ms, maxRetries 0. --max-output-tokens und --timeout-ms erlauben bewusste Abweichungen. --temperature ist optional; ohne Angabe wird keine Temperatur gesetzt. Alle Varianten verwenden identische Einstellungen. Nicht gesetzte SDK-/Serverdefaults sind nicht automatisch bekannt: vor dem Vergleich Serverkonfiguration einschließlich Quantisierung, Sampling und etwaigem Seed dokumentieren und unverändert lassen. Das Script erfindet keine effektiven Defaults. Ein geändertes Tokenlimit ist ein neuer dokumentierter Versuchsstand, keine automatische Reparatur.

## Ergebnisse

Jeder Start erzeugt ein neues Verzeichnis unter test-results/parser-comparison/ (bereits durch .gitignore ausgeschlossen):

- metadata.json: Modus, Zeit, Git-Stand/-Status, Quell-/Prompt-/Fixture-Hashes, Modellkonfiguration und angeforderte Einstellungen.
- plan.json: ausschließlich die abgeleiteten Modell-Eingaben mit Zuordnung zu Fall/Variante/Wiederholung.
- fixtures.json sowie baseline.txt/candidate.txt: genaue lokale Momentaufnahme für die Auswertung.
- responses.jsonl: pro Aufruf Rohtext, Finish-Grund, Tokenverbrauch, Warnungen, Vertragsprüfung und begrenzte automatische Kriterienprüfung.
- summary.json: Fortschritt und Anzahl ungültiger/abgeschnittener Antworten; erst bei Modellaufrufen vorhanden. Keine semantische Gesamt-Erfolgsquote.

Automatisch geprüft werden erlaubter Status sowie bei ready der resultierende synthetische Kriterienstand und erhaltene Felder. Redundante Edits werden getrennt erfasst. Rückfragen, Unsupported-Erklärungen, Bedeutungsabweichungen und Integrationslücken bleiben manuell zu bewerten. candidatePreferredStatus ist eine Zusatzbeobachtung, kein allgemeines Korrektheitskriterium. Eine gültige Antwort mit finishReason length bleibt als abgeschnitten markiert und darf nicht als unauffälliger Erfolg gewertet werden.

Exitcode 0: Dry-run erfolgreich oder alle Aufrufe ohne erkannten Vertrags-/Abschneidefehler beendet; das bedeutet keine semantische Abnahme. Exitcode 1: Start-, Datei- oder Transportfehler. Exitcode 2: abgeschlossener Lauf mit Vertrags-/JSON- oder Abschneidefehlern. Rohantworten und lokale Metadaten nicht ungeprüft veröffentlichen; Ergebnisse sind keine automatische Freigabe für Produktionsänderungen.
