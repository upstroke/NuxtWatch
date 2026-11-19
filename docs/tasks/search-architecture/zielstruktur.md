# Zielstruktur der gemeinsamen Suche

Diese Übersicht hält fest, wo welche Entscheidung hingehört. Die Titelsuche ist der erste Durchstich, nicht die Vorlage für getrennte Parser pro Suchstrecke. Siehe [Arbeitsstand](README.md), [Architekturkonzept](../../sucharchitektur-konzept.md) und [CLI-Abnahme](cli-abnahme.md).

| Status | Pfad | Zuständigkeit |
| --- | --- | --- |
| Vorhanden | `src/lib/parser/instructions.ts` | Versionierte Systemanweisungen. Nutzerdaten bleiben getrennt. |
| Vorhanden | `server/services/search/llm.ts` | Modellaufruf mit separater Systemanweisung und Nutzernachricht; keine Suchlogik. |
| Vorhanden | `server/services/search/parser.ts` | Gemeinsamer Einstieg `parseSearchProposal`. Erzeugt und validiert streckenoffene Vorschläge. Der erste Vertrag erlaubt Titel, Medientyp und Jahr; daraus folgt kein eigener Titelparser. |
| Vorhanden / zu ergänzen | `server/services/search/coordinator.ts` | `submitSearch` übernimmt validierte Änderungen. `decideSearch` entscheidet für die Titelsuche, ob sie ausführbar ist, eine Klärung braucht oder nicht unterstützt wird. Die Bindung von Rückfragen an den konkreten Auftrag ist noch offen. Der Koordinator führt keine TMDb-Aufrufe aus. |
| Geplant: erster Durchstich | `server/api/search.post.ts` | Gemeinsamer HTTP-Einstieg für `submit`, `clarify` und `execute`; keine eigene Suchweglogik. Die CLI ist der erste Client, ihr Dateipfad bleibt offen. |
| Vorhanden / zu ergänzen | `server/services/tmdb/` | Vorhandenen Transport in `http.ts` nutzen; Titelaufrufe und Treffer-Mapping ergänzen. Der Adapter setzt den gewählten Suchweg technisch um; er entscheidet nicht, was der Nutzer gemeint hat. |
| Vorhanden | `src/lib/schemas/ui/search-result-card.ts` | Normalisierte Karten für Film- und Serientreffer; kein Modellvorschlags- oder HTTP-Eingabevertrag. |

## Grenzen für die Weiterarbeit

- Gemeinsame Methoden sind der Standard. Eigene Methoden kommen erst hinzu, wenn tatsächlich unterschiedliches Verhalten sie erfordert. Film und Serie brauchen beispielsweise keinen eigenen Parser; ihre unterschiedlichen Jahresparameter gehören zur TMDb-Ausführung.
- Kriterien, HTTP-Verträge und Modellvorschläge bleiben getrennt. Gemeinsame fachliche Werte sollen nicht pro Schicht neu definiert werden. Ein gültiger Modellvorschlag ist weder eine Bestätigung noch ein ausführbarer Suchauftrag.
- Direkt ausführbare Suchen können bei `submit` starten. Nach einer Rückfrage übernimmt `clarify` nur die Auswahl; erst das ausdrückliche `execute` startet die Suche. Bestätigte Kriterien, offene Klärung und laufende Requests bleiben getrennt.
- Discovery, Genre-Katalog und Keyword-Auflösung sind spätere Anwendungsfälle, keine vorab festgelegten Parser oder Methoden. Wenn ein Zielpfad vor der Implementierung sichtbar sein muss, kann eine kurze README seine Zuständigkeit festhalten. Geplante Pfade sind kein Iststand.
