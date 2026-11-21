# Sucharchitektur – Arbeitsstand

Stand: 21. November 2026, nach JSON-Gegencheck. Branch: `feat/shared-search-architecture`. Zuletzt hier dokumentierte Implementierung: `81dc0e8`.

Diese Übersicht beschreibt den Arbeitsstand und ersetzt abweichende ältere Implementierungsangaben in den verlinkten Dokumenten. Zielabläufe sind nicht automatisch implementiert.

## Dokumente

- [Gemma-Live-Tests: Textphase, aktueller JSON-Stand und Übergabe](gemma-clarification-2026-11-21.md)
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
- `c585f4f` ergänzte den festen Klärungsauftrag; `4c7bea0` erprobte beschriftete Textabschnitte. Seit `81dc0e8` sind normale und Klärungseingaben wieder vollständig JSON: `context` und `userText`, bei Klärung zusätzlich `context.originalUserText`, `context.clarificationTurns` und `context.openQuestion.message`. Der feste Systemauftrag bleibt separat.
- `81dc0e8` behält die Interpretationsregeln und das Beispiel der Textphase bei; geändert sind Eingabedarstellung und formatbezogene Feldbeschreibungen. Kein Rücksetzen auf den älteren Promptstand. JSON-Ausgabeschema, Validierung und Modelleinstellungen bleiben unverändert.
- Zuletzt eingesehener Hauptprompt: `PARSER_INSTRUCTIONS_VERSION = 1.5.1`, Texttitel „Search preparation candidate 0.1“. Klärungszusatz seit `81dc0e8`: `1.1.1`. Die ältere Aussage, der Kandidat sei nicht integriert, beschreibt nicht mehr diesen Stand. Ein kontrollierter vollständiger Gemma-Vergleich ist dadurch nicht nachgewiesen.

## Prüfstand

- Nutzer bestätigt am 21. November: Typecheck und Lint nach der Textumstellung erfolgreich. Für `81dc0e8` ist noch keine erneute ausdrückliche Checkbestätigung dokumentiert. Nicht durch den Assistant ausgeführt.
- Textphase: vier gepostete erfolgreiche Live-Durchläufe, zweimal „ich meine den Film“, einmal „Film“, einmal „Die Serie bitte“.
- Aktueller JSON-Stand: drei gepostete erfolgreiche Durchläufe nach jeweils `/reset` und „Finde Morgenbogen von 1999“: „Ich meine den Film“ ergibt movie/1999, „ich meine die Serie“ tv/1999, „ich meine den Film von 2001“ movie/2001. Titel jeweils erhalten; `ready`, keine Titelrückfrage und keine automatische Suche. Keine drei Wiederholungen desselben Falls. Details in der [Testnotiz](gemma-clarification-2026-11-21.md).
- Gemma-API-ID durch Serverantwort aus der Textphase bestätigt: `google_gemma-4-26b-a4b-it`. Dieser Serienaufruf enthält null Reasoning-Tokens, gültiges JSON und `finish_reason: stop`. Die JSON-Gegenchecks liegen als CLI-Ausgaben vor, ohne neue Modell-Metadaten.
- Keine neue automatisierte Testsuite ausgeführt oder ergänzt. Die manuellen Prüfungen nehmen Parallelität, Revisionsbindung, Reservierung, Reset-Rennen und Fehlerwiederholung nicht vollständig ab; `/execute` wurde in diesen sieben Durchläufen nicht geprüft. Bestehende Multi-Search-Testerwartungen zu `include_adult` bleiben zu prüfen.
- Historische manuelle Providerprüfungen und der Qwen-Parservergleich sind keine Abnahme der aktuellen Klärungsstrecke. Qwen-Vergleich: 126 Aufrufe, vier ungültige Antworten nur in A, keine Tokenlimit-Abschneidungen; V10 in keiner Variante wie gewünscht, Zusatzkontext ohne erkennbaren Nutzen. Details in der verlinkten Qwen-Ergebnisnotiz.

## Nächste Arbeit und Grenzen

1. Format-Gegencheck vorerst abschließen, aktuellen JSON-Stand beibehalten und gemäß Nutzerwunsch zur Architekturarbeit zurückkehren. Keine weitere Format-, Prompt- oder Thinking-Optimierungsrunde als unmittelbarer Folgeschritt. Architekturstand und nächste konkrete Änderung anhand der verlinkten Architektur-/Interaktionsdokumente klären; keine neue Codefreigabe durch diese Notiz.
2. Offene technische Absicherung: HTTP-/CLI-, Revisions-, Parallelitäts-, Reservierungs- und Klärungstests später nach [Teststrategie](../../testing.md) ergänzen; Ausführung nach Klärung und mehrstufige Klärungen bleiben gesondert zu prüfen.
3. Für spätere reproduzierbare Vergleiche genaue geladene Datei, Kontextlänge, Sampling und Thinking-Konfiguration erfassen. Die API-ID ist bereits bestätigt. Bei erneuten Fehlern tatsächliche Requests und Rohantworten lokal erfassen; für die alten Fehlerläufe fehlen diese. Keine ungefragte dauerhafte Protokollierung sensibler Inhalte.
4. Der vollständige zweite Modellvergleich mit unverändertem eingefrorenem Paket bleibt offen, ist aber nicht Voraussetzung für die nächste Architekturarbeit. Die Live-Tests sind kein Ersatz und kein statistisch belastbarer JSON-vs.-Text-Vergleich. Rohdaten möglichst lokal aufbewahren.

Keine neue allgemeine Kontextverwaltung, keine Vertragsausweitung, keine State-Machine-Bibliothek oder zweite Sprach-Regel-Engine. Jahresbereiche, Discovery, Genre, Personen-/Keyword-Auflösung und Web-UI bleiben spätere Arbeit. Vor öffentlichem Hosting Zugriffsschutz und Ressourcenlimits klären.
