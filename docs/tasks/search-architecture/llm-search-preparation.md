# LLM-Auftrag: Suchvorbereitung und kontextbezogene Interpretation

Stand: 20. November 2026. Vereinbarte Untersuchungsrichtung, keine bereits implementierte neue Parserarchitektur. Aktueller Produktionsprompt: Version `1.4.0` aus `d9f93fc`. Den implementierten Ablauf und Prüfstand beschreibt die [Arbeitsstandsübersicht](README.md).

## Anlass und beobachtete Ergebnisse

Die manuellen Versuche mit dem lokal verwendeten Modell `qwen3-coder-30b-a3b-instruct` zeigen:

| Prompt | Beobachtung | Aussagegrenze |
| --- | --- | --- |
| `1.2.1`, `830ddfb` | Im getesteten Filmfall wurden Titel und Jahr übernommen, die ausdrücklich genannte Medienart aber ausgelassen. | Die rohe Modellantwort enthielt keine Änderung auf `movie`. Die Kriterienübernahme war für diesen Aufruf nicht die Stelle des Verlusts. |
| `1.3.0`, `98b2f70` | Fokussierter Regeltext mit vier Beispielen: Film mit Jahr, Serie mit Jahr, Titel ohne Medienangabe und Rückfragefall mit Titel/Jahr wurden erfolgreich beobachtet. | Regeltext, Vertragsbeschreibung und Beispiele wurden gleichzeitig geändert. Der Erfolg lässt sich nicht allein den Beispielen zuschreiben. |
| `1.4.0`, `d9f93fc` | Regeltext aus `1.2.1` plus dieselben vier Beispiele: Film mit Jahr und anschließender Wechsel zu einer Serie mit anderem Jahr funktionierten. | Spricht für einen Nutzen der Beispiele auch mit dem längeren Regeltext; kein allgemeiner Zuverlässigkeitsnachweis. |
| `1.4.0`, weitere Folgeeingabe | Bei einem weiteren Titel ohne ausdrückliche Medien-/Jahresangabe wechselte `tv` auf `all`, das bisherige Jahr blieb erhalten; die Anwendung fragte nach dem Medientyp. | Beobachtetes Verhalten, keine beschlossene Regel für einen Themenwechsel. |

Frühe Wiederholungen vor dem lokalen Update zählen nicht als Beleg gegen die neue Promptfassung. Später wurden Commit und neue Regel lokal geprüft und erneut getestet. Rohlogs und reale Gesprächsverläufe werden hier nicht dauerhaft abgelegt; dokumentiert werden nur die für die Entwicklung nötigen Befunde.

## Erkenntnisse und offene Produktentscheidungen

- Beispiele sind ein sinnvoller Bestandteil der weiteren Erprobung. Einzelne erfolgreiche Durchläufe belegen weder deterministisches Verhalten noch eine allgemeine Überlegenheit einer Promptstrategie oder eines Modells.
- Explizite Angaben zu erkennen und nicht genannte Einschränkungen im Gespräch richtig fortzuführen sind unterschiedliche Aufgaben.
- Eine Änderung des Titeltexts allein beweist keinen Neustart: Eine Korrektur kann einen anderen Titel nennen und trotzdem die bisherigen Einschränkungen beibehalten sollen.
- Bei einem mehrdeutigen Themenwechsel ist noch nicht abschließend festgelegt, ob Einschränkungen fortgelten, zurückgesetzt oder erfragt werden. Frühere Diskussionsvorschläge zum automatischen Zurücksetzen sind kein Beschluss.
- Für eine eindeutige Korrektur soll nur die angesprochene Angabe geändert werden. Kriterien dürfen nicht anhand vermuteter Katalogfakten stillschweigend passend gemacht werden.
- Eine ausführbare Kombination garantiert keine Treffer. Ein leeres Ergebnis beweist weder eine falsche Interpretation noch die Erlaubnis, Kriterien automatisch zu lockern.

## Vereinbarte Richtung des neuen Auftrags

Das LLM soll helfen, mit den verfügbaren Suchmöglichkeiten eine passende Suche vorzubereiten, statt nur isolierte Felder zu extrahieren. Es soll aktuelle Eingabe, relevante vorherige Angaben und gegebenenfalls eine offene Frage berücksichtigen, unterstützte Kriterienänderungen vorschlagen und eine tatsächlich offene Entscheidung gezielt benennen.

Dazu werden drei Bestandteile getrennt entworfen:

1. Aufgabenbeschreibung und fachlich verständliche Suchmöglichkeiten, ohne Provider-Endpunktplanung durch das Modell.
2. Begrenzter relevanter Gesprächskontext. Kandidaten sind vorherige Nutzereingabe, bestätigte Kriterien, offene Frage und aktuelle Eingabe. Auswahl, Umfang, Lebensdauer und Löschung bei Reset sind noch zu vereinbaren; kein unbegrenzter Verlauf und keine dauerhafte Speicherung realer Gespräche.
3. Bestehender strukturierter Antwortvertrag für Änderungen, Klärungsbedarf und nicht unterstützte Wünsche.

Das LLM interpretiert Sprache und Gesprächsbezug. Die Anwendung validiert Vorschläge, übernimmt Kriterien, verwaltet Aufträge und Revisionen, löst Identitäten anhand von Providerdaten auf und führt unterstützte Suchen aus. Es entsteht keine serverseitige Regel-Engine, die freie Sprache erneut interpretiert.

`ready` bleibt ein Vorschlagsstatus, keine Ausführungsfreigabe. Das Modell darf keine Suchergebnisse erfinden und keine Einschränkungen nur deshalb entfernen, damit eine Suche ausführbar wird. Notwendige Rückfragen sollen nicht durch pauschales Abfragen optionaler Felder ersetzt werden.

## Aktuelle Fähigkeiten als Grundlage, nicht als universelle Fachregel

| Kriterien | Aktuelles Verhalten |
| --- | --- |
| Titel, `all`, ohne Jahr | Multi Search |
| Titel, `movie`, optional einzelnes Jahr | Movie Search |
| Titel, `tv`, optional einzelnes Jahr | TV Search |
| Titel, `all`, mit Jahr | Gebundene Medientyp-Frage; noch keine Treffersuche |
| Kein Titel | Aktuelle Titelstrecke nicht ausführbar; derzeit `missing_title`, kein allgemeiner Titel-Frageablauf implementiert |

Die Frage bei `all` plus Jahr ist eine bewusste Implementierungsgrenze des aktuellen Suchumfangs, keine grundsätzliche fachliche Notwendigkeit. Eine Zusammenführung getrennter Movie-/TV-Titellisten wird nicht eingeführt. `all` bleibt im Parserkontext und als erlaubter Wert erhalten; der Vorschlag, es aus dem Kontext zu entfernen, wurde verworfen.

Ein gemeinsamer Suchauftrag darf notwendige abhängige Provider-Schritte enthalten, beispielsweise Personenauflösung und anschließenden Credits-Abruf. Das ist nicht gleichbedeutend mit einer allgemeinen Zusammenführung paralleler Trefferlisten. Personen-/Credits-Suchwege sind damit weder implementiert noch als nächstes Codepaket beauftragt.

## Weiteres Vorgehen

1. Einen kurzen Entwurf für den neuen LLM-Auftrag, die beschriebenen Suchmöglichkeiten und den tatsächlich benötigten Kontext erstellen. Widersprüche zur serverseitigen Fähigkeitsprüfung vermeiden; eine gemeinsame technische Ableitung ist noch nicht implementiert.
2. Synthetische Vergleichsfälle und erwartete beziehungsweise zulässige Antworten vereinbaren. Bei echter Mehrdeutigkeit darf eine gezielte Rückfrage richtig sein; nicht nachträglich eine beliebige Interpretation als zwingend festlegen.
3. Einen begrenzten lokalen Parser-Vergleich ohne TMDb-Aufrufe und ohne Änderung des produktiven Sessionzustands vereinbaren. Durchführung und eventuelle Hilfsdateien benötigen einen gesonderten Umsetzungsschnitt. Bestehende Tests bleiben bis dahin unverändert.
4. Bestehenden und neuen Auftrag zunächst mit demselben Modell und dokumentierten Einstellungen vergleichen. Eingaben, Kontext, Promptversion und Kriterien zur Bewertung nachvollziehbar halten; einzelne Erfolge nicht als Abschluss werten.
5. Erst danach den geeigneten Auftrag und benötigten Kontext in den bestehenden Parserpfad integrieren. Vertragsänderungen nur bei nachgewiesenem Bedarf; kein vorsorglicher zweiter produktiver Parser, kein Agentenframework und keine automatische LLM-/Suchschleife.

Die Vergleichsfälle sollen mindestens eindeutigen Film/Serie, Titel ohne Medienangabe, Titel/Jahr ohne Medienangabe, reine Titelkorrektur mit erhaltenen Einschränkungen, ausdrücklichen Neustart, ausdrückliche Fortführung gleicher Bedingungen, Entfernung eines Jahres und einen mehrdeutigen Themenwechsel abdecken. Beispieltitel für den Prompt und Vergleichstitel sollen nicht ausschließlich identisch sein.

## Grenzen der nächsten Integration

Der vorhandene Änderungsvertrag kann Titel setzen, Medientyp setzen beziehungsweise auf `all` zurückstellen und ein Jahr mit `null` entfernen. Ein vollständiger Ersatz des Suchobjekts und Kategorien wie `new_search` oder `correction` sind nicht beschlossen.

Allgemeine LLM-Klärungsmeldungen werden noch nicht automatisch in gebundene, beantwortbare Fragen umgewandelt. Für einen Vergleich kann die Frage zunächst bewertet werden; eine produktive Integration muss Fragevertrag, Bindung und Antwortverarbeitung gesondert schließen. Die bestehende Medientyp-Auswahl ist kein allgemeiner Freitext-Klärungsablauf.

Aufträge, Revisionen, Sessionzuordnung und gemeinsame Ausführungsreservierung bleiben erhalten. Die CLI-Erweiterung für `clarify` und `execute` bleibt offen, ist aber nicht der unmittelbar nächste Umsetzungsschritt. Zunächst wird dieser Entwurf samt Vergleich konkretisiert.
