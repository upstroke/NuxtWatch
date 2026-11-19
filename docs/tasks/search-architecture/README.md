# Sucharchitektur – Arbeitsstand

Diese README ist der Einstieg für die Weiterarbeit, auch ohne Chatverlauf. Das [Architekturkonzept](../../sucharchitektur-konzept.md) beschreibt das Zielbild, die [Wizard-Spezifikation](../../clarificaton-wizzard-flow.md) den UI-Ablauf und die [Zielstruktur](zielstruktur.md) Pfade und Zuständigkeiten. Arbeitsstand und Abnahme pflegen wir hier.

## Stand: Bestandsaufnahme (A1) abgeschlossen

Die Zuordnung für den ersten Titelsuch-Durchstich steht. Abgeschlossen ist die Bestandsaufnahme, nicht die Implementierung. Die Prüfungen waren statisch; es gab keinen TMDb-Live-Aufruf und keinen Testlauf.

| Baustein | Befund und Entscheidung |
| --- | --- |
| Suchentscheidung | `server/services/search/llm.ts`, `parser.ts` und `coordinator.ts` wiederverwenden. `submitSearch` verbindet Parser und Koordinator, führt aber noch keine TMDb-Suche aus. |
| TMDb-Transport | `server/services/tmdb/http.ts` mit `get(path, query)` wiederverwenden. `trending.ts` ist ein Vorbild für Abruf, Zod-Validierung und Mapping, nicht der Vertrag für Suchantworten. |
| Titelsuchdienst und Rohantwort | `server/services/tmdb/title-search.ts` und einen eigenen Zod-Vertrag für die rohe Suchantwort neu anlegen. Für „The Matrix“ ohne Medientyp und Jahr zunächst `/search/multi` mit `query=The Matrix` verwenden. Der Endpunkt wurde anhand der TMDb-Dokumentation geprüft; den Live-Abgleich dem Durchstich zuordnen. |
| Trefferformat | `src/lib/schemas/ui/search-result-card.ts` wiederverwenden. Film und Serie auf gemeinsame Kartenfelder abbilden, insbesondere `title`/`name` und `release_date`/`first_air_date`; Personentreffer nicht ausgeben. |
| HTTP-Einstieg und Altaufrufer | `server/api/search.post.ts` neu anlegen. Unter `server/api/` wurde nur `tmdb/` vorgefunden. Für `/api/search/title/refine` wurde weder ein Handler noch ein Aufrufer gefunden; der Pfad taucht im geprüften Stand nur in der Dokumentation auf. Keine Migration für den Durchstich einplanen. |

### Testbestand und Lücken

| Zusicherung | Testebene | Vorhanden oder offen |
| --- | --- | --- |
| Transport liefert Rohdaten; der Dienst validiert und mappt; ungültige Antworten und Transportfehler bleiben unterscheidbar. | Unit | `tests/unit/services/tmdb-layers.spec.ts` prüft diese Trennung für Trending. Als Muster wiederverwenden. |
| Richtige `/search/multi`-Anfrage; Film- und Serientreffer werden normalisiert, Personentreffer ausgelassen; gültige leere Trefferliste und ungültige Antwort bleiben unterscheidbar. | Unit, Titelsuchdienst | Neu. |
| Direkt ausführbares `submit` liefert Treffer; eine offene Rückfrage startet keine Treffersuche. | HTTP-Integration | Neu. `tests/integration/http/detail.api.ts` und `trending.api.ts` sind vorhandene Referenzpfade, keine Abdeckung der gemeinsamen Suche. |

## Nächster Meilenstein: direkter Titelsuch-Durchstich

„The Matrix“ über den gemeinsamen HTTP-Einstieg bis zu TMDb-Treffern führen: einmal absenden, Treffer anzeigen, keine Rückfrage. Zuerst Titelsuchdienst und Rohantwortvertrag umsetzen, danach HTTP-Einstieg und CLI anbinden. Die interaktive CLI ist der erste Client für `POST /api/search` mit `submit`, `clarify` und `execute`. Sie zeigt Entscheidungen und Kriterien des Servers an, ohne eigene Suchweg- oder Klärungslogik. Die spätere Nuxt-Oberfläche nutzt denselben Vertrag.

Die [CLI-Abnahme](cli-abnahme.md) konkretisiert beide Fälle: „The Matrix“ für die direkte Suche und „The Office von 2005“ für die Suche mit Rückfrage. Im zweiten Fall zeigt die CLI die Vorauswahl, übernimmt die Antwort und zeigt die bestätigten Kriterien. Erst die ausdrückliche Aktion „Suche starten“ am ausführbaren Stand ruft `execute` auf. Neue automatisierte Tests schließen nach dem funktionierenden Durchstich und vor der Freigabe relevante Lücken gemäß [Teststrategie](../../testing.md). Die Bestandsaufnahme legt keine neuen Tests an.

## Merkpunkte aus dem früheren Entwurf

- Server, CLI und spätere UI verwenden dieselben fachlichen Werte, spiegeln aber nicht dieselbe Ordnerstruktur. Kriterien, HTTP-Requests und LLM-Vorschläge bleiben getrennte Verträge. Beispiel: `all`, `movie` und `tv` verwenden ein gemeinsames `mediaTypeSchema`; bei `{ field, value }` bestimmt das Feld das Werteschema. Ein LLM-Vorschlag ersetzt nie das gesamte Suchobjekt.
- Formale Gültigkeit, Freigabe einer Änderung für das LLM und fachliche Ausführbarkeit sind getrennte Prüfungen. Ein gültiger Wert ist weder automatisch als Modelländerung erlaubt noch auf jeder Suchstrecke ausführbar. Gekoppelte Änderungen werden gemeinsam übernommen oder nicht. Wie unabhängige Kriterien während einer offenen Klärung bestätigt und angezeigt werden, bleibt offen.
- Die spätere UI erhält einen Baustein pro Kriterium, nicht je einen für Film und Serie. Sie nutzt gemeinsame Werte, verantwortet aber Labels, Bedienung und Pills selbst. Für den CLI-Durchstich werden keine vorsorglichen UI-Dateien angelegt. Unter `tests/` gilt die Gliederung nach Verhalten und Testgrenze, kein Spiegel des Produktionsbaums.
- Alte Beispiele mit `POST /api/search/title` und `refine` erklären die ursprüngliche Aufgabentrennung, sind aber keine Vorlage für den freien Sucheinstieg. Dafür gilt der gemeinsame Vertrag mit `submit`, `clarify` und `execute`. TMDb-Aufrufe und Ergebnis-Mapping bleiben von der Suchkoordination getrennt; `server/services/tmdb/search/` ist kein belegter Iststand.

## Offen

- Läuft der erste Schnitt auf einer einzelnen Serverinstanz? Davon hängt die Wahl des kurzlebigen Auftragsspeichers ab.
- A2–A7 aus dem Konzept sind eine Orientierung, keine fest angelegten Tasks. Eine eigene Task-Datei entsteht erst für einen klar abgrenzbaren Schritt mit eigener Abnahme. Discovery, Genre-Katalog und Keyword-Auflösung blockieren den Titelsuch-Durchstich nicht.
