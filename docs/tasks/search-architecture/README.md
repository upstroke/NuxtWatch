# Sucharchitektur – Arbeitsstand

Einstieg für die Weiterarbeit ohne Chatverlauf. Siehe [Architekturkonzept](../../sucharchitektur-konzept.md), [Wizard-Spezifikation](../../clarificaton-wizzard-flow.md), [Zielstruktur](zielstruktur.md), [CLI-Abnahme](cli-abnahme.md), [Testinventur](test-inventory.md), [HTTP-Schnitt](http-submit.md) und [direkte CLI](cli-direkt.md).

## Stand am 20. November 2026

Branch: `feat/shared-search-architecture`.

Der direkte Titelsuch-Durchstich ist implementiert und vom Nutzer über HTTP sowie CLI live bestätigt:

```text
CLI → POST /api/search → LLM-Parser → Koordinator → TMDb-Titelsuchdienst → CLI
```

### Implementiert

- Bestandsaufnahme A1 abgeschlossen. `server/services/tmdb/title-search.ts` ruft `/search/multi` auf, validiert die Rohantwort und normalisiert Film- und Serientreffer; Personen werden ausgelassen.
- `submitAndSearch` in `server/services/search/submit.ts` verbindet Parser, Koordinator und Titelsuchdienst (`68de6a6`). Direkt unterstützt: Titel mit `mediaType: all` ohne Jahr. Rückfragen und Ablehnungen starten keine Treffersuche; nicht unterstützte Kriterien werden nicht stillschweigend entfernt.
- Tests nach Verhalten und Grenze getrennt: Koordinator und Parser als Unit-Tests, gemeinsamer Ablauf als kontrollierte Integration unter `tests/integration/tmdb`. Testinventur ergänzt, doppelte Mapping- und Transportfehlerprüfungen aus der Ablauf-Suite entfernt (`08757a2`).
- `server/api/search.post.ts` und der Zod-Request-Vertrag in `src/lib/schemas/search-request.ts` stellen `submit` bereit (`23e349b`). Ohne Kriterien gilt `mediaType: all`. Sichere Fehlerabbildung und `Cache-Control: no-store`; TMDb-Redirects werden verweigert. Noch keine serverseitige Session oder Auftragsbindung.
- `scripts/search.mjs` ist der erste interaktive HTTP-Client (`981e487`). Er zeigt Serverkriterien, Ergebnisse und Entscheidungen als JSON, übernimmt den letzten gültigen Server-Kriterienstand für die nächste Eingabe und bietet `/reset` sowie `/exit`. Keine eigene Suchweglogik und kein automatischer Folgeaufruf. Eine weitere Texteingabe ist derzeit ein neuer `submit`, keine gebundene Klärungsantwort.
- Das Modell läuft lokal über LM Studio. Runtime-Konfiguration unverändert; gehostete Anbieter und API-Key-Erweiterungen sind kein aktuelles Arbeitspaket. Langfristiges Ziel bleibt eine hostbare WebApp.

### Bestätigte Prüfungen und Grenzen

- Am 19. November meldete der Nutzer Tests, Typecheck und Lint lokal grün. Diese Meldung gilt für den damaligen Stand vor den HTTP- und CLI-Erweiterungen; für die neueren Commits liegt keine erneute vollständige Check-Bestätigung vor.
- Am 20. November bestätigte der Nutzer den HTTP-Live-Aufruf „Finde The Matrix“: HTTP 200, `Cache-Control: no-store`, `status: completed`, Kriterien `mediaType: all` und `title: The Matrix`, normalisierte Treffer einschließlich Film-ID 603.
- Anschließend bestätigte der Nutzer den CLI-Live-Durchlauf: dieselben Kriterien und 20 Treffer in der empfangenen Antwort, darunter Film-ID 603. Dies ist keine feste erwartete Trefferzahl und keine Aussage über sämtliche TMDb-Seiten.
- Damit ist der direkte Erfolgsfall mit lokalem Modell und TMDb live bestätigt. Rückfragefortsetzung, Reset, Fehlerverhalten und HTTP-Integrationstests sind dadurch nicht vollständig abgenommen. Frühere Offen-Vermerke zum direkten Live-Abgleich in den verlinkten Schritt-Dokumenten beschreiben den Stand bei deren Erstellung und werden durch diese Rückmeldung aktualisiert.
- `llm.ts` hat laut Nutzerbericht weiterhin 0 % Coverage. Nutzerentscheidung vom 20. November: jetzt keine Tests dafür ergänzen. Kein Coverage-Ziel pro Datei; globaler Mindestwert unverändert. Ein aktueller globaler Coverage-Wert liegt nicht vor.

## Nächster Durchstich: The Office von 2005

Ziel gemäß [CLI-Abnahme](cli-abnahme.md): `submit` stellt die Frage nach Film oder Serie, `clarify` übernimmt „Serie“ ohne Treffersuche, erst die ausdrückliche Aktion „Suche starten“ sendet `execute`. Dafür TV-Titelsuche mit `query=The Office` und `first_air_date_year=2005` ergänzen und anschließend die CLI erweitern.

Noch nicht implementiert und noch keine beschlossene technische Ausgestaltung: Auftragsbindung, Revisionen, Fragenkennung und Auftragsspeicher. Als nächster Entwurf wurden `searchId`, `revision`, `questionId` sowie ein begrenzter, kurzlebiger In-Memory-Speicher auf einer Serverinstanz vorgeschlagen. Diese Vorschläge vor der Umsetzung konkretisieren; Single-Instance-Annahme und Speicherlebensdauer nicht als bereits entschieden behandeln.

## Verbindliche Leitplanken

- Das LLM schlägt Interpretationen und Änderungen vor; die Anwendung entscheidet über Suchstrecke, Voraussetzungen und TMDb-Aufruf. Bestätigte Kriterien nicht stillschweigend weglassen.
- Ohne Klärungsbedarf startet die erste ausdrückliche Suchaktion die ausführbare Suche. Nach einer Klärung startet nichts automatisch; erst eine erneute ausdrückliche Suchaktion führt aus. Gemeinsamer Zielvertrag: `submit`, `clarify`, `execute`.
- Suchsession, bestätigte Kriterien, offene Klärungen und laufende Requests bleiben getrennt. Keine globale `pending`-Phase. Verspätete Antworten dürfen weder neuere Kriterien überschreiben noch doppelt ausführen.
- Tests gemäß [Teststrategie](../../testing.md): Zusicherung und passende Grenze bestimmen, bestehende Tests wiederverwenden, keine doppelten Fallmatrizen. Nach funktionierendem Schnitt relevante Lücken vor Freigabe schließen.

## Weitere offene Punkte

- Testtitel und Inventur zu `SEARCH-SUBMIT-INT-005` präzisieren: Der Test bestätigt die Ablehnung der Kombination aus konkretem Medientyp und Jahr, isoliert aber nicht die Jahresprüfung. Kein nachgewiesener Funktionsfehler; keine große Test-Umbauphase daraus machen.
- Bestätigung und Anzeige unabhängiger Kriterien während einer offenen Klärung.
- HTTP- und CLI-Verträge gezielt automatisiert prüfen, ohne die gesamte interne Suchmatrix zu wiederholen.
- Kein Handler oder Aufrufer für `/api/search/title/refine` wurde in A1 gefunden; keine vorsorgliche Migration einplanen.
- Discovery, Genre-Katalog, Keyword-Auflösung und UI-Ausbau bleiben spätere Anwendungsfälle. Vor öffentlichem Hosting Zugriffsschutz, Missbrauchsbegrenzung und Ressourcenlimits klären.
