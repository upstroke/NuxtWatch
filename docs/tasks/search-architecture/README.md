# Sucharchitektur – Arbeitsstand und Tasks

Stand: 22. November 2026. Branch `feat/shared-search-architecture`, Codebezug `a806145`. Letzte grüne Nutzerbestätigung: Typecheck/Lint/vorhandene Tests nach `794788f`, 08:29 CET. Keine aktuelle Checkbestätigung nach den späteren Änderungen, insbesondere `0715d10`/`a806145`; kein eigener Projektbefehlslauf. Manuelle Teilnachweise und offene Abnahmen im Task.

## Aktiver Task und Grundlagen

[01 – Gemeinsame Suchmatrix und Ablaufsteuerung](01-shared-search-matrix.md): in Umsetzung, nicht vollständig fachlich abgenommen. Ein Task pro konkretem Durchstich mit Umfang, ACs, Prüfprotokoll und Findings; keine Zwischenstandsdateien. Task 02 erst nach Abschluss und Wahl des nächsten Anwendungsfalls; Keyword möglich, nicht beauftragt.

Verbindlich: [Konzept](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [Requests](../../tmdb-search-examples.md), [Testing](../../testing.md), [Typing](../../typing.md). Ergänzend [Wizard](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog](../../ideas/translation-catalog.md).

## Implementierung und jüngste Entscheidungen

- `flow.ts` bündelt Auftrag, Kriterienübernahme, Revision, Fragebindung und reservierte Ausführung; Workflow/Coordinator/Submit entfernt, HTTP/Session angebunden.
- `matrix.ts` bewertet Multi/Movie/TV gegen denselben Stand. LLM interpretiert, Matrix bewertet Abdeckung, Flow bestimmt nächste Aktion und bindet Anwendungsfrage. Matrix formuliert keine Texte und verwaltet keine Session. Vollabnahme offen.
- `schemas/search.ts` konsolidiert externe Suchverträge; vier Re-Exports entfernt, fünf zuvor geprüfte Produktionsdateien direkt umgestellt. Runtime-/Provider-/Kartenverträge separat; vollständiger Produktionsimportscan offen.
- `llm.ts` bündelt Transport/Interpretation/Validierung, `parser.ts` entfernt; Flow und Parser-Vertragstest umgestellt. `0715d10` ändert Prompt gezielt auf Version `1.5.2`: darstellbare Kriterien als Vorschlag liefern, Pflicht-Medienfrage nicht vorwegnehmen. `ready` ist keine Ausführungsfreigabe.
- Titel bei `all` ohne Jahr → Multi. Explizites Film/Serie optional mit Jahr → Movie/TV. Titel + Jahr + `all` → verpflichtend Film/Serie auswählen, auch bei ausdrücklich „Filme und Serien“. `all` dann nur ungeklärter Zwischenstand; vor Ausführung Wechsel zu `movie`/`tv`, Titel/Jahr erhalten. Keine zusammengeführten Listen/Jahres-Nachfilterung, kein geratenes Medium/entferntes Jahr. Bestätigte Kriterien nur auf Nutzerwunsch ändern.
- `a806145`: Medienfrage hat Pflichtfeld `message`; zentraler Text aus `texts.ts` wird im Flow gebunden und für Klärungskontext genutzt. CLI validiert/zeigt ihn statt eigener Medienfrage. Optionen bleiben strukturiert, nicht aus Prosa abgeleitet.
- Zentraler Text: „Bei einer Titelsuche mit Jahresangabe musst du zwischen Film und Serie wählen. Möchtest du nach einem Film oder einer Serie suchen?“ Reine Terminalhilfen/Labels/Vorlagen lokal in `terminalTexts`, keine Serverimporte oder neue i18n-Infrastruktur. Freie Modellnachrichten separat. AC9-Vollprüfung offen.
- HTTP-Zielpfad `server/api/search/index.post.ts`, URL weiter `POST /api/search`; alte Datei im zuvor geprüften API-Verzeichnis nicht vorhanden.
- Kompakte Terminaltabelle mit Titel, Typ, Datum, ID; fehlendes Datum `—`. Seit `e06cb2c` Seiten-/Gesamtzahl getrennt. Leere Seite bedeutet nicht null insgesamt.
- Titeladapter liefert `{ results, totalResults }`. Movie/TV direkte Providerzahlen, Multi zusätzlich `/search/person` mit gleichem Suchtext/adult und denselben Sprache-/Seitenstandards; Differenz nur bei plausiblen Metadaten. Fehler/Unplausibilität → null, gültige Karten erhalten. Personen nicht in Titelkarten, `include_adult=true`, keine Adult-basierte Filterung. Keine weiteren Seiten/Neusortierung.
- Clarify sucht nicht, Execute interpretiert nicht erneut. Angebotene Auswahl ohne LLM, freie Antwort über gemeinsame Interpretation. Submit/Execute teilen Reservierung; laufende/erfolgreiche Revision nicht doppelt starten, technischer Fehler erlaubt ausdrücklichen Versuch. Keine vollständige Race-Abnahme.
- Session prozesslokal, 30 Minuten Inaktivität, höchstens 1.000 Sessions, nicht neustartfest.

Jüngste Commits: `83b393f` Terminaltreffer, `22f6cd2` HTTP-/Sessiontexte, `794788f` Terminaltexte, `e06cb2c` Gesamtzählung, `ed031e3` minimale `.results`-Testanpassung, `0715d10` Promptzuständigkeit, `a806145` Medienfragetext durchreichen. Letzte zwei implementiert, noch nicht funktional abgenommen.

## Historische manuelle Teilnachweise

Nutzermitschnitt 22. November 08:39 CET, lokaler SHA nicht genannt, vor Gesamtzählung/Medienfragekorrektur:

- Reset → all; Inception ohne Typ/Jahr direkt, 13 Treffer in damaliger Antwort. Inception/movie zwölf, Dark/tv 20.
- `suche den Film Inceptionvon 2010` → Inception/movie/2010, drei Treffer; Dark mit Erstausstrahlung 2017 → Dark/tv/2017, 17 Treffer. Providerparameter separat im Code belegen.
- Dune/2021 zweimal freie LLM-Frage statt Auswahl; Kriterien zunächst nur all. `Film` bzw. `Ich meine den Film` → Dune/movie/2021, ready ohne Suche. Kein Execute oder `/select` nachgewiesen.
- Trefferansicht/fehlendes Datum gesehen; leer, technische Fehler, Altbindungen, Parallelität und integrierte Gesamtzählung nicht belegt. Keine Übertragung auf neue Commits.

Historischer JSON-Stand `81dc0e8`: Morgenbogen/1999, freie Film-/Serienantworten → movie/1999 bzw. tv/1999; Jahreskorrektur → movie/2001, Titel erhalten, ready ohne Suche. Execute offen. Vier frühere Textläufe erfolgreich, damalige Fehlerursache nicht isoliert. Kein Ersatz aktueller Abnahme.

Separater API-Versuch, Rückmeldung 09:13 CET, `language=de-DE`, `include_adult=true`, `page=1`: Inception, Dark, Dune, Tom Hanks, Batman jeweils Multi/Movie/TV/Person; stets Multi − Person = Movie + TV, Titelgesamtzahlen 13/5502/1323/9/209. Stichprobe, kein API-Vertrag oder Mengen-/ID-Vergleich und kein integrierter Live-Nachweis. Details im Task.

## Prüfvereinbarung und Teststatus

Allgemeiner Testausbau bis abschließendem Audit zurückgestellt. Keine vorsorgliche Migration, pauschalen Löschungen, Ausschlüsse oder Kompatibilitätsschichten zur Rettung überholter Tests.

Freigegebene Einzelfälle am 22. November: zwei alte Submission-Tests entfernt; Titeltesterwartung um `include_adult` ergänzt; Parser-Vertragstestimport auf `llm.ts`; mit `ed031e3` bestehende Arrayzugriffe/-erwartungen auf `.results`, Lückenkommentar entfernt. Fälle/Mocks/Fehlererwartungen/Suchlogik erhalten. Umfangreicher Zählungstestentwurf nicht committed, keine zusätzliche Zählungsabsicherung.

Letzte grüne Meldung nach `794788f` 08:29 CET, frühere nach `9010afb` 08:14 CET. Keine Befehle/Zahlen/Coverage daraus ableiten. Aktuelle Checks offen, alte Erfolge nicht übertragen. Entfernte Tests hinterlassen Kriterienübernahme-/Jahrentfernungs-/Submit-/Klärungslücken. `SEARCH-SUBMIT-INT-001` bis `005` ausgemustert. Erhaltene Parser-/Adaptertests ersetzen keine Flow-/Race-Prüfung. Keine zusätzlichen dedizierten LLM-Tests ohne Vereinbarung.

## Terminal

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration nötig. HTTP/Cookie-Client ohne eigene Providerzugangsdaten. Text ohne offene Frage → Submit, sonst gebundene Antwort. `/select NUMMER` nur angebotene Medienfrage, keine Trefferauswahl. `/submit TEXT`, `/execute`, `/reset`, `/exit` explizit. Kriterien/Entscheidungen JSON, Treffer Tabelle, Gesamtzahl separat oder nicht verfügbar. Wizardausbau nur nach Bedarf.

## Historischer Parservergleich

Je Qwen/Gemma 14 Fälle × drei Varianten × drei Wiederholungen = 126 abgeschlossen. Qwen A 38/42 vertragsgültig, B/C je 42/42, keine Abschneidungen. Gemma 126/126 gültig ohne Abschneidung; B/C fragten bei Titel/Jahr/mehrdeutiger Fortführung, B bevorzugt, C ohne Mehrwert; fehlender Titel nicht zuverlässig geklärt. Historische Erwartungen, keine abweichenden Produktregeln oder Aussage über Prompt `1.5.2`.

Gemma `google_gemma-4-26b-a4b-it`, Q4_K_M, 21. November ab 10:19:23.618Z, `6baabbd`, Kontext laut damaliger Angabe 20066, null Reasoning-Tokens. Limit 2048 vs. Qwen 256, UI-Sampling kein vollständiger Defaultnachweis. Kein isolierter Modelleffekt/Zuverlässigkeitsnachweis. Zusatzkontext ohne nichtleere offene Frage widerlegt gebundene Interpretation nicht. Kein Pflichtvergleich. Rohantworten nicht ungeprüft publizieren, lokale `test-results/` nicht pauschal löschen.

Vergleichsfälle bleiben Orientierung: Film/Serie, Titel allein, Titel/Jahr, Korrektur/Fortführung, Einschränkungen/Jahr/Typ entfernen, Mehrdeutigkeit, fehlender Titel, Medienwort im Titel, nicht unterstützte Bewertung.

## Offene Arbeit

1. Struktur-/Textzuordnungsprüfung (AC9) und vollständigen Produktionsimportnachweis abschließen; konkrete Findings beheben.
2. Nach `a806145` manuell prüfen: Titel allein; Titel/Jahr ohne Typ sowie ausdrücklich Filme und Serien/Jahr; strukturierte Auswahl, Freitext, Jahreskorrektur und Execute; neue Aufträge/Reset, Altbindungen, Wiederholung/Parallelität, leer/Fehler und integrierte Gesamtzahl. Aktuelle Typecheck-/Lint-Ergebnisse protokollieren.
3. Findings zurückführen, Architekturabschluss bewerten; kein neuer Suchweg vor Abschluss.
4. Abschließend bestehende Tests auditieren und priorisierten Änderungsbedarf dokumentieren; konkrete Teständerungen separat vereinbaren, keine Migration jetzt.

Historische Durchstichsnotizen/Vergleichsverzeichnis entfernt; frühere Skriptinventur nur `scripts/search.mjs`. Keine erneute lokale Ergebnisbereinigung. Nicht beauftragt: allgemeine Teilübernahme bei LLM-Klärung, Submit-Idempotenz/Ergebniswiederholung, optionale Eingrenzung, Trefferwahl/Personendetails. Gesamtzählung separat beauftragt/implementiert. Mehrfachtreffer allein kein Pflichtklärungsgrund. Zugriffsschutz/Ressourcenlimits vor öffentlichem Betrieb.
