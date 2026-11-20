# Festgeschriebenes Vergleichspaket 0.1

Stand: 20. November 2026. Konkretisierung des [Entwurfs](../llm-search-preparation-draft.md) und der [Untersuchungsrichtung](../llm-search-preparation.md). Dieses Paket ist ein Evaluationsartefakt, kein produktiver Parser und keine Testsuite. Es startet keine Modell- oder Provideraufrufe.

## Dateien und Varianten

- [candidate-0.1.md](candidate-0.1.md): vollständiger Systemprompt für B und C, einschließlich der vier unveränderten Beispiele aus 1.4.0. Die gesamte Datei wird als Systemtext verwendet, ohne zusätzliche fallabhängige Hinweise.
- [cases-0.1.json](cases-0.1.json): 14 unabhängige Fälle, Fähigkeiten, Erwartungen und festgelegte Baseline.
- A verwendet den exportierten String PARSER_INSTRUCTIONS aus src/lib/parser/instructions.ts am Commit d9f93fc, nicht den TypeScript-Dateitext. B und C verwenden denselben Kandidaten.
- A/B erhalten ausschließlich currentFilters und capabilities im context sowie userText auf oberster Ebene. C erhält zusätzlich previousTurn und openQuestion.

## Eindeutige Ableitung der Modell-Eingaben

Die JSON-Datei ist ein Fallpaket, nicht selbst die Nachricht an das Modell. Für jeden Fall wird ein neues Objekt konstruiert:

```text
context.currentFilters = case.input.context.currentFilters
context.capabilities = package.capabilities
if variant C:
  context.previousTurn = case.input.context.previousTurn
  context.openQuestion = case.input.context.openQuestion
userText = case.input.userText
```

Diese Zuweisungen bedeuten Kopien ohne Mutation des Fallpakets. Fehlende Kriterien werden weggelassen, nicht auf null gesetzt. Alle Varianten erhalten identische Kriterien, Fähigkeiten und aktuelle Texte. Für A/B werden Kontextfelder weggelassen, nicht als null ergänzt. Das Objekt wird als JSON serialisiert und separat vom Systemprompt übergeben. IDs, expected, Baseline, Version und Wiederholungszahl gelangen niemals an das Modell.

## Kontextgrenzen

previousTurn ist null oder enthält genau userText und feedback.kind. Die festgelegten Werte sind completed (Suche technisch erfolgreich abgeschlossen, keine Aussage über vorhandene Treffer), not_executed und technical_error. Die Fälle verwenden nur die ersten beiden Werte. Keine Trefferlisten, Rohantworten oder Verlaufszusammenfassungen. Kontext ohne Vorgänger kann trotzdem bestätigte Kriterien enthalten.

openQuestion ist in allen 14 Fällen null. Für spätere Fälle ist ausschließlich die Form kind media_type, message und options mit value/label vorgesehen; zulässige Werte sind movie und tv. Diese Form ist keine neue produktive Frageinstanz. Die aktuelle Matrix untersucht weder nichtleere offene Fragen noch technischen Fehlerkontext. Keine Aussage über deren Wirksamkeit aus diesem Lauf ableiten. Produktive Lebensdauer, Längenlimits, Reset und Parallelitätsverhalten sind weiterhin gesondert zu entscheiden.

## Erwartungen und faire Bewertung

expected ist ausschließlich Auswertungsmetadaten. allowedStatuses gilt für alle Varianten gleich. Bei ready bezeichnet changes die vollständige erwartete Änderungsliste, unabhängig von der Reihenfolge; preservedFields dürfen auch vorher fehlende Kriterien nicht ergänzen. Redundante, zustandsneutrale Edits getrennt als Abweichung vom minimalen Kandidatenauftrag erfassen, nicht mit einer Bedeutungsänderung gleichsetzen. Bei needs_clarification oder unsupported gilt messageMeaning als inhaltliche Prüfanweisung, nicht als exakter Solltext. In diesen Antworten sind changes nach dem bestehenden Vertrag verboten.

In V04 und V12 sind zwei Abläufe zulässig. candidatePreferredStatus misst zusätzlich die Befolgung des neuen Auftrags, ist aber kein zusätzliches allgemeines Korrektheitskriterium. ready wird gegen die aufgeführten Änderungen geprüft, needs_clarification gegen messageMeaning. So wird die Baseline nicht allein wegen der Verlagerung einer Frage zum Modell abgewertet. Technische Integrierbarkeit und semantische Richtigkeit werden getrennt dokumentiert. Die bei Modellklärung unapplizierten Angaben sind eine bekannte Vertragslücke. V10 setzt dagegen für alle Varianten vorab die gezielte Rückfrage als Versuchserwartung fest.

Vertragsgültigkeit am bestehenden Vorschlagsvertrag prüfen. Änderungen danach nur auf einer lokalen Kopie der synthetischen Kriterien vergleichen, ohne produktive Sessionfunktionen und ohne TMDb. JSON-/Vertragsfehler, Bedeutungsfehler, unnötige Rückfragen und Integrationslücken getrennt ausweisen. Fragen nach Bedeutung, nicht nach exaktem Wortlaut bewerten; unwesentliche Titel-Großschreibung und Edit-Reihenfolge nicht als Bedeutungsfehler zählen. Keine automatische Selbstkorrektur oder Auswahl der besten Antwort.

## Umfang und Status

Geplant: 14 Fälle mal drei Varianten mal drei unabhängige Wiederholungen, insgesamt 126 Modellaufrufe. Wiederholungen jeweils ohne versteckten Nachrichtenverlauf; Variantenreihenfolge abwechseln. Vor einem gesondert freizugebenden Lauf Modell/Quantisierung, effektive Einstellungen, Defaults, Tokenlimit und Promptstände dokumentieren. Transportfehler und abgeschnittene Antworten separat erfassen. Eine kleine orientierende Untersuchung, keine statistische Zuverlässigkeitsabnahme.

Dieses Paket friert Prompt und Fälle für den geplanten Vergleich ein. Änderungen vor oder nach einem Lauf müssen nachvollziehbar versioniert werden; keine Anpassung der Erwartungen nach Sichtung der Antworten. Es gibt noch kein Vergleichsscript und keine Ergebnisse. Produktionsprompt, Parser, Sessionverwaltung, CLI und Tests bleiben unverändert. Keine Checks oder Modellaufrufe wurden durch diesen Dokumentationsschritt ausgeführt.
