# Sucharchitektur – Arbeitsstand und Tasks

Stand: 21. November 2026. Branch: `feat/shared-search-architecture`. Dokumentierter Implementierungsstand: `81dc0e8`; Zielbild `dcb41e6`, Konsolidierung `a0e6ad9`. Keine Code-Umstrukturierung oder neuen Checks durch diese Taskplanung.

## Aktiver Umsetzungstask

| Task | Status | Ziel |
| --- | --- | --- |
| [01 – Gemeinsame Suchmatrix und Ablaufsteuerung](01-shared-search-matrix.md) | Vorbereitet, nicht begonnen | Zielstruktur umsetzen, gemeinsame Hindernismatrix herstellen, mit vorhandenen Titelwegen im Terminal prüfen |

Ein aktiver Task pro konkretem Umsetzungsschritt/Durchstich, nicht pro Datei oder automatisch pro Kriterium. Jeder Task enthält Umfang, Ausschlüsse, nummerierte Abnahmekriterien, tatsächliches Prüfprotokoll und Findings. Task 02 entsteht erst nach Auswahl des nächsten Anwendungsfalls, beispielsweise Keyword. Findings gehen in die gemeinsamen Regeln zurück; abgeschlossene Tasks bleiben zunächst als Abnahmebeleg. Keine neue Sammlung von Zwischenstandsnotizen.

## Verbindliche Grundlage

- [Konzept und Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md).
- [TMDb-Analyse](../../tmdb-api-analysis.md), [geprüfte Requests](../../tmdb-search-examples.md), [Wizard](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog](../../ideas/translation-catalog.md).
- [Testing](../../testing.md) und [Typing](../../typing.md); aktuelle Ausnahme für explorative Suchdurchstiche beachten.

## Prüfung in der explorativen Phase

Automatisierte Tests sind ausdrücklich zurückgestellt. Keine neuen, erweiterten, duplizierten oder umgebauten Tests als Teil dieser Durchstiche. Bestehende Tests nicht pauschal löschen. Inkompatibilitäten durch geänderte Pfade/Verträge als Lücke im aktiven Task protokollieren, nicht durch Ausschlüsse, Konfigurationsänderungen oder unnötige Kompatibilitätsschichten verdecken.

Abnahmekriterien bleiben verbindlich und werden zunächst per Codeprüfung und manuell im Terminal beurteilt. Typecheck/Lint ausführen; Ergebnisse und gegebenenfalls durch unveränderte Testdateien verursachte Fehler ehrlich berichten. Keine grünen Checks behaupten oder Prüfumfang stillschweigend verkleinern. Ein Terminaldurchlauf beweist keine vollständige Race-/Parallelitätssicherheit. Nicht reproduzierte Punkte bleiben ungeprüft. Spätere automatisierte Absicherung separat vereinbaren: zuerst vorhandene Tests inventarisieren, jede Zusicherung einer geeigneten Grenze zuordnen und doppelte Fallmatrizen vermeiden. Die bisherige Testinventur ist nur historische Orientierung, kein aktueller Auftrag zum Testumbau.

## Implementierung und Nachweise

- HTTP und Terminal unterstützen Submit, gebundene Klärung, Execute und Reset. Serverkriterien, Auftrag, Revision und Frage sind getrennt gebunden. Noch vorhanden: `workflow.ts`, `coordinator.ts`, `submit.ts`, `parser.ts`, `llm.ts`; gemeinsame `matrix.ts` fehlt.
- Titel ohne Typ/Jahr: Multi; Film/Serie optional mit Einzeljahr: Movie/TV. Titel/Jahr ohne Typ: Klärung, keine Listen-Zusammenführung oder Jahres-Nachfilterung. Multi-Personen werden nicht zu Titelkarten; `include_adult=true`, keine Adult-basierte Ausfilterung.
- Clarify sucht nicht. Submit/Execute teilen die Reservierung; Execute interpretiert nicht erneut. Laufende/erfolgreiche Revision startet nicht nochmals, technischer Fehler erlaubt ausdrücklichen neuen Versuch. Prozesslokale Session: 30 Minuten Inaktivität, maximal 1.000, nicht neustartfest.
- JSON seit `81dc0e8`, Interpretationsregeln erhalten. Drei gezeigte Antworten auf „Finde Morgenbogen von 1999“: Film → movie/1999, Serie → tv/1999, Film von 2001 → movie/2001. Titel erhalten, ready, keine Titelrückfrage/automatische Suche; Execute nicht geprüft. Zuvor vier erfolgreiche Textläufe, keine isolierte Ursachenbestimmung.
- Typecheck/Lint des früheren Textstands bestätigt; erneute ausdrückliche Bestätigung für `81dc0e8` nicht dokumentiert. Kein aktueller automatisierter Erfolgsnachweis.

## Abgeschlossener Parservergleich

Qwen/Gemma jeweils 14 Fälle × drei Varianten × drei Wiederholungen, je 126 abgeschlossen. Qwen A 38/42 vertragsgültig, B/C je 42/42; keine Abschneidungen. Gemma 126/126 vertragsgültig ohne Abschneidung; B/C stellten erwartete Fragen bei Titel/Jahr und mehrdeutiger Fortführung. B bevorzugt, C ohne erkennbaren Mehrwert; bevorzugte Titelrückfrage bei fehlendem Titel auch bei Gemma nicht zuverlässig.

Gemma-Vergleich: `google_gemma-4-26b-a4b-it`, Q4_K_M, 21. November ab 10:19:23.618Z, Stand `6baabbd`, Kontext laut damaliger Angabe 20066, null Reasoning-Tokens. Vergleichslimit 2048 versus Qwen 256; UI-Sampling kein vollständiger Nachweis effektiver Defaults. Kein isolierter Modelleffekt, keine semantische Zuverlässigkeitsabnahme und keine automatische Aussage über spätere App-Einstellungen. Zusatzkontext wurde ohne nichtleere offene Frage getestet; Ergebnis widerlegt gebundenen Klärungskontext nicht. Kein weiterer Vergleich als Pflichtaufgabe. Rohantworten nicht ungeprüft veröffentlichen oder lokale `test-results/` pauschal löschen.

## Terminal

```sh
node scripts/search.mjs
node scripts/search.mjs http://localhost:3001
```

Nuxt, Modellserver und lokale Konfiguration müssen bereitstehen. HTTP/Cookie-Client ohne eigene Providerzugangsdaten oder Serverimporte. Text ohne Frage → Submit; mit offener Frage → gebundene Antwort. `/select NUMMER`, `/submit TEXT`, `/execute`, `/reset`, `/exit` bleiben explizite Aktionen. Wizard und kompakte Treffer nach Bedarf erweitern.

## Zurückgestellte Testorientierung

Aus früherer Inventur übernommen, Pfade/Abdeckung nicht erneut geprüft und kein Änderungsauftrag:

| Zusicherung | Bisheriger Ansatz |
| --- | --- |
| Direktsuche, Klärung/Unsupported ohne Trefferaufruf | `tests/integration/tmdb/search-submission.spec.ts`, bestehende SEARCH-SUBMIT-INT-Kennungen nicht wiederverwenden |
| Kriterienkopie, Jahr entfernen, übrige Kriterien erhalten | `tests/unit/services/search-submission.spec.ts` |
| System-/Nutzerdaten trennen und Vorschläge validieren | `tests/unit/services/search-parser.spec.ts` |
| Providerparameter, Mapping, Personen ausschließen, leer versus Fehler | `tests/unit/services/title-search.spec.ts` |

Spätere Absicherung umfasst zusätzlich Fragekontext, Auswahl ohne LLM, Ablösung/Reset, Reservierung, Fehlerwiederholung und HTTP-Grenze, ohne dieselbe Fallmatrix überall zu wiederholen. Alte Ablehnungsfälle für konkreten Medientyp/Jahr sind keine aktuellen Sollregeln. Keine zusätzlichen dedizierten `llm.ts`-Tests ohne neue Vereinbarung.

Relevante Vergleichsfälle bleiben Orientierung: expliziter Film/Serie, Titel allein, Titel/Jahr ohne Typ, Titelkorrektur/Fortführung, ausdrückliches Entfernen bisheriger Einschränkungen, Jahr entfernen, Medientyp aufheben, Mehrdeutigkeit, fehlender Titel, Medienwort im Titel, nicht unterstützte Bewertung. Versuchserwartungen sind keine stillschweigend beschlossenen Produktregeln.

## Offene Arbeit

Die alten Durchstichsnotizen und das Vergleichsverzeichnis sind laut geprüftem Verzeichnisstand entfernt; Task 01 ergänzt nun bewusst die verbleibenden Dateien. Entfernung des zugehörigen Vergleichsskripts separat prüfen, nicht als erledigt behaupten. Terminal und reguläre Tests bleiben.

Nächster Schritt: Task 01 umsetzen und manuell durchstechen; danach nächsten Suchweg recherchieren und wählen. Offen außerhalb des ersten Umfangs: unabhängige Teilübernahme bei Modellklärung, Submit-Idempotenz/Ergebniswiederholung, optionale Eingrenzung und Gesamtzählung. Auswahloptionen nicht aus freien LLM-Fragetexten ableiten. Mehrfachtreffer allein sind kein Pflichtklärungsgrund. Zugriffsschutz/Ressourcenlimits vor öffentlichem Betrieb.
