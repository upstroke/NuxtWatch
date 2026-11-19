# NuxtWatch – Sucharchitektur und Aufgabenplan

Status: Zielbild, kein bestätigter Repository-Iststand. NuxtWatch ist aus NextWatch v0.0.1 entstanden. Die Aufgaben betreffen nur NuxtWatch.

## Gemeinsame Grundlage

Die Anwendung führt von freier Eingabe zur ausführbaren Suche. Titel und Discovery sind Beispiele für Suchstrecken; Personen und Keywords können Kriterien oder bei Bedarf eigenständig aufrufbare Suchen sein. Keine generische Regel-Engine, zweite Routing-Matrix oder neuer globaler Store.

- Das LLM schlägt Lesarten und Kriterienänderungen vor, ändert keinen Zustand, erfindet keine IDs und wählt weder Suchstrecke noch TMDb-Endpunkt.
- Die Matrix (`matrix.ts`) registriert Suchwege und Fachfunktionen. Sie dupliziert keine Fachregeln. `flow.ts` koordiniert die Prüfung. Jeder infrage kommende Suchweg prüft denselben Kriterienstand je Lesart, unabhängig von der Reihenfolge.
- Die Fachlogik prüft unterstützte Kriterien und Kombinationen, Mindestangaben und nötige Auflösungen. Sie meldet ausführbar, Klärung nötig oder nicht unterstützt, jeweils mit Grund, wo erforderlich. Ausführbar heißt: Alle bestätigten Kriterien werden in ihrer gemeinten Bedeutung berücksichtigt, Mindestangaben sind erfüllt und notwendige Auflösungen abgeschlossen. Kein bestätigtes Kriterium wird stillschweigend weggelassen. Kandidatenabfragen sind keine Treffersuche.
- Bei einem eindeutigen fachlichen Ziel wählt die Anwendung einen ausführbaren technischen Weg und die TMDb-Parameter. Mehrere fachlich gleichwertige Wege sind keine Nutzerfrage. Bei mehreren plausiblen, fachlich unterschiedlichen Zielen entscheidet der Nutzer, was er meint, nicht welchen Endpunkt die Anwendung aufruft. Diese Frage kann vor vollständiger technischer Ausführbarkeit nötig sein. Ohne sinnvolle Klärungsmöglichkeit oder unterstützten Suchweg erklärt die Anwendung den Grund; kein stiller Wechsel des Suchziels.

Beispiel: Bei „Batman ab 2010“ bleibt die Jahresuntergrenze erhalten. Falls „Batman“ Titelbegriff oder Figur meinen kann, klärt der Wizard diese Bedeutung. Dass eine Titelsuche leichter ausführbar wäre, ist kein Grund, sie zu bevorzugen. Die Figurensuche ist hier ein konzeptionelles Beispiel, keine zugesicherte Funktion.

## Technischer Einstieg und Auftragsbindung

Der freie Suchschlitz verwendet `POST /api/search`. Die Route validiert die explizite Aktion und delegiert an `flow.ts`; unbekannte Aktionen werden abgelehnt. Streckenspezifische Routen können für bekannte strukturierte Aufrufe bestehen bleiben. Detail- und Trending-Routen bleiben unverändert.

| Aktion    | Verhalten                                                                                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submit`  | Nimmt Suchtext und aktuelle Kriterien entgegen. Ohne Klärungsbedarf startet die ausführbare Suche direkt auf den ausdrücklichen Auftrag hin. Sonst folgt eine konkrete Rückfrage oder ein begründeter Hinweis.                                                                |
| `clarify` | Übernimmt eine geprüfte Antwort oder verarbeitet eine Präzisierung. Nach erfolgreicher Übernahme liefert die Anwendung den bestätigten Kriterienstand und meldet die nächste nötige Frage, Ausführbarkeit oder den Grund der Nichtausführbarkeit. Startet keine Treffersuche. |
| `execute` | Startet die Suche nach einer ausdrücklichen Freigabe. Der Server prüft erneut den gebundenen, vollständig geklärten Kriterienstand. `execute` übernimmt keine Antwort.                                                                                                        |

`submit` und `execute` nutzen dieselbe interne Ausführungsfunktion. Die Suchsession mit bestätigten Kriterien, offene Klärungen und laufende Requests sind getrennt; keine globale `pending`-Phase. Der Server hält kurzlebigen Auftragszustand, keine dauerhaft gespeicherte Suchsession. Wiederherstellung nach Reload ist nicht zugesichert.

- `requestId` identifiziert den Auftrag; die UI verwendet sie beim Wiederholen desselben Requests erneut. Eine bewusst neue Suche erhält eine neue ID. Dieselbe ID darf nicht für einen abweichenden Auftrag wiederverwendet werden.
- `revision` bindet Antworten und Ausführung an den aktuellen Kriterienstand. Jede übernommene Klärung erhöht die Revision. `questionId` bindet die Antwort an die konkrete offene Frage; Optionskennungen werden serverseitig geprüft. Änderungen am Kriterienstand machen alte Antworten unwirksam und erfordern eine erneute Prüfung der Rückfrage.
- Der Server beansprucht die Ausführung für den geprüften Auftragsstand atomar vor dem TMDb-Aufruf. Wiederholte Starts melden den laufenden Auftrag oder liefern dessen Ergebnis, statt einen weiteren Aufruf zu starten. Die konkrete Speicherwahl bleibt offen; lokaler Speicher allein bietet keine instanzübergreifende oder neustartfeste Garantie.

## Kriterienstand und Wizard

Unabhängig geklärte Kriterien können bereits während einer offenen Klärung bestätigt werden. Fachlich gekoppelte Änderungen werden gemeinsam geprüft und übernommen oder gar nicht. Eindeutige Änderungen desselben Kriteriums im Suchtext ersetzen beim nächsten Absenden den alten Wert; andere bestätigte Kriterien bleiben erhalten. Bei „Batman ab 2010“ → „Batman ab 2020“ ersetzt `Ab 2020` die alte Jahresuntergrenze.

Die UI importiert keine Servermatrix und sendet keine rohe Modellantwort als Nutzerentscheidung. Laufstatus ist flüchtig und verändert weder Kriterien noch Chatverlauf. Technische Fehler übernehmen keine unverifizierten Änderungen. Wird der gebundene Auftrag ungültig, darf eine verspätete Antwort keine neueren Kriterien überschreiben oder das Overlay erneut öffnen.

Der verbindliche UI-Ablauf einschließlich Frageseiten, Pill-Übersichten, Schaltflächen und Rückkehr zur Eingabe steht in der [Wizard-Spezifikation](clarificaton-wizzard-flow.md).

## Verträge und Struktur

Der Baum zeigt das Zielbild, nicht den aktuellen Repository-Stand. Neue Dateien entstehen erst, wenn der jeweilige Umsetzungsschritt sie braucht.

```text
server/
├── api/
│   └── search/
│       └── index.post.ts   # Gemeinsamer Einstieg: POST /api/search
└── services/
    ├── search/
    │   ├── flow.ts        # Koordination des Suchablaufs
    │   ├── matrix.ts      # Register der Suchwege und Fachfunktionen
    │   ├── title.ts       # Fachlogik der Titelstrecke
    │   └── llm.ts         # Modelltransport und Promptbausteine
    └── tmdb/              # Vorhandener TMDb-Transport und Adapter

src/
└── lib/
    └── schemas/
        └── search.ts      # Gemeinsame Zod-Verträge und abgeleitete Typen
```

- `src/lib/schemas/search.ts`: Zod-Verträge für Kriterien, Aktionen, Modellvorschläge und Ergebnisse; TypeScript-Typen ableiten. Kein gemeinsamer Titelzwang und keine vorsorglichen Personen- oder Keyword-Felder im ersten Schnitt. Gemeinsames `mediaTypeSchema` (`all`, `movie`, `tv`); Fachlogik entscheidet über Ausführbarkeit. Änderungsvorschläge wie `{ field: 'mediaType', value: 'movie' }` ersetzen nie das ganze Suchobjekt.
- `server/api/search/index.post.ts`: gemeinsamer HTTP-Einstieg.
