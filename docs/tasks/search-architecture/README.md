# Sucharchitektur – Arbeitsstand und Tasks

Stand: 22. November 2026. Branch: `feat/shared-search-architecture`. Aktueller Codebezug: `794788f`. Typecheck, Lint und vorhandene Tests laut Nutzer am 22. November um 08:29 CET erfolgreich; kein eigener Tool-Lauf und noch keine dokumentierte manuelle Abnahme des aktuellen Umbaus.

## Aktiver Umsetzungstask

| Task | Status | Ziel |
| --- | --- | --- |
| [01 – Gemeinsame Suchmatrix und Ablaufsteuerung](01-shared-search-matrix.md) | In Umsetzung, nicht fachlich abgenommen | Zielstruktur und Matrix mit vorhandenen Titelwegen herstellen und im Terminal prüfen |

Task enthält Umfang, Ausschlüsse, Abnahmekriterien, Prüfprotokoll und Findings. Ein Task pro konkretem Schritt/Durchstich, nicht pro Datei. Task 02 erst nach Auswahl des nächsten Anwendungsfalls; Keyword ist möglich, nicht festgelegt. Findings aktualisieren gemeinsame Regeln; abgeschlossene Tasks bleiben zunächst als Abnahmebeleg. Keine weitere Sammlung von Zwischenstandsnotizen.

## Verbindliche Grundlage

- [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md).
- [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Wizard](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog](../../ideas/translation-catalog.md).
- [Testing](../../testing.md), [Typing](../../typing.md); explorative Prüfvereinbarung und ausdrücklich freigegebene Einzelfälle im aktiven Task beachten.

## Implementierung und Nachweise

- `flow.ts` bündelt Auftrag, Kriterienübernahme, Revision, Fragebindung und reservierte Ausführung. `workflow.ts`, `coordinator.ts` und `submit.ts` sind entfernt; HTTP und Session verwenden den Flow.
- `matrix.ts` bewertet Multi/Movie/TV gegen denselben Kriterienstand. Fachliche Vollabnahme noch offen.
- `src/lib/schemas/search.ts` bündelt Kriterien, Vorschläge, Fragen, Aktionen und Antworten. Fünf zuvor geprüfte Produktionsdateien verwenden direkte Importe; vier alte Schema-Dateien sind entfernt. Runtime-/Provider-/Kartenverträge bleiben getrennt. Kein vollständiger repositoryweiter Produktionsimportscan.
- `llm.ts` enthält Modelltransport und gemeinsame Vorschlagsinterpretation. `parser.ts` ist entfernt; Flow und bestehender Parser-Vertragstest verwenden `llm.ts`. Prompt, JSON-Kontext, Validierung und Modellparameter unverändert.
- HTTP liegt in `server/api/search/index.post.ts`; `server/api/search.post.ts` ist im geprüften API-Verzeichnis nicht mehr vorhanden. URL bleibt `POST /api/search`.
- `server/services/search/texts.ts` bündelt anwendungseigene Klärungstexte sowie HTTP- und Sessionmeldungen. Flow, HTTP und Session verwenden diesen Katalog. Freie Modellnachrichten bleiben davon getrennt.
- `scripts/search.mjs` bündelt feste Terminaltexte und dynamische Ausgabevorlagen im lokalen `terminalTexts`-Katalog. Keine Serverimporte, zusätzliche Datei oder i18n-Infrastruktur. Die Medienauswahl wird lokal beschriftet; das ist kein gemeinsamer server-/clientübergreifender Textkatalog. Vollständige AC9-Abnahme noch offen.
- Kompakte Terminaltabelle mit Titel, Film/Serie, Datum und TMDb-ID; fehlendes Datum als `—`. Eigene Leermeldung und Trefferzahl nur für die aktuelle Antwort, keine Gesamtzahl. Angezeigte Trefferfelder werden validiert.
- Titel ohne Typ/Jahr: Multi; expliziter Film/Serie optional mit Einzeljahr: Movie/TV. Titel/Jahr ohne Typ: gewählte Rückfragestrategie, keine Listen-Zusammenführung oder Jahres-Nachfilterung. Multi-Personen nicht als Titelkarten; `include_adult=true`, keine Adult-basierte Ausfilterung.
- Clarify sucht nicht; Execute interpretiert nicht erneut. Submit/Execute nutzen dieselbe Reservierung. Laufende/erfolgreiche Revision nicht nochmals starten, technischer Fehler erlaubt ausdrücklichen neuen Versuch. Nicht erneut manuell abgenommen, insbesondere keine Parallelitätsprüfung.
- Prozesslokale Session: 30 Minuten Inaktivität, maximal 1.000 Sessions, nicht neustartfest.

Jüngste Umsetzungen: `83b393f` kompakte Terminaltreffer, `22f6cd2` zentrale HTTP-/Sessionmeldungen, `794788f` Terminaltextkatalog. Wortlaut und Ablauf bei den beiden Textrefactorings unverändert.

Historischer Klärungsnachweis seit JSON-Stand `81dc0e8`: Auf „Finde Morgenbogen von 1999“ führten freie Film-/Serienantworten zu movie/1999 beziehungsweise tv/1999, explizite Jahreskorrektur zu movie/2001. Titel erhalten, ready, keine automatische Suche; Execute dabei nicht geprüft. Zuvor vier erfolgreiche Textläufe, frühere Fehlerursache nicht isoliert. Kein Ersatz für erneuten Durchstich nach Umbau.

## Prüfvereinbarung und Teststatus

Automatischer Testausbau bleibt zurückgestellt. Keine neuen/duplizierten Tests oder vorsorgliche Testmigration. Bestehende Tests nicht pauschal löschen oder durch Ausschlüsse/unnötige Kompatibilitätsschichten retten.

Ausdrücklich freigegebene Einzelfälle am 22. November: zwei alte Submission-Testdateien entfernt; im Titeltest ausschließlich `include_adult` ergänzt; Parser-Vertragstest nur auf den neuen Modulpfad umgestellt. Keine Coverage-/Prüfkonfiguration verändert. Vorhandene Tests zuletzt für den Stand nach `794788f` laut Nutzer um 08:29 CET grün, ebenso Typecheck/Lint. Kein eigener Lauf; Befehle, Testumfang, Zahlen und Coverage nicht aus der pauschalen Rückmeldung ableiten. Frühere grüne Rückmeldung nach `9010afb` um 08:14 CET bleibt historisch.

Die entfernten Tests hinterlassen offene Absicherung für Kriterienübernahme/Jahrentfernung und den neuen Submit-/Klärungsflow. Kennungen `SEARCH-SUBMIT-INT-001` bis `005` nicht erneut vergeben. Erhaltene Parser- und Titeladaptertests ersetzen keine vollständige Flow-/Race-Prüfung. Details und Commitbelege im Task.

Manuelle Abnahme pro Kriterium dokumentieren; grüne technische Checks sind kein fachlicher Nachweis. Nicht reproduzierte Rennen bleiben offen. Spätere Automatisierung separat vereinbaren: Bestand inventarisieren, Zusicherungen an geeigneten Grenzen absichern, keine doppelte Fallmatrix. Keine zusätzlichen dedizierten LLM-Tests ohne neue Vereinbarung.

## Terminal

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration erforderlich. HTTP/Cookie-Client ohne eigene Providerzugangsdaten oder Serverimporte. Text ohne Frage → Submit, mit Frage → gebundene Antwort. `/select NUMMER`, `/submit TEXT`, `/execute`, `/reset`, `/exit` bleiben explizite Aktionen. Kriterien und Entscheidungen weiterhin als JSON; Treffer kompakt als Tabelle. Weitere Wizard-/Terminalfunktionen nur nach Bedarf.

## Abgeschlossener Parservergleich

Historisch jeweils 14 Fälle × drei Varianten × drei Wiederholungen für Qwen und Gemma: je 126 abgeschlossen. Qwen A 38/42 vertragsgültig, B/C je 42/42; keine Abschneidungen. Gemma 126/126 gültig ohne Abschneidung; B/C stellten erwartete Fragen bei Titel/Jahr und mehrdeutiger Fortführung. B bevorzugt, C ohne erkennbaren Mehrwert; Titelrückfrage bei fehlendem Titel auch bei Gemma nicht zuverlässig.

Gemma: `google_gemma-4-26b-a4b-it`, Q4_K_M, 21. November ab 10:19:23.618Z, Stand `6baabbd`, Kontext laut damaliger Angabe 20066, null Reasoning-Tokens. Vergleichslimit 2048 versus Qwen 256; UI-Sampling kein vollständiger Nachweis effektiver Defaults. Kein isolierter Modelleffekt, keine semantische Zuverlässigkeitsabnahme und keine automatische Aussage über spätere App-Einstellungen. Zusatzkontext ohne nichtleere offene Frage geprüft; widerlegt gebundenen Kontext nicht. Kein weiterer Vergleich als Pflicht. Rohantworten nicht ungeprüft veröffentlichen oder lokale `test-results/` pauschal löschen.

Relevante Vergleichsfälle bleiben Orientierung: Film/Serie, Titel allein, Titel/Jahr ohne Typ, Titelkorrektur/Fortführung, ausdrückliches Entfernen von Einschränkungen, Jahr entfernen, Typ aufheben, Mehrdeutigkeit, fehlender Titel, Medienwort im Titel, nicht unterstützte Bewertung. Versuchserwartungen sind keine stillschweigend beschlossenen Produktregeln.

## Offene Arbeit

Gezielte fachliche Codeprüfung einschließlich Textzuordnung/AC9 und vollständigen Produktionsimportnachweis abschließen; anschließend manuelle Terminalfälle samt Ergebnis protokollieren. Kompakte Ausgabe ist implementiert, nicht manuell abgenommen. Keine Vollabnahme von AC9, AC10 oder Task 01 aus den grünen Checks ableiten. Kein neuer Suchweg vor Abschluss dieses Durchstichs.

Historische Durchstichsnotizen und Vergleichsverzeichnis sind entfernt; frühere Skript-Inventur zeigte nur `scripts/search.mjs`. Keine erneute Bereinigung lokaler Ergebnisse. Außerhalb des ersten Umfangs: unabhängige Teilübernahme bei Modellklärung, Submit-Idempotenz/Ergebniswiederholung, optionale Eingrenzung/Gesamtzählung. Keine Auswahloptionen aus freiem LLM-Fragetext ableiten; Mehrfachtreffer allein kein Pflichtklärungsgrund. Zugriffsschutz/Ressourcenlimits vor öffentlichem Betrieb.
