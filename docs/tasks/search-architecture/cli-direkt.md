# CLI: erster direkter HTTP-Client

## Ausgangspunkt

Der Nutzer hat am 20. November 2026 den Live-Aufruf von `POST /api/search` für „Finde The Matrix“ bestätigt: HTTP 200, `Cache-Control: no-store`, `status: completed`, Kriterien `mediaType: all` und `title: The Matrix`, normalisierte Treffer einschließlich Film-ID 603. Damit ist dieser direkte Serverpfad live bestätigt, nicht die gesamte Rückfrage- oder Fehlerbehandlung.

## Umfang und Start

```bash
node scripts/search.mjs
# Abweichende Serveradresse:
node scripts/search.mjs http://localhost:3001
```

Nuxt, LM Studio und die lokale TMDb-Konfiguration müssen bereitstehen. Die CLI liest keine Modell- oder TMDb-Zugangsdaten und importiert keine Serverdienste. Sie benötigt keine zusätzlichen Abhängigkeiten; Zod ist bereits vorhanden.

Die Eingabe wird als `submit` an `/api/search` gesendet. Die CLI zeigt die vom Server gelieferten Kriterien, Treffer oder Entscheidungen als JSON an. Der letzte gültige Server-Kriterienstand wird bei der nächsten ausdrücklichen Eingabe als `currentFilters` mitgesendet. `/reset` verwirft nur diesen lokalen Stand; `/exit`, Strg+C oder Eingabeende beenden den Client. Anfragen laufen nacheinander, ohne automatische Wiederholung. Während einer Anfrage gibt es keinen weiteren Eingabeprompt. Das CLI-Zeitlimit beträgt 120 Sekunden; ein Abbruch garantiert noch keinen serverseitigen Abbruch.

## Beobachtbare Abnahme und Testinventur

| Zusicherung                                                                                              | Grenze                             | Prüfung / Status                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| „Finde The Matrix“ erreicht den vorhandenen HTTP-Einstieg und zeigt Kriterien und Treffer.               | Manueller CLI-Live-Durchlauf       | Noch auszuführen; keine feste Trefferzahl voraussetzen               |
| Eine weitere Eingabe sendet die zuletzt vom Server bestätigten Kriterien mit; `/reset` startet ohne sie. | CLI mit kontrolliertem HTTP-Server | Automatisierte Prüfung noch offen                                    |
| Rückfragen und Ablehnungen werden unverändert angezeigt und lösen keinen automatischen Folgeaufruf aus.  | CLI mit kontrolliertem HTTP-Server | Noch offen; die bestehende interne Suchmatrix hier nicht wiederholen |
| HTTP-, Netzwerk- oder ungültige Antworten überschreiben den lokalen Kriterienstand nicht.                | CLI mit kontrolliertem HTTP-Server | Noch offen                                                           |
| CLI entscheidet nicht über Suchweg, Endpunkt oder fachliche Klärungsoptionen.                            | Implementierungsprüfung            | Nur `/api/search` und `submit`; keine interne Suchlogik              |

Der Client prüft nur die Antwort-Hülle. Er führt keine zusätzliche fachliche Kriterienvalidierung oder Treffer-Normalisierung durch. Die ausgegebene Trefferzahl bezieht sich ausschließlich auf die empfangene Antwort, nicht auf sämtliche TMDb-Seiten.

## Bewusste Grenze

Dies ist noch nicht die vollständige [CLI-Abnahme](cli-abnahme.md): `clarify`, `execute`, Auftragsbindung und Revisionen fehlen serverseitig. Der Client simuliert diese Aktionen nicht. Eine neue Texteingabe ist ein ausdrücklich neuer `submit`, keine Antwort auf eine gebundene offene Frage. Nach einer Server-Rückfrage startet der Client von selbst keine Suche.

Tests, Typecheck, Lint und manueller CLI-Durchlauf wurden für diese Änderung nicht ausgeführt. Keine Tests für `llm.ts` ergänzen. Nach dem funktionierenden CLI-Schnitt relevante Lücken gemäß `docs/testing.md` schließen.
