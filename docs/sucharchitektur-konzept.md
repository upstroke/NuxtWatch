# NuxtWatch – Sucharchitektur und Aufgabenplan

Status: Entwurf zur Freigabe. Dieses Dokument beschreibt ein Zielbild, keinen bestätigten Repository-Iststand. NuxtWatch ist aus dem Release `v0.0.1` von NextWatch entstanden. Die Aufgaben beziehen sich ausschließlich auf NuxtWatch.

## Ziel und gemeinsame Grundlage

Die gemeinsame Grundlage ist der Ablauf von der Nutzereingabe bis zur ausführbaren Suche, nicht ein bestimmtes Kriterium wie der Titel. Titel und Discovery sind Beispiele für Suchstrecken. Personen und Keywords können Kriterien einer Strecke sein oder, bei Bedarf, eine eigenständig aufrufbare Suche bilden. Gemeinsame Abläufe werden einmal implementiert. Keine generische Regel-Engine, keine zweite Routing-Matrix, kein neuer globaler Store.

| Baustein | Gemeinsame Regel |
| --- | --- |
| Interpretation | Das LLM schlägt eine Suchabsicht oder eine Änderung vor. Es wählt keine TMDB-Endpunkte und erfindet keine IDs. |
| Fachprüfung und Auflösung | Der Server prüft die Zulässigkeit und löst Begriffe bei Bedarf anhand einer zuständigen Quelle auf. Bei unklarer Zuordnung bleibt die konkrete Änderung offen; bestätigte Kriterien bleiben unverändert. |
| Ausführbarkeit | Ein formal gültiges Suchobjekt muss noch nicht ausführbar sein. Die Fachlogik prüft die Mindestangaben und ob alle bestätigten Kriterien abbildbar sind. Sie liefert entweder einen konkreten Aufruf mit Parametern oder einen fachlichen Grund, warum noch nicht gesucht werden kann. |
| Ausführung | Erst `execute` startet die eigentliche Treff ersuche. Kandidatenabfragen zur Auflösung können bei `refine` stattfinden, sind aber keine Ausführung der Nutzersuche. |
| Suchsession | Bestätigte Kriterien bleiben zwischen Nachrichten erhalten. Eine offene fachliche Klärung und ein laufender Request sind getrennte Zustände, keine globalen Session-Phasen. |

Pro Strecke definiert die Fachlogik unterstützte Kriterien, zulässige Kombinationen, Mindestangaben, benötigte Kataloge oder Kandidatenabfragen und die Abbildung auf TMDB. Ein bestätigtes Kriterium wird nicht stillschweigend weggelassen; es gibt keinen automatischen Wechsel auf eine fachlich andere Suche. Die Matrix registriert die Zuständigkeit und dupliziert diese Regeln nicht.

## Architekturblöcke

| Block | Zuständigkeit | Ort im Zielbild |
| --- | --- | --- |
| Schemas | Getrennte Zod-Verträge für Kriterien, Aktionsrequests, Modellvorschläge und fachliche Ergebnisse; TypeScript-Typen ableiten | `src/lib/schemas/search.ts` |
| Endpunkte | Ausführbarkeit, Parametermapping und TMDB-Aufruf | Fachfunktion und TMDB-Adapter, registriert in `matrix.ts` |
| LLM-Anfragen | Auftrag und relevanten Kontext je Strecke und Aktion auswählen | `matrix.ts`, `llm.ts`, Fachdatei |
| LLM-Antwortprüfung | Erst Form, dann fachliche Zulässigkeit und Zielbindung prüfen; keine Teilanwendung | `flow.ts`, Schema und Fachdatei |
| Guardrails | Gemeinsame Anweisungen und kontextabhängige Freigaben; verbindliche Prüfung im Code | `llm.ts` und Fachfunktionen |
| Frontend | Chat, Laufstatus, Wizard, Filter und Treffer; Texte über i18n | UI-Etappe; keine eigene Fachmatrix |
| Router-Pfade | Eine interne POST-Route pro eigenständig aufrufbarer Strecke, nicht pro Aktion oder TMDB-Endpunkt | `server/api/search/<strecke>/index.post.ts` |

## Ordnerstruktur

```text
server/
  api/search/title/index.post.ts   # defineSearchPost('title'), erster Umsetzungsschnitt
  services/search/
    matrix.ts                     # Laufzeitregister pro Strecke
    flow.ts                       # HTTP-Einstieg, executeSearch, refineSearch
    llm.ts                        # Transport und Promptbausteine
    title.ts                      # Titelfachregeln
  services/tmdb/                   # vorhandener Transport und Adapter
src/lib/schemas/search.ts          # gemeinsame Suchverträge
```

Weitere Fachdateien entstehen erst mit einem unterstützten Fall. Eine Fachfunktion kann intern genutzt werden, ohne eine eigene Route zu bekommen. Detail- und Trending-Routen bleiben außerhalb dieses Umbaus.

## Route, Matrix und Ablauf

Die POST-Route erwartet eine explizite `action`. `defineSearchPost` liest den Body und delegiert. Das zur Aktion passende Requestschema wird einmal angewendet. Die Matrix registriert die Aktionen einer Strecke, führt sie aber nicht selbst aus. Fehlende Aktionen werden zurückgewiesen und nicht aus optionalen Feldern erraten.

| Aktion | Matrixeintrag | Ergebnis |
| --- | --- | --- |
| `execute` | Requestschema und zuständige Fachfunktion für Ausführbarkeitsprüfung und TMDB-Aufruf | Treffer, fachlicher Grund für Nichtausführbarkeit oder technischer Fehler; kein LLM-Aufruf |
| `refine` | Requestschema, LLM-Anfrageaufbau, Vorschlagsschema und Fachprüfung | Bestätigte Kriterien, Rückfrage oder unverändertes Ergebnis; bei Bedarf Kandidatenauflösung, keine eigentliche Treff ersuche |

Die Fähigkeit, ein Kriterium auszuführen, ist unabhängig davon, ob das LLM es setzen darf. So kann ein direkt übergebenes Serienjahr suchbar sein, ohne dass der Parser es setzen darf. Die Titelstrecke wählt zwischen Multi-, Film- und TV-Suche. Der alte Pfad `/api/search/title/refine` entfällt erst nach Migration der tatsächlichen Aufrufer oder einer ausdrücklich geplanten Übergangsphase.

## Schemas und Anwendung

- Das Suchobjekt enthält bestätigte Kriterien. Der gemeinsame Vertrag setzt keinen Titel voraus; der erste Umsetzungsschnitt implementiert nur die verifizierten Titelfälle, keine vorsorglichen optionalen Keyword- oder Personenfelder.
- Ein gemeinsames `mediaTypeSchema` für `all`, `movie`, `tv`; Kriterien und Änderungsvorschlag teilen die Wertedefinition. Die Fachlogik entscheidet, welche Werte je Strecke ausführbar sind.
- Änderungen haben eine gemeinsame Form, etwa `{ field: 'mediaType', value: 'movie' }`. Das Feld bestimmt den Wertetyp. Erlaubte Operationen können je Strecke und Kontext begrenzt sein.
- Der Vorschlag ersetzt nie das gesamte Suchobjekt. Die Fachfunktion prüft den gesamten Vorschlag vor der Übernahme. Bei einer gekoppelten Änderung wie „Film von 1999“ werden Typ und Jahr gemeinsam übernommen oder nicht angewendet.
- LLM-Vorschlag, bestätigte Kriterien, offene Klärung und Suchtreffer bleiben unterscheidbar. Die Oberfläche übernimmt nur bestätigte Kriterien.

## LLM und Tokenbudget

Das Modell interpretiert freie Eingaben, schlägt Änderungen vor oder meldet Klärungsbedarf. Es ändert keinen Zustand. Der Anfrageaufbau kombiniert knappe Grundanweisungen, aktuell erlaubte Operationen und relevanten Kontext. Keine vollständige Historie, Trefferliste, Übersetzungssammlung oder Regeln fremder Strecken standardmäßig mitsenden. Die sichtbaren Fähigkeiten aus fachlichen Freigaben ableiten. Unbekannte Ziele, unzulässige Operationen und ungültige Ausgaben werden im Code abgefangen. Für Vergleiche denselben Testfallbestand verwenden und Eingabetokens sowie unveränderte fachliche Entscheidungen prüfen.

## Suchsession, UI und Wizard

Die Suchansicht hält bestätigte Kriterien zwischen Nachrichten und sendet bei `refine` und `execute` die jeweils benötigten Kriterien mit. Der Server validiert sie erneut. Im ersten Schnitt sind weder ein neuer globaler Store noch serverseitige Session-Persistenz vorgesehen. Wiederherstellung nach Reload ist nicht zugesichert. Eine verspätete Antwort darf neuere Kriterien nicht überschreiben.

Die UI verwendet gemeinsame Bausteine pro Kriterium. Werte können aus gemeinsamen Verträgen kommen; Labels, Bedienung und Übersetzungen bleiben UI-Aufgaben. Die UI importiert keine serverseitige Matrix und leitet aus gültigen Enum-Werten keine Parser-Freigaben ab.

| Anzeige | Verhalten |
| --- | --- |
| Laufstatus | Vorübergehend, kein Chatverlaufseintrag und keine Filteränderung. Zuerst lokal beim Warten, später optional echte serverseitige Statusereignisse über dieselbe Route. |
| Rückfrage | Der Wizard zeigt die übersetzte Frage und nur angebotene Optionen oder Aktionen. Bestätigte Kriterien bleiben bis zur gültigen Antwort unverändert. |
| Bestätigung oder Hinweis | Nach fachlichem Ergebnis; bestätigt keine nicht übernommene Änderung. |
| Technischer Fehler | Sicherer lokalisierter Fehlercode; keine internen Details in der UI und keine Übernahme unverifizierter Änderungen. |

Der Wizard ist ausschließlich für konkrete Klärungen zuständig. Als Eingabe genügen ein Nachrichtencode mit Parametern, eine lokale Zielkennung, angebotene Aktionen und bei Bedarf Kandidaten. Eine Auswahl sendet der Wizard mit Ziel- und Optionskennung an den Server, nicht als manipulierte rohe Modellantwort. Der Server prüft Ziel und Option und ergänzt erst dann das bestätigte Suchobjekt. Andere offene Klärungen bleiben offen. Ein Auswahlklick startet weder Modellaufruf noch Suche; ein späteres `execute` verwendet die bestätigten Kriterien. Freie Antworten, Reihenfolge mehrerer Klärungen, Ablage offener Klärungen und der HTTP-Aktionsname bleiben offen. `discard` betrifft ausstehende Anfragen, nicht akzeptierte Einträge.

## Discovery und Auflösung als spätere Anwendungsfälle

Discovery sucht anhand strukturierter Filter und ist kein Fallback für die Titelsuche. Unterstützte Filter, Mindestangaben und Mapping werden je Medientyp festgelegt. Sortierung ist kein Filter: „gut bewertet zuerst“ ist nicht dasselbe wie „mindestens 7 von 10“. Aus „gut“ wird ohne Produktregel keine Mindestbewertung abgeleitet.

Ein Genre-Katalog wäre eine fachliche Quelle, kein Teil der Session und keine Voraussetzung für andere Strecken. Quelle und Namenszuordnung bleiben offen. Für Keywords ist `/search/keyword` die Referenz zur Kandidatensuche; erst eine bestätigte Keyword-ID geht als `with_keywords` in einen Discover-Aufruf ein. Die Auflösung braucht keine eigene Frontend-Route. Bei Personen und Keywords ist zu prüfen, welche Paginierungsmetadaten bis zur Fachlogik gelangen. Ein einzelner angezeigter Kandidat allein belegt keine Eindeutigkeit.

## Aufgaben nach Freigabe

| ID | Aufgabe | Abnahme |
| --- | --- | --- |
| A1 | Titelstrecke und Aufrufer inventarisieren; Contracts, Dateien und Tests erfassen; Wizard-Dokument mit Entwurf abgleichen | Ist-/Ziel-Zuordnung, Migrationsliste und dokumentierte Abweichungen liegen vor |
| A2 | Titelverträge und Referenzfälle festhalten | Direkte TV-Suche und Film-Verfeinerung sind unterscheidbar getestet; ungültige Vorschläge und Teilanwendung ausgeschlossen |
| A3 | Gemeinsame Matrix und Ablauf einführen, Titellogik bündeln | Ein Einstieg in der Matrix; bisheriges fachliches Verhalten bleibt erhalten; direkte Suche ohne LLM, Verfeinerung ohne Titelsuche |
| A4 | Gemeinsame Titelroute migrieren | Beide Aktionen unter derselben URL, unbekannte Aktionen abgelehnt, Aufrufer migriert oder Übergang abgesichert |
| A5 | Rückfragevertrag und Wizard zunächst mit Beispieldaten prüfen | Titel-Rückfrage und Personen-Auswahl in derselben UI, mindestens zwei Sprachbeispiele, Auswahl erst nach Serverbestätigung wirksam; altes Ziel wird nicht übernommen |
| A6 | Promptumfang und UI-Status prüfen | Kontextbezogene Instruktionen; Ladeanzeige endet bei Ergebnis, Fehler oder Abbruch; keine vorgetäuschten Suchschritte |
| A7 | Keyword als weiteren Architekturfall bewerten | Gemeinsamkeiten und nötige Fachfunktionen belegt; Route und Verfeinerung nur bei echtem Bedarf; Paginierungsmetadaten am NuxtWatch-Stand geprüft |

A1–A4 bilden den ersten technischen Schnitt, definieren aber nicht den allgemeinen Suchablauf. A5–A7 begründen keine sofortige Umsetzung der UI oder weiterer Suchstrecken. Nach dem Schnitt relevante Tests, Coverage-Prüfung, ESLint und Typecheck ausführen.

## Offene Grenzen

- Änderungen an bereits akzeptierten Entitäten und gekoppelte Ersetzungen sind nicht Bestandteil des ersten Titelschnitts.
- Detaillierte Prompt- und Wizard-Flows, optionale Statusstreams und weitere Suchstrecken werden separat spezifiziert. Die Wizard-Dokumentation wurde für diesen Entwurf nicht im Repository verifiziert.
