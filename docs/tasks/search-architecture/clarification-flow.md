# Task: gebundene Rückfragen und ausdrückliche Suchausführung

Status: fachlicher Entwurf; noch nicht implementiert. Ausgangspunkt ist der live bestätigte direkte HTTP-/CLI-Durchstich. Siehe [Arbeitsstand](README.md), [CLI-Abnahme](cli-abnahme.md) und [Teststrategie](../../testing.md).

## Ziel und Umfang

„Finde The Office von 2005“ führt über Medientyp-Klärung, bestätigte Kriterien und eine gesonderte Suchaktion zu TV-Treffern. Auswahl und freie Antwort sind unterschiedliche Eingaben, münden aber in dieselbe fachliche Prüfung. Bestehendes Direktverhalten für „The Matrix“ erhalten. Keine vorsorgliche Implementierung von Keyword-, Personen- oder Jahresbereichssuchen.

## Vorgeschlagener Vertrag

- `submit`: Eingabe interpretieren; direkt ausführen, wenn ohne Klärung ausführbar, sonst gebundene Rückfrage liefern.
- `clarify`: Antwort zur konkreten Frage prüfen, Kriterien übernehmen und neu bewerten; niemals eine Treffersuche starten.
- `execute`: den aktuellen bestätigten, ausführbaren Stand ausdrücklich ausführen; keine erneute LLM-Interpretation der Suchabsicht.
- `searchId` bindet an den Suchauftrag, `revision` an dessen Stand, `questionId` an die konkrete Frage. `kind` bezeichnet dagegen einen wiederverwendbaren fachlichen Fragetyp. Diese Namen sind Vertragsvorschläge, noch kein bestehender API-Vertrag.

Beispiel einer Frage innerhalb einer Serverantwort:

```json
{
  "searchId": "s_123",
  "revision": 2,
  "question": {
    "questionId": "q_7f3a",
    "kind": "select_media_type",
    "field": "mediaType",
    "textKey": "clarification.mediaType.required_for_year",
    "options": [
      { "value": "movie", "textKey": "clarification.mediaType.movie" },
      { "value": "tv", "textKey": "clarification.mediaType.tv" }
    ]
  }
}
```

`clarify` überträgt diese Bindung und entweder `answer: { type: 'selection', value: 'tv' }` oder `answer: { type: 'text', text: 'Die Serie, nicht den Film.' }`. `execute` referenziert den aktuellen bestätigten Stand; vom Client mitgeschickte Ersatzkriterien dürfen ihn nicht umgehen. Request-Verträge mit Zod definieren, Typen daraus ableiten.

## Antwortverarbeitung und Zuständigkeiten

1. Bindung und Aktualität prüfen; unbekannte, abgelaufene, beantwortete oder ersetzte Fragen nicht erneut anwenden.
2. Auswahl und strukturierte Werte ohne LLM gegen den konkreten Fragevertrag prüfen.
3. Freitext mit dem vorhandenen Parser interpretieren. Kontext ergänzen: offene Frage, Optionen/Kandidaten, bisherige Kriterien und erlaubte Änderungen. Das Modell schlägt Antwort oder Kriterienkorrektur vor, bestimmt aber weder Auflösungserfolg noch Suchweg oder Ausführung.
4. Vorschlag validieren, bei Bedarf fachlich auflösen und zulässige Änderungen übernehmen. Nach asynchroner Interpretation die Aktualität vor dem Übernehmen nochmals prüfen.
5. Kriterien und Suchmöglichkeiten neu bewerten. Weitere Klärung ergibt sich aus verbleibender Unklarheit beziehungsweise fehlenden Voraussetzungen, nicht aus einer festen Fragenliste. Ein gültiger Wert muss nicht bereits auf einem unterstützten Suchweg ausführbar sein.

„Keins davon“ und Änderungen des Suchauftrags nicht in eine falsche Auswahl zwingen. Nicht eindeutig interpretierbare Antworten verändern keine Kriterien. Technische Modellfehler getrennt behandeln; sie sind keine missverständliche Nutzerantwort. Regeln für gekoppelte Änderungen und unabhängige Kriterien während offener Klärung nicht beiläufig neu festlegen.

## Status und beobachtbare Übergänge

Fragezustand, Ergebnis der Antwortverarbeitung, Ausführbarkeit und laufende Requests bleiben getrennt; keine globale `pending`-Phase. Mögliche Fragezustände: `open`, `answered`, `superseded`. Exakte Ergebnis-Enums beim API-Entwurf festlegen.

| Ereignis | Beobachtbares Ergebnis |
| --- | --- |
| Gültige Antwort, weitere Frage nötig | Übernommene Entscheidung bestätigen, verbleibenden Klärungsgrund und nächste Frage liefern; kein Trefferaufruf. |
| Gültige Antwort, keine Frage mehr nötig, Suche ausführbar | Bestätigte Kriterien und Ausführbarkeit liefern; Overlay schließen, Kriterien als Pills anzeigen; Suche startet erst nach erneuter ausdrücklicher Aktion. |
| Antwort nicht zuordenbar oder weiterhin mehrdeutig | Kriterien erhalten; konkret erklären, was noch unklar ist und welche Antwort benötigt wird. |
| Keine Option passt | Kriterienspezifische Korrektur ermöglichen; keine falsche Auswahl erzwingen. |
| Antwort veraltet, Frage ersetzt oder bereits beantwortet | Nicht erneut anwenden; verständliche Rückmeldung und verfügbaren aktuellen Stand liefern. |
| Kriterien eindeutig, aber kein unterstützter Suchweg | Einschränkung erklären; nicht mit sinnlosen Rückfragen fortfahren. |
| `execute` bei offener Klärung oder veraltetem Stand | Nicht ausführen; passenden Grund zurückgeben. |
| Wiederholtes oder paralleles `execute` für dieselbe Freigabe | Keinen doppelten externen Suchaufruf auslösen. |

## Übersetzbare Texte

Eine zentrale Textdatei vorsehen; endgültigen Pfad und Dateiformat an die Projektstruktur anpassen. Fachlogik liefert Textschlüssel und benannte Parameter, Clients stellen Texte dar. Keine Übersetzungsbibliothek allein für diesen Schnitt einführen. Fachwerte wie `tv` und Fragekennungen sind unabhängig von Sprache und Formulierung.

Für diesen Schnitt benötigte Schlüssel und deutsche Textentwürfe:

| Schlüssel | Text |
| --- | --- |
| `clarification.mediaType.required_for_year` | Meinst du einen Film oder eine Serie? |
| `clarification.mediaType.movie` | Film |
| `clarification.mediaType.tv` | Serie |
| `clarification.mediaType.unresolved` | Ich konnte deine Antwort weder „Film“ noch „Serie“ zuordnen. Bitte wähle eine Option oder beschreibe, was du stattdessen suchst. |
| `clarification.answer.accepted` | „{label}“ wurde übernommen. |
| `clarification.answer.stale` | Deine Suchangaben haben sich inzwischen geändert. Diese Antwort wurde deshalb nicht übernommen. |
| `clarification.action.apply` | Übernehmen |
| `search.action.execute` | Suche starten |

Rückfrage- und Hinweistexte künftig nach Kriterium und konkretem Klärungsgrund gliedern, zum Beispiel `clarification.keyword.multiple_candidates` oder `clarification.yearRange.invalid_order`. Diese späteren Fälle jetzt nicht implementieren. Kein universelles „Eingabe präzisieren“ ohne Erklärung des ungelösten Problems. Gültige Antworten mit weiterer Folgefrage nicht als Fehler darstellen. Technische Fehler benötigen eigene sichere Rückmeldungen.

## Abnahme und Testinventur

| Zusicherung | Grenze | Vorhanden oder Lücke |
| --- | --- | --- |
| AC1: Direkt ausführbarer Titel benötigt keine zweite Freigabe. | Kontrollierte Integration / bestehender Live-Fall | Bestehende Suchtests und bestätigter Matrix-Durchstich erhalten; keine komplette doppelte Fallmatrix. |
| AC2: Office mit Jahr liefert eine gebundene Medientyp-Frage ohne Trefferaufruf. | Suchablauf mit kontrollierten externen Grenzen | Die bisherige Rückfrageprüfung deckt noch nicht die Auftragsbindung ab. |
| AC3: Auswahl „Serie“ bestätigt Kriterien ohne LLM- und Trefferaufruf. | Klärungsablauf | Neu. |
| AC4: Freitext wird mit Fragekontext interpretiert; unbrauchbare Antwort wird konkret erklärt, ohne Kriterien zu verlieren. | Parser-Vertragsgrenze / Klärungsablauf, unterschiedliche Zusicherungen | Neu; keine Tests für `llm.ts` ergänzen (Nutzerentscheidung). |
| AC5: Veraltete und doppelte Antworten überschreiben keinen neueren Stand; verspätete Modellantworten werden erneut auf Aktualität geprüft. | Klärungsablauf | Neu. |
| AC6: Erst ausdrückliches `execute` verwendet TV Search mit Titel und `first_air_date_year=2005`; keine doppelte Ausführung derselben Freigabe. | Ausführungsablauf und TMDb-Dienst, getrennte Zusicherungen | Neu; bestehendes Mapping wiederverwenden. |
| AC7: HTTP-Grenze validiert Aktionen und bildet Ergebnisse sicher ab; CLI zeigt Auswahl, Bestätigung und gesonderte Startaktion. | HTTP-Integration / manueller CLI-Durchstich | Neu; stabile Testkennungen gemäß Teststrategie vergeben. |

Vor Freigabe relevante automatisierte Lücken schließen. Keine dedizierten Tests für jedes Schema und keine Coverage-Ziele pro Datei. Dieser Dokumentationsschritt ändert weder Produktionscode noch Tests.

## Vor Umsetzung konkretisieren

- Speicher und Lebensdauer: begrenzter kurzlebiger In-Memory-Speicher auf einer Serverinstanz ist ein Vorschlag, keine beschlossene Hosting-Architektur. Ablauf, Neustart und Kapazitätsgrenzen verständlich behandeln.
- Bindung zwischen Suchsession und Auftrag, Ablösung durch neue Eingaben, Eigentümerschaft sowie Revisionserhöhung festlegen.
- Atomare Prüfung/Übernahme und Ausführungsreservierung einschließlich Fehler- und Wiederholungsverhalten festlegen; IDs allein verhindern keine Rennen.
- Ergebnis-Enums, HTTP-Statuscodes, Textdateipfad und Textparameter konkretisieren. Einen gemeinsamen Vertrag für CLI und spätere Weboberfläche verwenden.
