# Klärungs-Wizard – Terminal und spätere Web-UI

Stand: 21. November 2026. Aktualisierte Referenz für NuxtWatch; gemeinsames Verhalten nach [Konzept](../sucharchitektur-konzept.md), Umsetzung nach [Arbeitsstand](../tasks/search-architecture/README.md). Kein vollständiger Implementierungsnachweis. Der bestehende Dateiname bleibt bis zu einer gesonderten Umbenennung erhalten.

## Gemeinsamer Ablauf

- Ohne Klärungsbedarf darf ein ausdrücklicher Submit direkt suchen; keine vorgeschaltete Bestätigung allein wegen mehrerer erwarteter Treffer.
- Bei Klärungsbedarf zeigt die Oberfläche die gebundene Frage und bestätigte Kriterien. Angeboten werden nur serverseitig zulässige Optionen; eine allgemeine LLM-Frage hat zunächst nur Freitext, keine aus ihrem Wortlaut abgeleiteten Optionen.
- Auswahl wird ohne LLM gegen die konkrete Frage geprüft. Freitext bei offener Frage ist eine gebundene Antwort und wird mit ursprünglichem Suchwunsch, bestätigten Kriterien und Frageverlauf interpretiert.
- Nach Übernahme werden bestätigte Kriterien und nächste notwendige Frage beziehungsweise Ausführbarkeit angezeigt. Keine Treffersuche allein durch Antworten oder Anzeigen einer Übersicht.
- Erst ausdrückliches Execute startet nach Klärung die Suche mit dem gebundenen Serverstand. Clientseitige Ersatzkriterien umgehen die Bindung nicht.
- Ein ausdrücklich neuer Submit oder Reset bleibt möglich und löst den bisherigen Auftrag ab. Eine offene Pflichtfrage darf weder übersprungen noch mit ungeklärten Kriterien ausgeführt werden; sie sperrt den Nutzer aber nicht in einem unkündbaren Dialog ein.
- Ist kein Weg ausführbar und keine sinnvolle Rückfrage möglich, Grund erklären und Präzisierung/neuen Auftrag ermöglichen. Unabhängige Teilbestätigung ist Ziel, noch nicht vollständig umgesetzt.

## Terminal zuerst, bedarfsgerecht

Das Terminal ist eine alternative Oberfläche derselben HTTP-Aktionen, kein separater Parser-Testpfad. Fragen, Kriterien und einfache Auswahllisten genügen zunächst. `/submit TEXT`, `/reset` und ausdrückliches Execute bleiben unterscheidbar. Nicht den gesamten grafischen Wizard vorab nachbauen; pro Durchstich nur benötigte Interaktion ergänzen.

Treffer kompakt als Tabelle, Textkarte oder reduziertes Objekt darstellen, beispielsweise Titel, Typ und Jahr. ID plus Medientyp intern zur Identifikation erhalten. Keine vollständigen Providerobjekte in der Normalansicht. Fehler, leere Trefferliste und Treffer unterscheiden; frühere Ergebnisse nicht als Ergebnis einer neuen blockierten Revision ausgeben.

## Spätere grafische Darstellung

Overlay mit einer Frage je Seite, eindeutig erkennbarer Auswahl und „Übernehmen“ als Bestätigung. Nach Übernahme kann eine Kriterienübersicht als Pills folgen; geänderte Werte hervorheben. „Weiter“ führt zur nächsten Frage, „Suche starten“ ist nur auf ausführbarem Stand verfügbar. Neuer Auftrag/Reset bleiben explizite Auswege; grafische Abbruchdetails gesondert konkretisieren. Keine widersprüchliche Pflicht, einen ungeklärten Dialog zwingend bis zum Ende zu führen.

Die Web-UI importiert keine Servermatrix. Veraltete Antworten öffnen kein altes Overlay und überschreiben keine Kriterien. Lokalisierbare Texte, Tastaturbedienung und nachvollziehbarer Fokus bleiben Zielanforderungen. Detailseiten benötigen eine explizite Trefferauswahl, auch bei nur einem Treffer.

## Abnahme

Direkter Submit ohne unnötige Frage; ein-/mehrstufige gebundene Klärung; Auswahl/Freitext; Korrektur ohne Kriterienverlust; ausdrückliches Execute; Ablösung durch Submit/Reset; veraltete Aktionen abweisen; technische Fehler von leeren Ergebnissen unterscheiden. Grafische Fokus-/Pill-Details erst bei Umsetzung der Web-UI abnehmen.

![Historischer grafischer Wizard-Entwurf](../images/clarification-wizzard_dark_desktop.png)
