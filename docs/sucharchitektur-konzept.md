# NuxtWatch – Sucharchitektur und Aufgabenplan

Status: Entwurf zur Freigabe. Dieses Dokument beschreibt ein Zielbild, keinen bestätigten Repository-Iststand. NuxtWatch ist aus dem Release `v0.0.1` von NextWatch entstanden. Die Aufgaben in diesem Dokument beziehen sich ausschließlich auf NuxtWatch.

## Ziel

Eine Suchstrecke soll vom HTTP-Einstieg über eine gemeinsame typisierte Laufzeitmatrix bis zur Fachfunktion nachvollziehbar sein. Gemeinsame Abläufe werden einmal implementiert. Titelspezifika bleiben in einer Fachdatei; weitere Fachdateien entstehen erst mit einem unterstützten Fall. Keine generische Regel-Engine, keine zweite Routing-Matrix, kein neuer globaler Store.

## Sieben Architekturblöcke

| Block | Zuständigkeit | Ort im Zielbild |
|---|---|---|
| 1. Schemas | Kriterien, Aktionsrequests, Modellvorschläge und fachliche Ergebnisse als getrennte Zod-Verträge; TypeScript-Typen daraus ableiten | `src/lib/schemas/search.ts` |
| 2. Endpunkte | Validierte Kriterien auf TMDB-Funktionen abbilden; Parameter und Mapping bleiben bei den Fachfunktionen bzw. beim Adapter | `matrix.ts`, `title.ts`, bestehender TMDB-Service |
| 3. LLM-Anfragen | Je Strecke und Aktion den Auftrag und den relevanten Kontext auswählen | `matrix.ts`, `llm.ts`, Fachdatei |
| 4. LLM-Antwortprüfung | Erst Form, dann fachliche Zulässigkeit und Zielbindung prüfen; keine Teilanwendung | `flow.ts`, Schema und Fachdatei, über `matrix.ts` ausgewählt |
| 5. Guardrails | Gemeinsame Anweisungen und kontextabhängige Freigaben; verbindliche Prüfung bleibt im Code | `llm.ts` und Fachfunktionen |
| 6. Frontend | Chat, Laufstatus, Wizard, Filter und Treffer; Texte über i18n | UI-Etappe; keine eigene Fachmatrix |
| 7. Router-Pfade | Eine interne POST-Route pro eigenständig aufrufbarer Strecke, nicht pro Aktion oder TMDB-Endpunkt | `server/api/search/<strecke>/index.post.ts` |

## Ordnerstruktur

```text
server/
  api/search/title/index.post.ts   # defineSearchPost('title')
  services/search/
    matrix.ts                     # Laufzeitregister pro Strecke
    flow.ts                       # HTTP-Einstieg, executeSearch, refineSearch
    llm.ts                        # Transport und Promptbausteine
    title.ts                      # Titelfachregeln
  services/tmdb/                   # vorhandener Transport und Adapter
src/lib/schemas/search.ts          # gemeinsame Suchverträge
```

`keyword` dient als zweiter Entwurfsfall, nicht als Platzhalterdatei. Nur wenn das Frontend die Strecke separat aufrufen soll, entsteht `api/search/keyword/index.post.ts`. Eine Fachfunktion in `keyword.ts` kann auch intern genutzt werden. Detail- und Trending-Routen bleiben außerhalb dieses Umbaus.

## Route, Matrix und Ablauf

`POST /api/search/title` nimmt einen Body mit expliziter `action` an. `defineSearchPost('title')` liest den Body und delegiert. Das zur Aktion passende Requestschema wird einmal angewendet. Die Matrix registriert `title.execute` und `title.refine`, aber führt sie nicht selbst aus. Fehlende Aktionen werden zurückgewiesen, nicht aus optionalen Feldern erraten.

| Aktion | Matrixeintrag | Ergebnis |
|---|---|---|
| `execute` | Requestschema und Auswahl der TMDB-Suchfunktion | Treffer oder technischer Fehler; kein LLM-Aufruf |
| `refine` | Requestschema, LLM-Anfrageaufbau, Vorschlagsschema und Fachprüfung | Bestätigte Kriterien, Rückfrage oder unverändertes Ergebnis; keine TMDB-Titelsuche |

Für Titel wählt `execute` zwischen Multi-, Film- und TV-Suche. Die Freigaben dafür sind unabhängig von den Verfeinerungsregeln: Ein direkt übergebenes Serienjahr kann suchbar sein, ohne dass der Parser es setzen darf. Der alte Pfad `/api/search/title/refine` entfällt erst nach Migration der tatsächlichen Aufrufer (UI, Skripte, Tests, soweit vorhanden) oder einer ausdrücklich geplanten Übergangsphase.

## Schemas und Anwendung

- Ein gemeinsames Suchobjekt mit bestätigten Kriterien. Für den ersten Schnitt nur die verifizierten Titelfälle übernehmen; keine vorsorglichen optionalen Keyword- oder Personenfelder hinzufügen.
- Ein gemeinsames `mediaTypeSchema` für `all`, `movie`, `tv`; kein eigenes TV-Schema. Kriterien und Änderungsvorschlag teilen die Wertedefinition.
- Änderungen haben eine gemeinsame Form, etwa `{ field: 'mediaType', value: 'movie' }`. Das Feld bestimmt den Wertetyp. Erlaubte Operationen können je Strecke und Kontext begrenzt sein.
- Der Vorschlag ersetzt nie das gesamte Suchobjekt. Die Fachfunktion prüft den gesamten Vorschlag vor der Übernahme. Bei „Film von 1999“ werden Typ und Jahr gemeinsam übernommen oder nicht angewendet; kein stilles Weglassen eines Teils.
- LLM-Vorschlag, bestätigte Kriterien, offene Klärung und Suchtreffer bleiben unterscheidbar. Die Oberfläche übernimmt nur bestätigte Kriterien.

## LLM und Tokenbudget

Das Modell interpretiert freie Eingaben, schlägt Änderungen vor oder meldet Klärungsbedarf. Es ändert keinen Zustand und wählt keinen TMDB-Endpunkt. Der Anfrageaufbau kombiniert knappe Grundanweisungen, aktuell erlaubte Operationen und den tatsächlich relevanten Kontext. Keine vollständige Historie, Trefferliste, Übersetzungssammlung oder Regeln fremder Strecken standardmäßig mitsenden. Die im Prompt sichtbaren Fähigkeiten aus den fachlichen Freigaben ableiten, statt unabhängige Regelkopien zu pflegen. Unbekannte Ziele, unzulässige Operationen und ungültige Ausgaben werden im Code abgefangen. Für den Vergleich denselben Testfallbestand verwenden und Eingabetokens sowie unveränderte fachliche Entscheidungen prüfen.

## UI, Wizard und Mehrsprachigkeit

Die UI verwendet gemeinsame Bausteine pro Kriterium, etwa eine Medientyp-Auswahl für Film und Serie. Werte können aus gemeinsamen Verträgen kommen; Labels, Bedienung und Übersetzungen bleiben UI-Aufgaben. Die UI importiert keine serverseitige Matrix und leitet aus gültigen Enum-Werten keine Parser-Freigaben ab.

| Anzeige | Verhalten |
|---|---|
| Laufstatus | Vorübergehend, kein Eintrag im Chatverlauf und keine Filteränderung. Zuerst lokal beim Warten, später optional echte serverseitige Statusereignisse über dieselbe Route. |
| Rückfrage | Wizard zeigt übersetzte Frage und nur die angebotenen Optionen oder Aktionen. Aktive Kriterien bleiben bis zur Bestätigung unverändert. |
| Bestätigung oder Hinweis | Nach fachlichem Ergebnis; bestätigt keine Änderung, die nicht tatsächlich übernommen wurde. |
| Technischer Fehler | Sicherer lokalisierter Fehlercode; interne Details nicht an die UI. Kein Erfolg und keine Übernahme unverifizierter Änderungen. |

Der Wizard ist ausschließlich für die Klärung zuständig. Als Eingabe genügen ein Nachrichtencode mit Parametern, eine lokale Zielkennung, die angebotenen Aktionen und bei Bedarf Kandidaten. Eine vorbereitete Auswahl sendet der Wizard mit Ziel- und Optionskennung an den Server, nicht als manipulierte rohe Modellantwort. Der Server prüft, ob Ziel und Option noch gültig sind, vervollständigt das offene fachliche Ergebnis und ergänzt das bestätigte Suchobjekt. Andere offene Klärungen bleiben offen. Der Wizard startet keinen Modellaufruf für einen Auswahlklick und keine Suche; ein späteres `execute` verwendet das Suchobjekt. Freie Antworten, Reihenfolge mehrerer Klärungen, Ablage der Pending-Daten und der konkrete HTTP-Aktionsname bleiben bewusst offen. `discard` betrifft ausstehende Anfragen, nicht akzeptierte Einträge.

## Aufgaben nach Freigabe

| ID | Aufgabe | Abnahme |
|---|---|---|
| A1 | Titelstrecke und ihre Aufrufer inventarisieren; tatsächliche Contracts, Dateien und Tests erfassen; Wizard-Dokument im Repo gegen diesen Entwurf abgleichen | Ist-/Ziel-Zuordnung, Migrationsliste und dokumentierte Abweichungen liegen vor |
| A2 | Titelverträge und Referenzfälle festhalten | Direkte TV-Suche und Film-Verfeinerung sind unterscheidbar getestet; ungültige Vorschläge und Teilanwendung ausgeschlossen |
| A3 | Gemeinsame Matrix und Ablauf einführen, Titellogik bündeln | Ein Einstieg in der Matrix; bisheriges fachliches Verhalten bleibt erhalten; direkte Suche ohne LLM, Verfeinerung ohne Titelsuche |
| A4 | Gemeinsame Titelroute migrieren | Beide Aktionen unter derselben URL, unbekannte Aktionen abgelehnt, alle identifizierten Aufrufer migriert oder Übergang abgesichert |
| A5 | Rückfragevertrag und Wizard zunächst mit Beispieldaten prüfen | Titel-Rückfrage und Personen-Auswahl in derselben UI, mindestens zwei Sprachbeispiele, Auswahl erst nach Serverbestätigung wirksam; altes Ziel wird nicht übernommen |
| A6 | Promptumfang und UI-Status prüfen | Kontextbezogene Instruktionen; lokale Ladeanzeige endet bei Ergebnis, Fehler oder Abbruch; keine vorgetäuschten Suchschritte |
| A7 | Keyword als zweiten Architekturfall bewerten | Gemeinsamkeiten und nötige Fachfunktionen belegt; Route und Verfeinerung nur bei echtem Bedarf; Paginierungsmetadaten am NuxtWatch-Stand geprüft |

A1–A4 bilden den ersten technischen Schnitt; A5–A7 begründen keine sofortige Umsetzung der UI oder weiterer Suchstrecken. Nach dem Schnitt relevante Tests, Coverage-Prüfung, ESLint und Typecheck ausführen.

## Offene Grenzen

- Änderungen an bereits akzeptierten Entitäten und gekoppelte Ersetzungen sind nicht Bestandteil des ersten Titelschnitts.
- Für spätere Personen- und Keyword-Auflösung am NuxtWatch-Stand prüfen, welche Paginierungsmetadaten tatsächlich bis zur Fachlogik gelangen. Ein einzelner angezeigter Kandidat allein belegt keine Eindeutigkeit.
- Detaillierte Prompt- und Wizard-Flows, optionale Statusstreams und weitere Suchstrecken werden separat spezifiziert. Die genannte Wizard-Dokumentation wurde für diesen Entwurf nicht im Repository verifiziert.
