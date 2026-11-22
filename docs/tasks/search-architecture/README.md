# Sucharchitektur – Arbeitsstand und Tasks

Stand: 22. November 2026. Branch: `feat/shared-search-architecture`. Aktueller Codebezug: `ed031e3`. Letzte grüne Rückmeldung zu Typecheck, Lint und vorhandenen Tests: 08:29 CET, Stand nach `794788f`. Für `e06cb2c` und `ed031e3` keine neue Checkbestätigung. Kein eigener Tool-Lauf der Projektbefehle. Manuelle Teilnachweise und offene Abnahmen siehe Task.

## Aktiver Umsetzungstask

| Task | Status | Ziel |
| --- | --- | --- |
| [01 – Gemeinsame Suchmatrix und Ablaufsteuerung](01-shared-search-matrix.md) | In Umsetzung, nicht vollständig fachlich abgenommen | Zielstruktur und Matrix mit vorhandenen Titelwegen herstellen, manuell prüfen und abschließend bestehende Tests auditieren |

Task enthält Umfang, Ausschlüsse, Abnahmekriterien, Prüfprotokoll und Findings. Ein Task pro konkretem Schritt/Durchstich, nicht pro Datei. Task 02 erst nach Abschluss dieses Durchstichs und Auswahl des nächsten Anwendungsfalls; Keyword ist möglich, nicht festgelegt. Findings aktualisieren gemeinsame Regeln; abgeschlossene Tasks bleiben zunächst als Abnahmebeleg. Keine weitere Sammlung von Zwischenstandsnotizen.

## Verbindliche Grundlage

- [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md).
- [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Wizard](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog](../../ideas/translation-catalog.md).
- [Testing](../../testing.md), [Typing](../../typing.md); explorative Prüfvereinbarung und ausdrücklich freigegebene Einzelfälle im aktiven Task beachten.

## Implementierung und Nachweise

- `flow.ts` bündelt Auftrag, Kriterienübernahme, Revision, Fragebindung und reservierte Ausführung. `workflow.ts`, `coordinator.ts` und `submit.ts` sind entfernt; HTTP und Session verwenden den Flow.
- `matrix.ts` bewertet Multi/Movie/TV gegen denselben Kriterienstand. Fachliche Vollabnahme offen.
- `src/lib/schemas/search.ts` bündelt Kriterien, Vorschläge, Fragen, Aktionen und Antworten. Fünf zuvor geprüfte Produktionsdateien verwenden direkte Importe; vier alte Schema-Dateien sind entfernt. Runtime-/Provider-/Kartenverträge bleiben getrennt. Kein vollständiger repositoryweiter Produktionsimportscan.
- `llm.ts` enthält Modelltransport und gemeinsame Vorschlagsinterpretation. `parser.ts` ist entfernt; Flow und bestehender Parser-Vertragstest verwenden `llm.ts`. Prompt, JSON-Kontext, Validierung und Modellparameter unverändert.
- HTTP liegt in `server/api/search/index.post.ts`; alte `server/api/search.post.ts` im zuvor geprüften API-Verzeichnis nicht mehr vorhanden. URL bleibt `POST /api/search`.
- `server/services/search/texts.ts` bündelt anwendungseigene Klärungstexte sowie HTTP-/Sessionmeldungen. `scripts/search.mjs` hält feste Terminaltexte und Vorlagen lokal in `terminalTexts`. Keine Serverimporte oder i18n-Infrastruktur im CLI; freie Modellnachrichten separat. Vollständige Textzuordnungsprüfung/AC9 offen.
- Kompakte Terminaltabelle: Titel, Film/Serie, Datum, TMDb-ID; fehlendes Datum als `—`. Trefferfelder validiert. Seit `e06cb2c` Gesamtzahl und angezeigte Seitenzahl getrennt ausgegeben; eine leere erste Seite bedeutet nicht automatisch null Gesamttreffer.
- `searchTitles` liefert `{ results, totalResults }`. Movie/TV übernehmen die Provider-Gesamtzahl ohne Zusatzaufruf. Nur Multi fragt zusätzlich `/search/person` mit demselben Suchtext und `include_adult=true` ab und subtrahiert dessen Gesamtzahl. Beide Aufrufe verwenden dieselben Standardwerte für Sprache/Seite. Ungültige oder unplausible Zählung bzw. Fehler der Zusatzabfrage → `totalResults: null`, gültige Karten bleiben erhalten. Keine weiteren Ergebnisseiten, keine neue Sortierung.
- Titel ohne Typ/Jahr: Multi; expliziter Film/Serie optional mit Einzeljahr: Movie/TV. Titel/Jahr ohne Typ: weiterhin gewählte Rückfragestrategie, keine Listen-Zusammenführung oder Jahres-Nachfilterung. Personen bleiben aus Titelkarten ausgeschlossen; `include_adult=true`, keine Adult-basierte Ausfilterung.
- Clarify sucht nicht; Execute interpretiert nicht erneut. Submit/Execute nutzen dieselbe Reservierung. Laufende/erfolgreiche Revision nicht nochmals starten, technischer Fehler erlaubt ausdrücklichen neuen Versuch. Keine vollständige manuelle oder Parallelitätsabnahme.
- Prozesslokale Session: 30 Minuten Inaktivität, maximal 1.000 Sessions, nicht neustartfest.

Jüngste Umsetzungen: `83b393f` Terminaltreffer, `22f6cd2` HTTP-/Sessiontexte, `794788f` Terminaltextkatalog, `e06cb2c` Gesamtzählung, `ed031e3` minimale Anpassung bestehender Adaptertests an `.results`. Keine Suchlogikänderung durch den letzten Commit.

## Manuelle Teilnachweise und Zählversuch

Nutzer-Mitschnitt vom 22. November, 08:39 CET; lokaler Commit-SHA nicht genannt, vor Einführung der Gesamtzählung:

- Reset jeweils auf `mediaType: all`; Inception ohne Typ/Jahr direkt gesucht, 13 Treffer in dieser Antwort.
- Inception als Film: `movie`, zwölf Treffer; Dark als Serie: `tv`, 20 Treffer.
- Eingabe `suche den Film Inceptionvon 2010` als Inception/movie/2010 interpretiert, drei Treffer; Dark mit Erstausstrahlung 2017 als Dark/tv/2017, 17 Treffer.
- Dune/2021 ohne Typ zweimal mit freier LLM-Frage, nicht strukturierter Anwendungsauswahl. Serverkriterien zunächst nur `mediaType: all`. Freie Antworten `Film` und `Ich meine den Film` ergeben Dune/movie/2021 und ready, keine automatische Suche. Anschließend kein Execute dokumentiert; keine Abnahme des `/select`-Pfads.
- Trefferansicht und fehlendes Datum sichtbar. Leerliste, technische Fehler, Altbindungen und Parallelität nicht nachgewiesen. Providerparameter nicht allein aus der Ausgabe ableiten.

Separater lokaler API-Zählversuch, Rückmeldung 09:13 CET: Inception, Dark, Dune, Tom Hanks und Batman jeweils Multi/Movie/TV/Person verglichen; bei `language=de-DE`, `include_adult=true`, `page=1` stets `Multi − Person = Movie + TV`. Titelgesamtzahlen: 13, 5502, 1323, 9, 209. Stichprobenbefund, kein API-Vertrag und kein Mengen-/ID-Vergleich. Keine Live-Abnahme der integrierten Zählung nach `e06cb2c`.

Historischer Klärungsnachweis seit JSON-Stand `81dc0e8`: Auf „Finde Morgenbogen von 1999“ freie Film-/Serienantworten zu movie/1999 bzw. tv/1999; explizite Jahreskorrektur zu movie/2001. Titel erhalten, ready, keine automatische Suche; Execute nicht geprüft. Zuvor vier erfolgreiche Textläufe, frühere Fehlerursache nicht isoliert. Kein Ersatz für aktuellen Durchstich.

## Prüfvereinbarung und Teststatus

Allgemeiner Testausbau bleibt bis zum abschließenden Audit zurückgestellt. Keine vorsorgliche Migration, keine pauschalen Löschungen, Ausschlüsse oder Kompatibilitätsschichten zur Rettung überholter Tests.

Ausdrücklich freigegebene Einzelfälle am 22. November: zwei alte Submission-Testdateien entfernt; im Titeltest `include_adult` ergänzt; Parser-Vertragstest auf `llm.ts` umgestellt; mit `ed031e3` nur bestehende Arrayzugriffe/-erwartungen auf `.results` umgestellt und Lückenkommentar entfernt. Testfälle, Mocks, Fehlererwartungen und Suchlogik dabei erhalten. Der umfangreichere Entwurf zusätzlicher Zählungstests wurde nicht committed. Keine zusätzliche automatisierte Absicherung der Gesamtzählung.

Letzte Checkbestätigung 08:29 CET nach `794788f`: Typecheck/Lint/vorhandene Tests laut Nutzer erfolgreich. Keine Befehle, Zahlen oder Coverage ableiten. Kein eigener Lauf; neue Checks nach `e06cb2c`/`ed031e3` offen. Frühere grüne Meldung nach `9010afb` um 08:14 CET historisch erhalten.

Entfernte Tests hinterlassen offene Absicherung für Kriterienübernahme/Jahrentfernung und Submit-/Klärungsflow. Kennungen `SEARCH-SUBMIT-INT-001` bis `005` nicht erneut vergeben. Erhaltene Parser-/Titeladaptertests ersetzen keine vollständige Flow-/Race-Prüfung. Manuelle Nachweise pro Kriterium dokumentieren; grüne Checks sind keine Vollabnahme. Keine zusätzlichen dedizierten LLM-Tests ohne gesonderte Vereinbarung.

## Terminal

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration erforderlich. HTTP/Cookie-Client ohne eigene Providerzugangsdaten oder Serverimporte. Text ohne Frage → Submit, mit Frage → gebundene Antwort. `/select NUMMER` beantwortet nur angebotene Medienfragen, keine Auswahl konkreter Treffer. `/submit TEXT`, `/execute`, `/reset`, `/exit` bleiben explizit. Kriterien/Entscheidungen als JSON, Treffer als Tabelle; Gesamtzahl zusätzlich als Text oder „Gesamtzahl derzeit nicht verfügbar“. Weitere Wizardfunktionen nur nach Bedarf.

## Abgeschlossener Parservergleich

Historisch jeweils 14 Fälle × drei Varianten × drei Wiederholungen für Qwen und Gemma: je 126 abgeschlossen. Qwen A 38/42 vertragsgültig, B/C je 42/42; keine Abschneidungen. Gemma 126/126 gültig ohne Abschneidung; B/C stellten erwartete Fragen bei Titel/Jahr und mehrdeutiger Fortführung. B bevorzugt, C ohne erkennbaren Mehrwert; Titelrückfrage bei fehlendem Titel auch bei Gemma nicht zuverlässig.

Gemma: `google_gemma-4-26b-a4b-it`, Q4_K_M, 21. November ab 10:19:23.618Z, Stand `6baabbd`, Kontext laut damaliger Angabe 20066, null Reasoning-Tokens. Vergleichslimit 2048 versus Qwen 256; UI-Sampling kein vollständiger Nachweis effektiver Defaults. Kein isolierter Modelleffekt, keine semantische Zuverlässigkeitsabnahme und keine automatische Aussage über spätere App-Einstellungen. Zusatzkontext ohne nichtleere offene Frage geprüft; widerlegt gebundenen Kontext nicht. Kein weiterer Vergleich als Pflicht. Rohantworten nicht ungeprüft veröffentlichen oder lokale `test-results/` pauschal löschen.

Relevante Vergleichsfälle bleiben Orientierung: Film/Serie, Titel allein, Titel/Jahr ohne Typ, Titelkorrektur/Fortführung, ausdrückliches Entfernen von Einschränkungen, Jahr entfernen, Typ aufheben, Mehrdeutigkeit, fehlender Titel, Medienwort im Titel, nicht unterstützte Bewertung. Versuchserwartungen sind keine stillschweigend beschlossenen Produktregeln.

## Offene Arbeit

1. Architekturprüfung einschließlich Textzuordnung/AC9 und vollständigen Produktionsimportnachweis abschließen; konkrete Findings zuerst beheben.
2. Offene manuelle Fälle fortführen: strukturierte Auswahl, Execute, Jahreskorrektur, neue Aufträge/Reset und Altbindungen, Wiederholung/Parallelität sowie leer/Fehler und integrierte Gesamtzählung. Nach Codeänderungen Checks erneut protokollieren.
3. Findings in Konzept/Matrix/Zielstruktur zurückführen und Architekturabschluss bewerten. Kein neuer Suchweg vor Abschluss dieses Durchstichs.
4. Als letzter Arbeitspunkt nach Architekturumbau und manuellen Durchstichen: bestehende Tests auditieren; Umfang siehe Schlussabschnitt. Jetzt noch keine Testmigration beginnen.

Historische Durchstichsnotizen und Vergleichsverzeichnis entfernt; frühere Skript-Inventur zeigte nur `scripts/search.mjs`. Keine erneute Bereinigung lokaler Ergebnisse. Außerhalb des ersten Umfangs bleiben unabhängige Teilübernahme bei Modellklärung, Submit-Idempotenz/Ergebniswiederholung, optionale Eingrenzung und Trefferauswahl/Personendetails. Gesamtzählung wurde inzwischen ausdrücklich beauftragt und implementiert. Keine Auswahloptionen aus LLM-Fragetext ableiten; Mehrfachtreffer allein kein Pflichtklärungsgrund. Zugriffsschutz/Ressourcenlimits vor öffentlichem Betrieb.

## Letzter Arbeitspunkt: Audit der bestehenden Tests

Erst nach Architekturumbau und manuellen Durchstichen. Bestand auf fachliche Aktualität, passende Prüfgrenzen, Redundanz und fehlende Zusicherungen prüfen. Insbesondere Matrix, Kriterienübernahme/Jahrentfernung, gebundene Klärung, Execute, Altantworten, Reservierung/Parallelität, Provider-/HTTP-Verträge und Gesamtzählung betrachten. Ergebnis: nachvollziehbare Bestandsbewertung mit priorisiertem Anpassungsbedarf. Der Audit ist noch nicht durchgeführt und erteilt keine pauschale Freigabe zum Erweitern, Löschen oder Refaktorieren von Tests; konkrete Änderungen anschließend gesondert vereinbaren.
