# Sucharchitektur – Arbeitsstand

Diese README ist der Einstieg für die Weiterarbeit, auch ohne Chatverlauf. Siehe [Architekturkonzept](../../sucharchitektur-konzept.md), [Wizard-Spezifikation](../../clarificaton-wizzard-flow.md), [Zielstruktur](zielstruktur.md), [CLI-Abnahme](cli-abnahme.md) und [Testinventur](test-inventory.md).

## Stand am 19. November 2026

Branch: `feat/shared-search-architecture`.

- Bestandsaufnahme A1 abgeschlossen. Titelsuchdienst und Rohantwortvertrag sind umgesetzt: `server/services/tmdb/title-search.ts` ruft `/search/multi` auf, validiert die Antwort und normalisiert Film- und Serientreffer; Personen werden ausgelassen.
- `submitAndSearch` in `server/services/search/submit.ts` verbindet Parser, Koordinator und Titelsuchdienst. Commit: `68de6a6`.
- Direkt unterstützt: Titel mit `mediaType: all` ohne Jahr. Rückfragen und Ablehnungen starten keine TMDb-Suche. Technisch nicht unterstützte Kriterien werden ausdrücklich abgelehnt, nicht stillschweigend entfernt.
- Tests nach Verhalten und Grenze getrennt: Koordinator und Parser als Unit-Tests, gemeinsamer Ablauf als kontrollierte Integration unter `tests/integration/tmdb`. Testinventur ergänzt; doppelte Mapping- und Transportfehlerprüfungen aus der Ablauf-Suite entfernt. Commit: `08757a2`.
- Der Nutzer hat am 19. November lokal bestätigt: Tests grün, Typecheck und Lint in Ordnung. Kein neuer Coverage-Wert gemeldet. Dies ersetzt nicht den noch offenen Live-Abgleich mit LM Studio und TMDb. Historische Nicht-ausgeführt-Vermerke in der Testinventur beziehen sich auf den Erstellungszeitpunkt.
- Für den Durchstich läuft das Modell lokal über LM Studio. Runtime-Konfiguration bleibt unverändert; gehostete Anbieter und API-Key-Erweiterungen sind jetzt kein Arbeitspaket. Langfristiges Ziel bleibt eine hostbare WebApp.

## Nächster Schritt

`POST /api/search` als dünnen Nitro-Handler anbinden: Request mit Zod validieren, vorhandene serverseitige Konfiguration und externen Transport bereitstellen, an den Suchablauf delegieren, Ergebnis und Fehler abbilden. Zuerst den direkten Fall „The Matrix“ bis zu echten Treffern schließen, danach die CLI anschließen. Die spätere Nuxt-Oberfläche verwendet denselben gemeinsamen Vertrag.

Die kleine noch offene Präzisierung von Testtitel und Inventur zu `SEARCH-SUBMIT-INT-005` ist kein bekannter Funktionsfehler: Der Test bestätigt die Ablehnung der Kombination aus konkretem Medientyp und Jahr, isoliert aber nicht die Jahresprüfung. Keine weitere große Test-Umbauphase; bei Gelegenheit korrekt benennen.

## Verbindliche Leitplanken

- Das LLM schlägt Interpretationen und Änderungen vor; die Anwendung entscheidet über Suchstrecke, Voraussetzungen und TMDb-Aufruf. Bestätigte Kriterien werden nicht stillschweigend weggelassen.
- Ohne Klärungsbedarf führt der erste Suchklick die ausführbare Suche aus. Bei Klärungsbedarf wird geklärt; danach startet nichts automatisch. Erst eine erneute ausdrückliche Suchaktion führt aus. Gemeinsamer Zielvertrag: `submit`, `clarify`, `execute`.
- Suchsession, bestätigte Kriterien, offene Klärungen und laufende Requests bleiben getrennt. Keine globale `pending`-Phase. Verspätete Antworten dürfen weder neuere Kriterien überschreiben noch doppelt ausführen.
- Tests gemäß [Teststrategie](../../testing.md): Zusicherung und passende Grenze bestimmen, bestehende Tests wiederverwenden, keine doppelten Fallmatrizen und keine Coverage-Ziele pro Datei.

## Offen und später

- HTTP-Vertrag und Fehlerabbildung konkretisieren; HTTP-Integration und manueller Live-Abgleich stehen aus. HTTP-Tests sollen nicht die komplette interne Testmatrix wiederholen.
- Auftragsbindung, Revisionen und kurzlebiger Auftragsspeicher für `clarify`/`execute`; insbesondere klären, ob der erste Schnitt auf einer einzelnen Serverinstanz läuft.
- Bestätigung und Anzeige unabhängiger Kriterien während einer offenen Klärung.
- Kein Handler oder Aufrufer für den alten Pfad `/api/search/title/refine` wurde in A1 gefunden; keine vorsorgliche Migration einplanen.
- Discovery, Genre-Katalog, Keyword-Auflösung und UI-Ausbau blockieren den direkten Titelsuch-Durchstich nicht.
