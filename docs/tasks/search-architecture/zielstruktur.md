# Zielstruktur der gemeinsamen Suche

Diese Übersicht hält fest, wo welche Entscheidung hingehört. Stand: 20. November 2026, erster Submit-Schnitt bis `d0acd57`. Die Titelsuche ist der erste Durchstich, nicht die Vorlage für getrennte Parser pro Suchstrecke. Siehe [Arbeitsstand](README.md), [Interaktionsentscheidungen](interaction-state-decisions.md), [Architekturkonzept](../../sucharchitektur-konzept.md) und [CLI-Abnahme](cli-abnahme.md).

| Status | Pfad | Zuständigkeit |
| --- | --- | --- |
| Vorhanden | `src/lib/parser/instructions.ts` | Versionierte Systemanweisungen. Nutzerdaten bleiben getrennt. |
| Vorhanden | `server/services/search/llm.ts` | Modellaufruf mit separater Systemanweisung und Nutzernachricht; keine Suchlogik. `LlmConfig` leitet sich vom Runtime-Vertrag ab. |
| Vorhanden | `server/services/search/parser.ts` | Gemeinsamer Einstieg `parseSearchProposal`. Erzeugt und validiert streckenoffene Vorschläge. Der erste Vertrag erlaubt Titel, Medientyp und Jahr; daraus folgt kein eigener Titelparser. |
| Vorhanden / zu ergänzen | `server/services/search/coordinator.ts` | `submitSearch` wendet validierte Änderungen auf eine Kopie an. `decideSearch` bewertet die Titelsuche als ausführbar, klärungsbedürftig oder nicht unterstützt. Keine Speicherung und keine TMDb-Aufrufe. Konkrete Rückfragebindung fehlt noch. |
| Vorhanden / zu ergänzen | `server/services/search/workflow.ts` | Frameworkfreier Suchablauf. Besitzt `SearchState` und den internen Auftragstyp. `openSearchRequest` eröffnet und ersetzt Aufträge mit Revision 1. `submitForSession` prüft Aktualität, übernimmt geänderte Kriterien samt Revision vor der Suche und gibt reguläre Ergebnisse mit `requestId` und `revision` zurück. |
| Vorhanden | `server/services/search/submit.ts` | `searchSubmission` führt bewertete, unterstützte direkte Suchen aus. `submitAndSearch` bleibt kombinierter Einstieg ohne Session-Lebenszyklus. Keine Cookie-/Storage-Zugriffe. |
| Vorhanden / zu ergänzen | `server/api/search.post.ts` | HTTP-Einstieg für `submit` und `reset`: Eingaben und Runtime-Konfiguration validieren, Session zuordnen, Abhängigkeiten bereitstellen, Suchablauf aufrufen und Fehler abbilden. `clarify` und `execute` fehlen noch. |
| Vorhanden | `server/utils/search-session.ts` | Cookie-Zuordnung, prozesslokale Ablage, Ablaufzeit und Kapazitätsgrenze. Speichert den fachlichen Zustand, entscheidet aber nicht über Auftragseröffnung, Ablösung oder Revision. |
| Vorhanden / zu ergänzen | `src/lib/schemas/search-request.ts` | Externer HTTP-Eingabevertrag für `submit` und `reset`; keine Client-Ersatzkriterien. Spätere Aktionsverträge hier ergänzen. |
| Vorhanden | `src/lib/schemas/runtime-config.ts` | TMDb- und LLM-Runtime-Verträge mit abgeleiteten Typen. Validierung an der jeweiligen Runtime-Grenze. |
| Vorhanden / zu ergänzen | `server/services/tmdb/` | Transport, Provider-Aufrufe und Treffer-Mapping. Direkte Titelsuche über `/search/multi` vorhanden; spezifische Film-/TV-Wege bleiben zu ergänzen. Der Adapter entscheidet nicht, was der Nutzer gemeint hat. |
| Vorhanden | `src/lib/schemas/ui/search-result-card.ts` | Normalisierte Karten für Film- und Serientreffer; kein Modellvorschlags- oder HTTP-Eingabevertrag. |
| Vorhanden / zu ergänzen | `scripts/search.mjs` | Interaktiver HTTP-Client mit Cookie-Mitnahme und serverseitigem Reset. Allgemeiner Freitext ist `submit`; gebundene Antworten und Auswahllisten fehlen noch. |

## Grenzen für die Weiterarbeit

- HTTP-Routen behandeln Transport und Grenzvalidierung; fachliche Übergänge liegen im Suchbereich. Session-/Storage-Anbindung bleibt davon getrennt. Interne Zustandstypen gehören zum besitzenden Fachmodul, nicht automatisch in `src/lib/schemas`. Externe Verträge und daraus abgeleitete Typen folgen [Typing](../../typing.md).
- Der erste Submit-Schnitt nutzt explizite Funktionen. Eine State-Machine-Implementierung ist möglich, aber keine Bibliothek oder generische Infrastruktur beschlossen.
- Gemeinsame Methoden sind der Standard. Eigene Methoden kommen erst hinzu, wenn tatsächlich unterschiedliches Verhalten sie erfordert. Film und Serie brauchen keinen eigenen Parser; unterschiedliche Jahresparameter gehören zur TMDb-Ausführung.
- Kriterien, HTTP-Verträge und Modellvorschläge bleiben getrennt. Gemeinsame fachliche Werte nicht pro Schicht neu definieren. Ein gültiger Modellvorschlag ist weder eine Bestätigung noch ein ausführbarer Suchauftrag.
- Direkt ausführbare Suchen können bei `submit` starten. Geplant bleibt: Nach einer Rückfrage übernimmt `clarify` nur die Antwort; erst das ausdrückliche `execute` startet die Suche. Beide Aktionen sind noch nicht implementiert.
- Bestätigte Kriterien, offene Klärung und laufende Requests bleiben getrennt. Die aktuelle In-Memory-Ablage ist keine dauerhafte oder instanzübergreifende Session-Lösung. Zusätzliche Dateien, Stores oder Datenbanken nicht vorsorglich anlegen.
- Discovery, Genre-Katalog, Jahresbereiche und Keyword-Auflösung sind spätere Anwendungsfälle, keine vorab festgelegten Parser oder Methoden. Geplante Pfade und konzeptionelle Diagramme sind kein Iststand.
