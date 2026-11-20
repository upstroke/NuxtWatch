# Entscheidung 1: Suchsession, Suchauftrag und Rückfrage

Am 20. November 2026 fachlich festgelegt; noch keine Laufzeitimplementierung. Ergänzt den [Rückfrage-Entwurf](clarification-flow.md), insbesondere dessen noch vorgeschlagene Auftragsbenennung. Siehe [Arbeitsstand](README.md).

## Begriffe und Kennungen

| Begriff     | Bedeutung                                                                                                       | Vorgesehene Kennung |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ------------------- |
| Suchsession | Zusammenhängender Suchkontext mit bestätigten Kriterien; keine globale Ausführungsphase und keine Anmeldung.    | `sessionId`         |
| Suchauftrag | Ein konkreter Suchversuch in einer Session, gegebenenfalls mit mehreren Klärungen. Kein einzelner HTTP-Request. | `requestId`         |
| Rückfrage   | Eine konkrete offene fachliche Entscheidung eines Auftrags; unabhängig von Fragevorlage und Sprache.            | `questionId`        |
| Revision    | Version des fachlichen Stands, gegen den eine Aktion geprüft wird.                                              | `revision`          |

Für die weitere Vertragsausarbeitung ersetzt `requestId` die bisher vorgeschlagene Auftragskennung `searchId`. Der fachliche Fragetyp bleibt `kind`; er ist keine konkrete Fragenkennung. Welche Kennungen jede Nachricht explizit tragen muss und worauf sich die Revision technisch genau bezieht, wird im nächsten Vertragsschritt festgelegt.

## Aktionen und Ablösung

- `submit` innerhalb derselben Session eröffnet einen neuen Suchauftrag und ersetzt deren noch offenen Auftrag. Ausgangspunkt sind die zuletzt bestätigten Kriterien. Nur ausdrücklich angeforderte und akzeptierte Änderungen verändern sie; nicht bestätigte Modellannahmen oder ungelöste Optionen werden nicht ungeprüft übernommen.
- `clarify` beantwortet eine konkrete Frage des bestehenden aktuellen Auftrags. Es ist kein neuer freier Suchauftrag und startet keine Treffersuche.
- Nach Ersetzung sind offene Fragen des alten Auftrags nicht mehr anwendbar. Bereits laufende Interpretationsergebnisse dürfen den aktuellen Stand nicht nachträglich überschreiben oder die alte Suche starten. Ersetzen bedeutet nicht automatisch, dass ein externer Aufruf technisch abgebrochen wurde.
- `/reset` beginnt einen neuen Suchkontext ohne übernommene Kriterien. Der Client darf alte Antworten nicht in den neuen Kontext übernehmen. Die serverseitige Umsetzung der Ablösung und Bereinigung folgt mit dem Session-Vertrag.
- Ein weiterer ausdrücklich ausgelöster `submit` kann bereits bestätigte Kriterien ändern oder entfernen. Er interpretiert jedoch keine isolierte Antwort stillschweigend als Antwort auf eine inzwischen ersetzte Frage.
- Ohne Klärungsbedarf darf der neue direkt ausführbare Auftrag sofort suchen. Nach `clarify` bleibt die gesonderte ausdrückliche Aktion `execute` erforderlich.

## Beobachtbare Beispiele und Abnahme

1. Auftrag A fragt für „The Office von 2005“ nach dem Medientyp. Ein neuer `submit` in derselben Session erzeugt Auftrag B auf Basis der bestätigten Kriterien und ersetzt A.
2. Eine anschließend eintreffende Antwort auf A verändert weder B noch dessen Kriterien. Es startet dadurch keine Treffersuche.
3. Eine gültige `clarify`-Antwort auf die aktuelle Frage von B bleibt innerhalb von B, übernimmt die erlaubte Entscheidung und bewertet weiteren Klärungsbedarf; kein Trefferaufruf.
4. Nach `/reset` beginnt die nächste Suche ohne Kriterien aus dem bisherigen Kontext. Alte Antworten bleiben dem alten Kontext zugeordnet.
5. Der bestehende direkt ausführbare Matrix-Fall benötigt weiterhin keine zweite Freigabe.

Diese Zusicherungen bei der Implementierung an der Suchablaufgrenze mit kontrollierten externen Abhängigkeiten prüfen. Bestehende Direktpfadtests erhalten, keine identische Fallmatrix an mehreren Grenzen wiederholen. Dieser Dokumentationsschritt ergänzt keine Tests.

## Nicht mitentschieden

Speichertechnologie, Single-Instance-Annahme, Lebensdauer, Kapazitätsgrenzen, Eigentümerschaft/Zugriffsschutz, konkrete Revisionserhöhung, atomare Übergänge, Schutz vor doppelter Ausführung, HTTP-Ergebnisverträge und Übersetzungsdateipfad bleiben offen. Kennungen allein lösen diese Fragen nicht.

Produktionscode, HTTP-Vertrag und CLI-Verhalten sind durch diese Entscheidung noch nicht geändert. Die aktuelle CLI sendet weiterhin den letzten Server-Kriterienstand; serverseitige Session- und Auftragsbindung ist erst umzusetzen.
