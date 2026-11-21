# Sucharchitektur – Arbeitsstand und nächste Schritte

Stand: 21. November 2026. Branch: `feat/shared-search-architecture`. Dokumentierter Code: `81dc0e8`; Dokumentationscommit zum JSON-Gegencheck: `067b7c5`. Das aktualisierte Zielbild ist noch kein umgesetzter Strukturumbau.

## Verbindliche Grundlage

- [Konzept, Architekturbild und Kriterienmatrix](../../sucharchitektur-konzept.md): Zielverhalten und Findings als Regeln.
- [Zielstruktur](zielstruktur.md): Namen, Zuständigkeiten und Umbauzuordnung.
- [TMDb-Analyse](../../tmdb-api-analysis.md) und [verifizierte Suchbeispiele](../../tmdb-search-examples.md): API-Grundlage, kein Auftrag zur sofortigen Umsetzung aller Suchwege.

Diese Dokumente ersetzen abweichende historische Durchstichsnotizen als aktuelle Arbeitsanweisung. Deren Konsolidierung und Entfernung erfolgt nach Übernahme noch einzigartiger Inhalte und Prüfung der Verweise.

## Vorhanden und geprüft

- HTTP und Terminal unterstützen Submit, gebundene Klärung, Execute und Reset. Bestätigte Kriterien liegen serverseitig. Der aktuelle Suchbereich verteilt sich noch auf `workflow.ts`, `coordinator.ts`, `submit.ts`, `parser.ts` und `llm.ts`; `matrix.ts` fehlt.
- Titel ohne Medientypeinschränkung und ohne Jahr läuft über Multi; Film/Serie optional mit Einzeljahr über den jeweiligen Suchendpunkt. Titel plus Jahr ohne Medientyp erfordert aktuell Klärung. Personen aus Multi werden nicht zu Titelkarten; `include_adult=true` bleibt gesetzt.
- Klärung führt keine Treffersuche aus. Submit und Execute teilen die Ausführungsreservierung; Execute interpretiert nicht erneut. Laufende/erfolgreiche Ausführung derselben Revision startet nicht erneut; technischer Fehler erlaubt ausdrücklichen neuen Versuch.
- Prozesslokale Session-Map: 30 Minuten Inaktivität, höchstens 1.000 Sessions. Kein instanzübergreifender oder neustartfester Schutz.
- JSON ist seit `81dc0e8` aktuelles Eingabeformat bei beibehaltenen Interpretationsregeln. Drei gepostete Durchläufe nach „Finde Morgenbogen von 1999“: Film → movie/1999, Serie → tv/1999, Film von 2001 → movie/2001; Titel erhalten, ready, keine Titelrückfrage, keine automatische Suche. Execute wurde dabei nicht geprüft. Zuvor vier erfolgreiche Textdurchläufe; keine isolierte Ursachenbestimmung oder allgemeine Formatüberlegenheit.
- API-Modell-ID bestätigt: `google_gemma-4-26b-a4b-it`. Ein Log der Textphase meldete null Reasoning-Tokens und keinen Tokenlimit-Abbruch. Kein Nachweis einer allgemeinen Modellüberlegenheit.
- Typecheck und Lint für den früheren Textstand vom Nutzer bestätigt; erneute ausdrückliche Bestätigung für `81dc0e8` fehlt. Keine neue automatisierte Abnahme durch diese Dokumentation.

## Übernommene Entscheidungen

Gebundene Antworten sind Zielweg, nicht Abweichung von einer alten Terminalregel. Die Matrix bewertet Hindernisse und vollständige Kriterienabdeckung statt alle Kombinationen aufzuzählen. Texte bleiben zentral und übersetzbar. Terminal-Wizard und kompakte Ergebnisse werden bedarfsgerecht explorativ entwickelt.

Der Parservergleich ist als Untersuchung abgeschlossen, kein offener Architekturauftrag. Erkenntnisse: Vertragsgültigkeit ersetzt keine fachliche Prüfung; nicht unterstützte Kriterien dürfen nicht verschwinden; der damals getestete Zusatzkontext ohne offene Frage zeigte keinen erkennbaren semantischen Nutzen, was gebundenen Klärungskontext nicht widerlegt. Ein vollständiger Gemma-Vergleich wird nicht mehr als verpflichtender nächster Schritt geführt. Relevante Prüffälle vor Entfernung des historischen Pakets in die reguläre Testplanung übernehmen.

## Nächste Schritte

1. Dokumentationsstand freigeben; Konzept und Zielstruktur bestimmen den folgenden Umbau. Noch keine Codeänderung durch diesen Schritt.
2. Verbleibende Durchstichsdateien auf einzigartige Entscheidungen, Bedienhinweise und Prüffälle prüfen, Inhalte übernehmen und Verweise korrigieren. Ziel in diesem Verzeichnis: README und Zielstruktur; zusätzliche Dateien nur für begründet eigenständigen aktiven Bedarf. Historisches `parser-comparison/` danach entfernen, nicht als offene Vergleichspflicht archivieren. TMDb-Referenzen außerhalb dieses Verzeichnisses behalten und veraltete Statusangaben abgleichen.
3. Code gemäß Zielstruktur zusammenführen, verschieben, umbenennen oder bei tatsächlichem Bedarf erstellen. Gemeinsame Matrix und Coordinator herstellen, ohne alte Schichten parallel zu behalten. Importe und betroffene Tests nachziehen; Typecheck/Lint und angemessene Prüfungen nach [Teststrategie](../../testing.md) ausführen.
4. Erneuter Titel-Durchstich über das Terminal: Titel allein ohne Medientypfrage, Film/Serie mit und ohne Jahr, Titel plus Jahr mit gebundener Klärung einschließlich Korrektur, ausdrückliches Execute, kompakte Ergebnisse. Bindung, Reset, veraltete Antworten, Reservierung und Fehlerwiederholung gezielt absichern. Terminal nur dafür nötig erweitern.
5. Findings in Konzept, Matrix und Zielstruktur zurückführen. Danach jeden weiteren Suchweg in einem eigenen kleinen Durchstich untersuchen und ergänzen; Reihenfolge gesondert festlegen. Keine vollständige Discovery-/Personen-/Keyword-Implementierung auf Vorrat.

## Tatsächlich noch offene Punkte

- Unabhängige Teilübernahme bestätigbarer Kriterien während verbleibender Modellklärung ist noch nicht vollständig im Vertrag abgebildet.
- Submit-Idempotenz sowie Rückgabe laufender/gespeicherter Ergebnisse bei Wiederholung sind nicht durch die bestehende Reservierung allein gelöst.
- Interaktion nach leeren/vielen Ergebnissen, optionale Eingrenzung und aussagekräftige Gesamtzählung bleiben gesondert auszuarbeiten.
- Zentraler übersetzbarer Text-/Fragebestand und kompakte Terminaldarstellung sind im Umbau am tatsächlichen Code zu prüfen, nicht als fertig zugesichert.
- Weitere Suchstrecken, Jahresbereiche und nötige Kandidatenauflösungen erst mit eigenen API-Belegen und Durchstichen ergänzen. Zugriffsschutz/Ressourcenlimits vor öffentlichem Betrieb.

Keine sensiblen Requests oder Rohlogs ungefragt committen. Fehlende Metadaten alter Modellversuche blockieren die Architekturarbeit nicht.
