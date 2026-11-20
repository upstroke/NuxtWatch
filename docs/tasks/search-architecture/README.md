# Sucharchitektur – Arbeitsstand

Einstieg für die Weiterarbeit ohne Chatverlauf. Stand: 20. November 2026, 17:15 Uhr. Branch: `feat/shared-search-architecture`. Implementierungsstand bis `d9f93fc`.

Diese Übersicht beschreibt den aktuellen Iststand und ersetzt abweichende ältere Implementierungsangaben in den verlinkten Schritt- und Entscheidungsdokumenten. Zielabläufe und State-Machine-Diagramme sind nicht automatisch implementiert.

## Dokumente

- [Architekturkonzept](../../sucharchitektur-konzept.md)
- [LLM-Suchvorbereitung: Erkenntnisse und Vergleichsplan](llm-search-preparation.md)
- [Zielstruktur und Verantwortlichkeiten](zielstruktur.md)
- [Suchablauf, Interpretation und Terminal-Interaktion](interaction-state-decisions.md)
- [Entscheidung 1: Session und Auftrag](session-request-decision.md)
- [CLI-Abnahme](cli-abnahme.md), [HTTP-Schnitt](http-submit.md), [direkte CLI](cli-direkt.md)
- [Testinventur](test-inventory.md), [Rückfrage-Task](clarification-flow.md)
- [Wizard-Skizze](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog-Skizze](../../ideas/translation-catalog.md)

`docs/ideas` enthält Referenzen und spätere Ausbaustufen, keinen automatisch beschlossenen Implementierungsplan. Codeänderungen benötigen konkrete Freigaben. Tests bleiben vorerst unverändert.

## Implementierter Stand

### Session und Auftrag

- Die CLI nimmt das Session-Cookie mit. `submit` sendet Suchtext, keinen ersetzbaren Kriterienstand; `/reset` beginnt serverseitig einen neuen Suchkontext (`c77825c`).
- Die bestehende prozesslokale Session-Map hat 30 Minuten Inaktivitätsfrist und höchstens 1.000 Sessions. Sie ist weder instanzübergreifend noch neustartfest. Die Startwerte sind keine dauerhaften Betriebsanforderungen; kein zusätzlicher Store wurde eingeführt.
- Ein Submit eröffnet vor der Interpretation einen Auftrag mit `requestId` und Revision `1` und ersetzt den bisherigen Auftrag derselben Session (`501ac29`). Bestätigte Kriterien bilden den Ausgangspunkt, nicht automatisch einen Gesprächsverlauf.
- Nach der Interpretation werden Session und Auftrag auf Aktualität geprüft. Ersetzte Verarbeitung darf weder Kriterien übernehmen noch eine Suche starten (`cd3e011`). Bereits laufende externe Aufrufe werden nicht technisch abgebrochen; verspätete Ergebnisse dürfen den neueren Stand nicht überschreiben.
- Übernommene Änderungen an Titel, Medientyp oder Jahr erhöhen die Revision einmal pro Übernahmeschritt (`d0acd57`). Reguläre Submit-Ergebnisse enthalten `requestId` und `revision` (`05a0dd2`).
- Kriterienübernahme ist vor der Treffersuche abgeschlossen. Ein anschließender technischer Suchfehler macht die bestätigten Kriterien nicht rückgängig.

### Rückfrage, Clarify und Execute

- Eine konkrete Medientyp-Frage ist an `requestId`, `revision` und `questionId` gebunden (`a975ace`). Frageeröffnung erhöht die Revision; bei gleichzeitiger Kriterienänderung erfolgt insgesamt ein Revisionsschritt.
- `clarify` übernimmt nur angebotene Auswahlwerte `movie` oder `tv`, schließt die aktuelle Frage, erhöht die Revision einmal und liefert bestätigte Kriterien. Es startet keine Suche und verwendet für die Auswahl kein LLM (`7efb3d2`).
- `execute` verwendet ausschließlich den gebundenen bestätigten Serverstand ohne erneute Interpretation (`225b368`). Direkter Submit und Execute teilen dieselbe Ausführungsreservierung.
- Eine laufende oder erfolgreiche Ausführung derselben Revision darf nicht erneut starten. Nach technischem Fehler ist ein neuer ausdrücklicher Execute-Versuch möglich. Erfolgreiche leere Ergebnisse sind ebenfalls erfolgreich, kein automatischer Wiederholungsgrund.
- Ungültige Eingaben führen zu HTTP `400`, nicht mehr anwendbare Bindungen beziehungsweise veraltete Verarbeitung zu `409`. Reguläre HTTP-Antworten werden gegen `search-response.ts` validiert (`8ca37b2`). Die LLM-Runtime-Konfiguration wird ebenfalls validiert (`b3224f6`).
- Die Reservierung hat dieselbe prozesslokale Grenze wie die Sessionablage. Keine instanzübergreifende oder transaktionale Garantie.

### Suchumfang

Seit `97e3a07` sind folgende Titelwege implementiert:

| Kriterien | Ausführung |
| --- | --- |
| Titel, `all`, ohne Jahr | `/search/multi` |
| Titel, `movie`, optional Jahr | `/search/movie`, optional `primary_release_year` |
| Titel, `tv`, optional Jahr | `/search/tv`, optional `first_air_date_year=2005` |
| Titel, `all`, mit Jahr | Medientyp klären, keine Treffersuche |

Alle drei Titelsuchwege verwenden `include_adult=true`, validieren Providerantworten und liefern das gemeinsame Trefferkartenformat. Multi Search lässt Personentreffer aus. `6f40f09` korrigiert die `prefer-const`-Meldung im Suchdienst. Die Begrenzung bei `all` plus Jahr ist eine Implementierungsentscheidung, keine universelle fachliche Notwendigkeit. Keine Zusammenführung zweier Titellisten.

### Parser und CLI

Der Parser akzeptiert Änderungen an `title`, `mediaType` und `year` sowie allgemeine Klärungs-/Unsupported-Meldungen. Er erhält aktuelle Kriterien einschließlich `all` und die aktuelle Nutzereingabe, aber keinen vorherigen Gesprächsverlauf. Allgemeine Modellfragen werden nicht automatisch in strukturierte Frageinstanzen umgewandelt.

Aktueller Prompt: `1.4.0` (`d9f93fc`), Regeltext aus `1.2.1` plus vier Beispiele aus `1.3.0`. Die darin wieder enthaltenen Personen-, Genre- und Pending-Regeln erweitern nicht den implementierten Vertrag. Details, Befunde und nächste Schritte stehen in [LLM-Suchvorbereitung](llm-search-preparation.md).

Die CLI unterstützt weiterhin nur `submit` und serverseitiges `reset`, keine Auswahl per `clarify` und kein `execute`. Eine neue Texteingabe ist ein neuer Submit, keine gebundene Frageantwort. Kein automatischer Folgeaufruf.

Die State Machines bleiben fachliches Modell; umgesetzt sind explizite Funktionen ohne State-Machine-Bibliothek, globale Pending-Phase oder generische Regel-Engine.

## Prüfstand

- Laut Nutzerbericht war Typecheck für `97e3a07` erfolgreich. Die zunächst widersprüchliche Lint-Meldung wurde durch die konkrete `prefer-const`-Ausgabe geklärt; nach `6f40f09` wurde Lint ausdrücklich als erfolgreich bestätigt. Für die späteren Promptcommits liegt keine ausdrückliche neue Checkbestätigung vor. Frühere Bestätigungen reichen bis einschließlich `225b368` zurück.
- Tests wurden in diesen Schritten weder geändert noch ausgeführt. Bestehende Multi-Search-Tests erwarten bislang eine Query ohne `include_adult`; diese Erwartung passt nicht mehr zum implementierten Aufruf.
- Mit Prompt `1.3.0` wurden manuell beobachtet: Film plus Jahr mit drei Treffern, Serie plus Jahr mit einem Treffer, Titel ohne Medien-/Jahresangabe nach Reset mit 20 Treffern sowie Titel plus Jahr ohne Medienangabe nach Reset mit Medientyp-Rückfrage und ohne Suche. Der Serienauszug zeigte keinen Reset und ist nicht als isolierter Reset-Fall bestätigt.
- Mit Prompt `1.4.0` wurden nach Reset Film plus Jahr mit drei Treffern und anschließend ohne Reset der Wechsel zu Serie plus anderem Jahr mit einem Treffer beobachtet. Eine weitere unqualifizierte Titeländerung wechselte den Medientyp auf `all`, behielt das alte Jahr und führte zur Rückfrage. Das ist keine bestätigte fachliche Themenwechselregel.
- Trefferzahlen beschreiben nur die jeweilige empfangene Antwort und sind keine festen Abnahmewerte. Die manuellen Checks nehmen weder Parallelität, Revisionsbindung, Reservierung noch sämtliche Fehler-/Wiederholungsfälle ab.
- Historisch bestätigt: direkter HTTP-/CLI-Durchstich für The Matrix einschließlich HTTP 200, `no-store` und normalisierter Film-ID 603. Vorhandene Tests wurden zuvor nach Teststrategie getrennt (`08757a2`). Für `llm.ts` jetzt keine Tests ergänzen; globalen Mindestwert und fehlendes Coverage-Ziel pro Datei nicht ändern.
- Dieser Dokumentationsschritt ändert weder Produktionscode noch Tests; keine Checks ausgeführt.

## Unmittelbar nächste Arbeit

Zunächst [LLM-Auftrag, begrenzten Kontext und Vergleichsfälle entwerfen](llm-search-preparation.md), danach einen gesondert vereinbarten Parser-Vergleich ohne TMDb-Aufrufe und produktive Sessionänderungen durchführen. Kein neuer produktiver Parser, kein neues Antwortformat und kein weiterer Produktionsprompt ohne Auswertung und konkrete Freigabe.

Die Anwendung bleibt für Validierung, Kriterienübernahme, Bindungen, Auflösung und Ausführung verantwortlich. Das Modell soll Sprache und Gesprächsbezug interpretieren und tatsächliche Unklarheit benennen; die Anwendung soll freie Sprache nicht durch eine zweite Regel-Engine nachinterpretieren.

## Weitere offene Arbeit

- Allgemeine LLM-Klärungsmeldungen in einen vereinbarten gebundenen Frage-/Antwortablauf überführen; Freitextantworten sind noch nicht umgesetzt. Bedeutung und Fortgeltung von Kriterien bei mehrdeutigen Themenwechseln festlegen.
- Danach Terminal-Auswahllisten, `clarify`, bestätigte Kriterienansicht und gesonderte Execute-Aktion ergänzen. Der vollständige Office-Rückfrageablauf aus der [CLI-Abnahme](cli-abnahme.md) bleibt Ziel, ist noch nicht durchgängig im Terminal bedienbar.
- Klärung nach einer Suchantwort, zentrale Frage-/Hinweistexte und Fragekatalog weiter konkretisieren. Zunächst zentrale deutsche Texte mit stabilen Schlüsseln; spätere Mehrsprachigkeit nicht vorziehen.
- HTTP-/CLI-, Parallelitäts-, Reset-, Revisions-, Reservierungs- und Klärungstests später nach [Teststrategie](../../testing.md) ergänzen. `SEARCH-SUBMIT-INT-005` und Inventur zur Kombination Medientyp/Jahr präzisieren; keine doppelte interne Fallmatrix.
- Einzelne Jahre sind unterstützt; Jahresbereiche, genaue Datumsangaben, Genre, Discovery, Personen- und Keyword-Auflösung bleiben spätere Schritte. Keine stillschweigende Erweiterung durch Promptbeispiele, keine ungefragte Vergröberung von Zeitangaben.
- Für `/api/search/title/refine` wurde in A1 kein Handler/Aufrufer gefunden; keine vorsorgliche Migration. Web-UI später. Vor öffentlichem Hosting Zugriffsschutz, Missbrauchsbegrenzung und Ressourcenlimits klären. LM Studio bleibt der lokale Modellweg; gehostete Modelle und API-Key-Erweiterungen sind kein aktuelles Arbeitspaket.
