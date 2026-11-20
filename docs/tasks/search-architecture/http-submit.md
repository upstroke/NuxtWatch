# HTTP-Einstieg: direkter Submit

## Abnahme für diesen Schritt

1. `POST /api/search` mit `action: submit` und nichtleerem `userText` delegiert an `submitAndSearch`. Ohne `currentFilters` beginnt die Suche mit `mediaType: all`.
2. Ungültige Eingaben und noch nicht implementierte Aktionen werden vor einem Modell- oder TMDb-Aufruf mit HTTP 400 abgelehnt. Der Request akzeptiert keine unbekannten Felder.
3. Ein direkt ausführbarer Fall liefert HTTP 200 mit `status: completed`, `criteria` und `results`; eine gültige leere Trefferliste ist ein Erfolg.
4. Fachliche Rückfragen und Ablehnungen liefern HTTP 200 mit `status: not_executed`, `criteria` und `decision`. Eine Rückfrage führt nicht zur automatischen Fortsetzung.
5. Fehlende LLM-Pflichtkonfiguration beziehungsweise eine nicht lesbare TMDb-Konfiguration liefert HTTP 503. Markierte TMDb-Fehler verwenden die bestehende sichere Fehlerabbildung; sonstige Fehler aus Modellaufruf oder Vorschlagsverarbeitung liefern eine generische HTTP-502-Antwort. Interne Fehlermeldungen werden nicht öffentlich weitergereicht.
6. Die Antwort setzt `Cache-Control: no-store`. Der TMDb-Transport verweigert Redirects.

## Minimaler Live-Aufruf

Bei laufendem Nuxt-Server und LM Studio sowie vorhandener lokaler LLM- und TMDb-Konfiguration:

```bash
curl -i http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  --data '{"action":"submit","userText":"Finde The Matrix"}'
```

Optionale Kriterien werden als `currentFilters` übertragen, zum Beispiel `{"mediaType":"all"}`. Diese erste zustandslose Grenze übernimmt den validierten Kriterienentwurf des Clients; sie implementiert noch keine serverseitige Session oder Auftragsbindung und ist kein fertiger öffentlicher Produktionsendpunkt.

## Testinventur und Status

| Zusicherung                                                                                           | Grenze                               | Vorhanden oder offen                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Parser, Koordinator und Titelsuchdienst arbeiten zusammen; Rückfragen verhindern die Ausführung.      | Kontrollierte Integration            | `tests/integration/tmdb/search-submission.spec.ts`; keine Wiederholung der kompletten internen Fallmatrix im HTTP-Test |
| Fehlende Kriterien verwenden den Default; ungültige Eingaben werden vor externen Aufrufen abgewiesen. | HTTP-Integration am laufenden Server | Offen; an der tatsächlichen Route prüfen, kein separater Zod-Primitivtest                                              |
| HTTP-Erfolg, fachliches Ergebnis, sichere Fehler und Cache-Header erreichen den Client korrekt.       | HTTP-Integration                     | Offen; passende vorhandene HTTP-Testinfrastruktur wiederverwenden                                                      |
| Der direkte Fall liefert mit der lokalen Konfiguration echte Treffer.                                 | Manueller Live-Abgleich              | Offen; obigen Aufruf ausführen und keine feste Trefferzahl voraussetzen                                                |

Route und Request-Vertrag werden in diesem Schritt ergänzt. Tests, Typecheck, Lint und Live-Aufruf wurden für diese Änderung noch nicht ausgeführt. Die zuvor gemeldeten grünen lokalen Checks gelten für den vorherigen Stand.

Keine Tests für `llm.ts` ergänzen (Nutzerentscheidung). Runtime-Konfiguration bleibt unverändert. `clarify`, `execute`, Revisionen und Auftragsspeicher folgen separat; nach einer Klärung darf weiterhin erst die erneute ausdrückliche Suchaktion ausführen. Vor öffentlichem Hosting sind insbesondere Zugriffsschutz, Missbrauchsbegrenzung und Ressourcenlimits zu klären.
