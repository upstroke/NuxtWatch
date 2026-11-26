# Übersetzbare Anwendungstexte

Stand: 21. November 2026. Verbindliches Architekturziel, noch keine implementierte Mehrsprachigkeitsinfrastruktur. [Konzept](../search-architecture-concept.md), [Wizard](clarificaton-wizzard-flow.md).

## Jetzt: eine zentrale Datei

Als nächster Umsetzungsschnitt ist `server/services/search/texts.ts` vorgesehen. Zunächst tatsächlich benötigte Anwendungstexte und Fragezuordnungen zentral pflegen. Keine neue Bibliothek, vollständigen Sprachdateien oder Prüfinfrastruktur allein für den Durchstich. Deutschsprachige Entwürfe legen keine neue globale Standardsprache fest.

Fachliche Bewertung liefert Grund, betroffene Kriterien und Parameter. Die Anwendung ordnet eine Frage mit Antwortvertrag zu; die zentrale Textverwaltung liefert die Formulierung. Terminal und Web-UI erfinden keine eigenen Fachfragen. Konkreter Auslieferungsvertrag für Textschlüssel/gerenderten Text und Locale ist beim Umbau festzulegen; keine Serverimporte im Browser.

Fachwerte (`movie`, `tv`), Fragetyp und `questionId` bleiben sprachunabhängig. Das gilt nicht automatisch für freie LLM-Nachrichten: Sie sind Modellausgabe in der Nutzersprache, keine stabilen Katalogschlüssel. Systematisch erzeugte Optionen dürfen nicht aus dem freien Fragetext extrahiert werden.

## Benötigte Schlüssel und Textentwürfe

| Schlüssel                                   | Deutscher Entwurf / Parameter                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `clarification.mediaType.required_for_year` | Meinst du einen Film oder eine Serie?                                                                          |
| `clarification.mediaType.movie`             | Film                                                                                                           |
| `clarification.mediaType.tv`                | Serie                                                                                                          |
| `clarification.mediaType.unresolved`        | Ich konnte deine Antwort keinem Medientyp zuordnen. Bitte wähle eine Option oder präzisiere deinen Suchwunsch. |
| `clarification.answer.accepted`             | „{label}“ wurde übernommen.                                                                                    |
| `clarification.answer.stale`                | Deine Suchangaben haben sich inzwischen geändert. Diese Antwort wurde nicht übernommen.                        |
| `clarification.action.apply`                | Übernehmen                                                                                                     |
| `search.action.execute`                     | Suche starten                                                                                                  |

Entwürfe, kein bereits produktiver Katalog. Gültige Antworten mit weiterer Folgefrage nicht als Fehler darstellen. Sichere technische Fehlerrückmeldungen von fachlicher Unklarheit und leeren Ergebnissen unterscheiden. Keine universelle Aufforderung ohne konkreten Grund.

## Später: gemeinsame Schlüssel und Sprachen

Ein sprachunabhängiger Katalog definiert Pflichtschlüssel und benannte Platzhalter; Typen daraus ableiten, keine zweite manuelle Schlüsselliste. Jede konfigurierte Sprache erhält dieselben Schlüssel. Unterstützte Sprachen explizit konfigurieren, damit auch vollständig fehlende Sprachdateien auffallen. Deutsch ist nicht automatisch die Vollständigkeitsquelle.

Ein späterer Check meldet je Sprache fehlende/unlesbare/ungültige Datei, fehlende und unbekannte Schlüssel, leere oder nichttextuelle Werte sowie fehlende oder zusätzliche Platzhalter. Reihenfolge/Wiederholung erlaubter Platzhalter und identische Übersetzungen sind nicht grundsätzlich Fehler. Fehlercode bei Verstößen; Fallback verdeckt keine Lücke. Kein automatisches Erzeugen vermeintlicher Übersetzungen. Der Check prüft Struktur, nicht sprachliche Qualität.

Dateiformat, Locale-Konfiguration, Laden, Fallback und genaue Platzhaltersyntax bei Bedarf festlegen. Internationalisierung bleibt im Konzept, blockiert aber keinen Durchstich durch vorgezogenen Vollausbau.
