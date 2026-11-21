# Sucharchitektur – Arbeitsstand

Stand: 21. November 2026. Branch: `feat/shared-search-architecture`. Zuletzt hier dokumentierte Implementierung: `4c7bea0`.

Diese Übersicht beschreibt den Arbeitsstand und ersetzt abweichende ältere Implementierungsangaben in den verlinkten Dokumenten. Zielabläufe sind nicht automatisch implementiert.

## Dokumente

- [Aktuelle Gemma-Live-Tests und Übergabe](gemma-clarification-2026-11-21.md)
- [Architekturkonzept](../../sucharchitektur-konzept.md)
- [LLM-Suchvorbereitung](llm-search-preparation.md), [Entwurf](llm-search-preparation-draft.md)
- [Festgeschriebenes Vergleichspaket](parser-comparison/README.md), [Durchführung](parser-comparison/RUNNING.md), [Qwen-Ergebnis](parser-comparison/results-qwen-2026-11-20.md)
- [Zielstruktur](zielstruktur.md), [Interaktionsentscheidungen](interaction-state-decisions.md), [Session und Auftrag](session-request-decision.md)
- [CLI-Abnahme](cli-abnahme.md), [HTTP-Schnitt](http-submit.md), [direkte CLI](cli-direkt.md)
- [Testinventur](test-inventory.md), [Rückfrage-Task](clarification-flow.md)
- [Wizard-Skizze](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog-Skizze](../../ideas/translation-catalog.md)

## Aktueller Implementierungsstand

- Sessions und bestätigte Kriterien liegen prozesslokal. Die Session-Map hat 30 Minuten Inaktivitätsfrist und höchstens 1.000 Sessions; keine instanzübergreifende oder neustartfeste Garantie.
- Aufträge, Revisionen und Fragebindungen schützen die Übernahme vor veralteter Verarbeitung. Externe laufende Aufrufe werden nicht technisch abgebrochen.
- Bestätigte Revisionen können ausdrücklich mit `execute` ohne erneute LLM-Interpretation ausgeführt werden (`225b368`). Submit und Execute teilen die Ausführungsreservierung. Laufende oder erfolgreiche Ausführungen derselben Revision starten nicht erneut; nach technischem Fehler ist ein ausdrücklicher neuer Versuch möglich.
- Titelwege: `all` ohne Jahr über Multi Search, `movie` optional mit Einzeljahr über Movie Search, `tv` optional mit Einzeljahr über TV Search. `all` mit Jahr erfordert Medientypklärung. Providerantworten werden validiert, Personentreffer aus Multi Search ausgelassen; `include_adult=true` ist gesetzt.
- Parseränderungen sind auf `title`, `mediaType` und `year` begrenzt. `ready` ist ein Vorschlag, keine Ausführungserlaubnis. Die Anwendung validiert und übernimmt Kriterien und verwaltet Bindungen und Ausführung.
- Die CLI unterstützt `/reset`, `/execute`, `/submit TEXT`, `/select NUMMER` und `/exit`. Normaler Text bei offener Frage ist eine gebundene Klärungsantwort, sonst ein neuer Submit. Kein automatischer Folgeaufruf.
- Gebundene LLM-Freitextklärungen erhalten ursprünglichen ungeklärten Suchwunsch, bisherigen Klärungsverlauf, aktuelle Frage, aktuelle Antwort und bestätigte Kriterien. Das ist begrenzter auftragsbezogener Klärungskontext, kein vollständiger Chatverlauf.
- `c585f4f` ergänzte den festen Klärungsauftrag. `4c7bea0` stellt nur die Klärungseingabe auf beschriftete Textabschnitte um; normale Submit-Eingaben bleiben JSON. Kriterien und Fähigkeiten stehen innerhalb der Textübergabe weiterhin als JSON. LLM-Ausgabe und Schema bleiben unverändert JSON.
- Zuletzt eingesehener Hauptprompt: `PARSER_INSTRUCTIONS_VERSION = 1.5.1`, Texttitel „Search preparation candidate 0.1“. Klärungszusatz seit `4c7bea0`: `1.1.0`. Die ältere Aussage, der Kandidat sei nicht integriert, beschreibt nicht mehr diesen Stand. Ein kontrollierter vollständiger Gemma-Vergleich ist dadurch nicht nachgewiesen.

## Prüfstand

- Nutzer bestätigt am 21. November: Typecheck und Lint nach der Textumstellung erfolgreich. Nicht durch den Assistant ausgeführt.
- Vier gepostete erfolgreiche Live-Durchläufe nach Textumstellung: zweimal „ich meine den Film“, einmal „Film“, einmal „Die Serie bitte“. Titel und Jahr bleiben erhalten; Medientyp korrekt; `ready`, keine Titelrückfrage, keine automatische Suche. Details und Grenzen in der [Testnotiz](gemma-clarification-2026-11-21.md).
- Gemma-API-ID durch Serverantwort bestätigt: `google_gemma-4-26b-a4b-it`. Der gezeigte Serienaufruf enthält null Reasoning-Tokens, gültiges JSON und `finish_reason: stop`.
- Keine neue automatisierte Testsuite ausgeführt oder ergänzt. Die manuellen Prüfungen nehmen Parallelität, Revisionsbindung, Reservierung, Reset-Rennen und Fehlerwiederholung nicht vollständig ab. Bestehende Multi-Search-Testerwartungen zu `include_adult` bleiben zu prüfen.
- Historische manuelle Providerprüfungen und der Qwen-Parservergleich sind keine Abnahme der aktuellen Klärungsstrecke. Qwen-Vergleich: 126 Aufrufe, vier ungültige Antworten nur in A, keine Tokenlimit-Abschneidungen; V10 in keiner Variante wie gewünscht, Zusatzkontext ohne erkennbaren Nutzen. Details in der verlinkten Qwen-Ergebnisnotiz.

## Nächste Arbeit und Grenzen

1. Modelleinstellungen für reproduzierbare Vergleiche erfassen: genaue geladene Datei, Kontextlänge, Sampling, Thinking-Konfiguration. Die API-ID ist bereits bestätigt und muss nicht erneut erfragt werden.
2. Bei weiterer Fehlersuche tatsächliche ausgehende Requests und Rohantworten lokal erfassen; bisher liegt für die Fehlerläufe keine solche Aufzeichnung vor. Keine ungefragte dauerhafte Protokollierung sensibler Inhalte.
3. Weitere gebundene Klärungen und Korrekturen gezielt prüfen. Thinking vorerst nicht zusätzlich verändern; die erfolgreichen Aufrufe begründen keinen Bedarf dafür.
4. Den vollständigen zweiten Modellvergleich mit unverändertem eingefrorenem Vergleichspaket gesondert durchführen. Die Gemma-Live-Tests sind kein Ersatz und kein kontrollierter JSON-vs.-Text-Vergleich.
5. HTTP-/CLI-, Revisions-, Parallelitäts-, Reservierungs- und Klärungstests später nach [Teststrategie](../../testing.md) ergänzen; keine neue Testfreigabe durch diese Dokumentation.

Keine neue allgemeine Kontextverwaltung, keine Vertragsausweitung, keine State-Machine-Bibliothek oder zweite Sprach-Regel-Engine. Jahresbereiche, Discovery, Genre, Personen-/Keyword-Auflösung und Web-UI bleiben spätere Arbeit. Vor öffentlichem Hosting Zugriffsschutz und Ressourcenlimits klären.
