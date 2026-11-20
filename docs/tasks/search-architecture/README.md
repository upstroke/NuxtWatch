# Sucharchitektur – Arbeitsstand

Einstieg für die Weiterarbeit ohne Chatverlauf. Stand: 20. November 2026, 13:31 Uhr. Branch: `feat/shared-search-architecture`. Implementierungsstand bis `d0acd57`.

Diese Übersicht beschreibt den aktuellen Iststand und ersetzt abweichende ältere Implementierungsangaben in den verlinkten Schritt- und Entscheidungsdokumenten. Fachlich beschlossene Zielabläufe sind nicht automatisch implementiert. Insbesondere sind die Diagramme in den Interaktionsentscheidungen weiterhin konzeptionell.

## Dokumente

- [Architekturkonzept](../../sucharchitektur-konzept.md)
- [Zielstruktur und Verantwortlichkeiten](zielstruktur.md)
- [Suchablauf, Interpretation und Terminal-Interaktion](interaction-state-decisions.md)
- [Entscheidung 1: Session und Auftrag](session-request-decision.md)
- [CLI-Abnahme](cli-abnahme.md), [HTTP-Schnitt](http-submit.md), [direkte CLI](cli-direkt.md)
- [Testinventur](test-inventory.md), [Rückfrage-Task](clarification-flow.md)
- [Wizard-Skizze](../../ideas/clarificaton-wizzard-flow.md), [Textkatalog-Skizze](../../ideas/translation-catalog.md)

`docs/ideas` enthält Referenzen und spätere Ausbaustufen, keinen automatisch beschlossenen Implementierungsplan. Architektur wird explorativ entwickelt; Codeänderungen benötigen eine konkrete Freigabe. Tests bleiben vorerst unverändert.

## Implementierter Stand

```text
CLI mit Cookie-Mitnahme
└── POST /api/search: submit oder reset
    ├── HTTP-Vertrag validieren und Session zuordnen
    └── submitForSession
        ├── Auftrag eröffnen: requestId, Revision 1
        ├── bestätigte Kriterien kopieren und Suchabsicht interpretieren
        ├── Aktualität von Session und Auftrag prüfen
        ├── geänderte Kriterien übernehmen, Revision einmal erhöhen
        ├── ausführbare direkte Titelsuche starten
        ├── Aktualität nach Rückkehr erneut prüfen
        └── Ergebnis mit requestId und revision zurückgeben
```

### Session-Grundlage

Mit `c77825c` wurden serverseitige Kriterien, geschützte Cookie-Zuordnung, Cookie-Mitnahme in `scripts/search.mjs` und serverseitiger Reset eingeführt. Der Client sendet bei `submit` nur `action` und `userText`, keinen ersetzbaren Kriterienstand. `/reset` erreicht den Server und beginnt einen neuen Suchkontext; es ist nicht mehr nur eine lokale CLI-Aktion.

`server/utils/search-session.ts` verwendet eine prozesslokale In-Memory-Map mit 30 Minuten Inaktivitätsfrist und höchstens 1.000 Sessions. Der Zustand geht bei Neustart verloren und ist nicht instanzübergreifend geteilt. Diese implementierten Startwerte sind keine hergeleiteten dauerhaften Betriebsanforderungen. Nitro `useStorage`, eine zusätzliche Datenbank oder ein separates `search-storage.ts` sind nicht implementiert und für diesen Schnitt nicht erforderlich.

### Erster Submit-Schnitt

- `501ac29`: `workflow.ts` eröffnet vor der asynchronen Interpretation einen Auftrag. Ein neuer Submit ersetzt den aktuellen Auftrag derselben Session auch während laufender Verarbeitung; die frühere globale `busy`-Sperre entfällt. Bestätigte Kriterien bleiben Ausgangspunkt.
- `cd3e011`: Nach erfolgreicher Interpretation wird die Aktualität geprüft, bevor die Treffersuche starten darf. `searchSubmission` in `submit.ts` führt den bewerteten Vorschlag ohne erneute Interpretation aus. `submitAndSearch` bleibt als kombinierter Einstieg ohne Session-Lebenszyklus erhalten; die HTTP-Route nutzt `submitForSession`.
- `05a0dd2`: Reguläre Antworten mit `completed` oder `not_executed` enthalten `requestId` und `revision`. Reset- und Fehlerantworten wurden damit nicht um diese Felder erweitert.
- `d0acd57`: Ein neuer Auftrag startet bei Revision `1`. Ändern sich bei der Übernahme `title`, `mediaType` oder `year`, wird die Revision einmal erhöht, auch bei mehreren Änderungen. Identische Kriterien erhöhen sie nicht. Ein neuer Submit startet unabhängig von der Revision seines Vorgängers wieder bei `1`.
- Kriterienübernahme und Revisionserhöhung erfolgen gemeinsam nach der Aktualitätsprüfung und vor der Treffersuche, ohne asynchrone Unterbrechung dazwischen. Ein anschließender TMDb-Fehler macht die bestätigte Änderung nicht rückgängig. Ein neuerer Submit kann diese bereits bestätigten Kriterien als Ausgangspunkt verwenden.
- Die Aktualität wird zusätzlich nach erfolgreicher Rückkehr der Suchausführung geprüft. Veraltete Ergebnisse dürfen den neueren Stand nicht verändern. Der interne Rückgabestatus `superseded` wird von der Route als HTTP `409` abgebildet. Bereits gestartete LLM-/TMDb-Aufrufe werden nicht technisch abgebrochen. Technische Exceptions verwenden weiterhin die bestehende Fehlerabbildung; ihre Behandlung wurde nicht zu einem vollständigen Veraltungs-/Wiederholungsvertrag ausgebaut.
- `b3224f6`: Die Route validiert `runtime.llm` über `LlmRuntimeConfigSchema`. `LlmConfig` ist vom Runtime-Vertrag abgeleitet; ungültige Konfiguration führt kontrolliert zu HTTP `503`.

### Suchumfang und Grenzen

Der direkte Titelsuchdienst verwendet weiterhin `/search/multi`, validiert die Rohantwort, normalisiert Film und Serie und lässt Personen aus. Direkt ausführbar sind Titel mit `mediaType: all` ohne Jahr. Spezifischer Medientyp und Jahr werden bei der Ausführung nicht stillschweigend weggelassen. Parser und Koordinator unterstützen entsprechende Vorschläge beziehungsweise Klärungsentscheidungen, aber noch nicht alle daraus folgenden Suchwege.

`clarify`, `execute`, konkrete Fragen mit `questionId`, gebundene Antwortverarbeitung und Terminal-Auswahllisten sind noch nicht implementiert. Ebenso fehlen Revisionsübergänge für Änderungen an konkreten Rückfragen. Der aktuelle Auftrag speichert bisher `requestId` und `revision`, keinen vollständigen Frage-, Interpretations- oder Ausführungslebenszyklus.

Die State Machines beschreiben das fachliche Modell. Der erste Submit-Schnitt verwendet explizite Funktionen, keine State-Machine-Bibliothek und keine vorsorgliche generische Infrastruktur. Eine ausdrückliche Übergangsfunktion bleibt möglich, wenn sie konkrete Abläufe verständlicher macht.

## Prüfstand

- Der Nutzer hat Typecheck und Linting für den Stand nach `d0acd57` am 20. November 2026 bestätigt. Das ist keine Bestätigung ausgeführter Tests oder einer vollständigen Live-Abnahme der neuen Auftrags-/Revisionslogik.
- Tests wurden für die Session-/Submit-Schritte weder geändert noch ausgeführt. Frühere Testbestätigungen gelten nicht automatisch für diese neueren Änderungen.
- Historischer Live-Abgleich vom 20. November: HTTP 200 mit `no-store`, `completed`, Kriterien `all` und `The Matrix`, normalisierter Treffer ID 603; anschließend CLI-Erfolg mit 20 Treffern in dieser Antwort. Daraus weder feste Trefferzahlen noch eine Gesamtzahl über alle TMDb-Seiten ableiten. Dieser Abgleich nimmt die späteren Session-/Parallelitätsänderungen nicht ab.
- Vorhandene Koordinator-/Parser-Unit-Tests und kontrollierte Integration unter `tests/integration/tmdb` wurden zuvor nach Teststrategie getrennt (`08757a2`). `llm.ts` hatte laut früherem Nutzerbericht 0 % Coverage; dafür jetzt keine Tests ergänzen. Globaler Mindestwert unverändert, kein Coverage-Ziel pro Datei.
- Dieser Dokumentationsschritt ändert keinen Produktionscode und keine Tests; dafür werden keine Checks ausgeführt.

## Beschlossene Richtung für die Fortsetzung

Die [Interaktionsentscheidungen](interaction-state-decisions.md) halten die fachlichen Regeln fest: allgemeiner Freitext ist `submit`; Antworten auf konkrete Fragen benötigen eine ausdrückliche Bindung an Auftrag, Frage und Revision. `clarify` bearbeitet den bestehenden Auftrag ohne Treffersuche. `execute` sucht ausdrücklich mit dem bestätigten ausführbaren Serverstand. Die Auftragskennung allein ist keine Zugriffsberechtigung.

Der gemeinsame Parser schlägt nur unterstützte Kriterien vor; die Anwendung validiert, übernimmt und bewertet. Direkte Auswahl und strukturierte Eingaben benötigen kein LLM. Fragezustand, Kriterien, Ausführbarkeit und technische Requests bleiben getrennt. Keine globale `pending`-Phase und keine generische Regel-Engine vorziehen.

Nächster fachlicher Durchstich gemäß [CLI-Abnahme](cli-abnahme.md): „The Office von 2005“ → Medientyp-Frage → „Serie“ ohne Treffersuche übernehmen → ausdrückliches `execute` → TV Search mit `query=The Office` und `first_air_date_year=2005`. Das Matrix-Direktverhalten bleibt erhalten. Vor Umsetzung konkrete Fragen-/Antwortverträge und Übergänge vereinbaren.

## Verbleibende Arbeit

- Rückfrageninstanzen, Fragekatalog, `clarify`-/`execute`-Verträge und Revisionsfortschreibung bei Klärungsänderungen. Weitere Lebenszyklusfragen, insbesondere Klärung nach einer Suchantwort, bleiben offen.
- Schutz gegen doppelte Ausführung, Ausführungsreservierung, Fehler- und Wiederholungsverhalten sowie weitere Ergebnis-Enums und HTTP-Verträge. Die vorhandenen Submit-Prüfungen sind keine allgemeine Mehrinstanz- oder Transaktionslösung.
- TV-/Film-Suchwege und konkrete Terminal-Aktionen; keine stillschweigende Erweiterung des Suchumfangs durch Parser-Beispiele.
- Relevante HTTP-/CLI-, Parallelitäts-, Reset-, Revisions- und Klärungstests später nach [Teststrategie](../../testing.md) ergänzen beziehungsweise anpassen. Tests sind aktuell zurückgestellt; keine doppelte interne Fallmatrix.
- `SEARCH-SUBMIT-INT-005` und Inventur präzisieren: prüft die Kombination Medientyp/Jahr, nicht isoliert die Jahresprüfung; kein nachgewiesener Funktionsfehler.
- Zunächst zentrale deutsche Texte mit stabilen Schlüsseln; spätere Mehrsprachigkeit nicht vorziehen. Pfad und Format sind noch nicht implementiert.
- Einzelne Jahre sind vorgesehen; Jahresbereiche, genaue Datumsangaben, Genre, Discovery und Keyword-Auflösung werden nicht vorgezogen. Nicht unterstützte Zeitangaben nicht ungefragt vergröbern.
- Für `/api/search/title/refine` wurde in A1 kein Handler/Aufrufer gefunden; keine vorsorgliche Migration. Web-UI später; vor öffentlichem Hosting Zugriffsschutz, Missbrauchsbegrenzung und Ressourcenlimits klären. Lokal wird LM Studio genutzt; gehostete Modelle und API-Key-Erweiterungen sind kein aktuelles Arbeitspaket.
