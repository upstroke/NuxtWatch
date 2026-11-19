# Sucharchitektur – Arbeitsstand

Diese README ist der Einstieg für die Weiterarbeit, auch ohne Chatverlauf. Das [Architekturkonzept](../../sucharchitektur-konzept.md) beschreibt das Zielbild, die [Wizard-Spezifikation](../../clarificaton-wizzard-flow.md) den UI-Ablauf. Arbeitsstand und Abnahme pflegen wir hier.

## Jetzt: Bestandsaufnahme (A1)

- [ ] A1 – Bestandsaufnahme für den ersten Titelsuch-Durchstich. Auf `feat/shared-search-architecture` ergab die bisherige GitHub-Verzeichnisprüfung: `server/api` enthält `tmdb/` mit Einträgen für Film, TV und Trending; `server/api/search` wurde nicht gefunden. `POST /api/search` ist Zielbild, kein belegter Iststand. Eine Migration von `/api/search/title/refine` ist nur nötig, wenn eine vorhandene Implementierung oder ein Aufrufer nachgewiesen wird.
- Nächster Schritt: Titel- und TMDb-Dienste, Adapter, Zod-Verträge, mögliche Aufrufer und relevante Tests mit Pfad oder Commit erfassen. Je Fundstelle festhalten: wiederverwenden, anpassen oder neu anlegen. Für Tests genügt eine Übersicht: Zusicherung → Testebene → vorhandener Test oder Lücke.
- Abschluss: A1 abhaken, sobald die Zuordnung vorliegt und offene Fragen beantwortet oder dem nächsten Schritt zugeordnet sind. Ergebnis, Belege und nächsten Schritt hier notieren. Die CLI muss dafür noch nicht implementiert sein.

## Entschieden: erster Durchstich

Die interaktive CLI ist der erste Client für `POST /api/search` mit `submit`, `clarify` und `execute`. Sie zeigt die Entscheidungen und Kriterien des Servers an, ohne eigene Suchweg- oder Klärungslogik. Die spätere Nuxt-Oberfläche soll denselben Vertrag nutzen.

1. Direkt ausführbare Titelsuche: einmal absenden, Treffer anzeigen, keine Rückfrage.
2. Titelsuche mit Rückfrage: Vorauswahl anzeigen, Antwort übernehmen, Kriterienübersicht anzeigen. Die Übernahme startet keine Suche. Erst die ausdrückliche Aktion „Suche starten“ am ausführbaren Stand ruft `execute` auf.

Neue automatisierte Tests schließen nach dem funktionierenden Durchstich und vor der Freigabe relevante Lücken gemäß [Teststrategie](../../testing.md). Die Bestandsaufnahme legt keine neuen Tests an.

## Merkpunkte aus dem früheren Entwurf

- Server, CLI und spätere UI verwenden dieselben fachlichen Werte, spiegeln aber nicht dieselbe Ordnerstruktur. Kriterien, HTTP-Requests und LLM-Vorschläge bleiben getrennte Verträge. Beispiel: `all`, `movie` und `tv` verwenden ein gemeinsames `mediaTypeSchema`; bei `{ field, value }` bestimmt das Feld das Werteschema. Ein LLM-Vorschlag ersetzt nie das gesamte Suchobjekt.
- Formale Gültigkeit, Freigabe einer Änderung für das LLM und fachliche Ausführbarkeit sind getrennte Prüfungen. Ein gültiger Wert ist weder automatisch als Modelländerung erlaubt noch auf jeder Suchstrecke ausführbar. Gekoppelte Änderungen werden gemeinsam übernommen oder nicht; unabhängige bestätigte Kriterien können während einer Klärung bereits angezeigt werden.
- Die spätere UI erhält einen Baustein pro Kriterium, nicht je einen für Film und Serie. Sie nutzt gemeinsame Werte, verantwortet aber Labels, Bedienung und Pills selbst. Für den CLI-Durchstich werden keine vorsorglichen UI-Dateien angelegt. Unter `tests/` gilt die Gliederung nach Verhalten und Testgrenze, kein Spiegel des Produktionsbaums.
- Alte Beispiele mit `POST /api/search/title` und `refine` erklären die ursprüngliche Aufgabentrennung, sind aber keine Vorlage für den freien Sucheinstieg. Dafür gilt der gemeinsame Vertrag mit `submit`, `clarify` und `execute`. TMDb-Aufrufe und Ergebnis-Mapping bleiben von der Suchkoordination getrennt; der im Entwurf genannte Ordner `server/services/tmdb/search/` ist kein belegter Iststand.

## Offen

- Welche konkreten Eingaben eignen sich für die beiden Abnahmefälle? Die Antwort folgt aus den nachgewiesenen Fähigkeiten der Titelstrecke.
- Läuft der erste Schnitt auf einer einzelnen Serverinstanz? Davon hängt die Wahl des kurzlebigen Auftragsspeichers ab.
- Der Arbeitszuschnitt bleibt flexibel. A1 kann bei Bedarf erweitert werden. A2–A7 aus dem Konzept sind eine Orientierung, keine fest angelegten Tasks. Eine eigene Task-Datei entsteht erst für einen klar abgrenzbaren Schritt mit eigener Abnahme. Discovery, Genre-Katalog und Keyword-Auflösung blockieren den Titelsuch-Durchstich nicht.
