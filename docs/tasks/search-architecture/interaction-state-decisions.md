# Suchablauf, Interpretation und Terminal-Interaktion

Gesprächsstand vom 20. November 2026, 11:50 Uhr. Ergänzt [Entscheidung 1](session-request-decision.md), den [Rückfrageentwurf](clarification-flow.md) und den [Arbeitsstand](README.md). Bei abweichenden älteren Aussagen gelten die hier ausdrücklich festgehaltenen neueren Entscheidungen. Beispiele und offene Vorschläge sind keine bereits implementierten Fähigkeiten. Die Tree-Ansichten sind konzeptionelle Darstellungen, kein Dateibaum und noch kein vollständiger ausführbarer Statechart.

## Arbeitsweise und aktueller Umfang

Architektur wird explorativ entwickelt; vereinbarte Schritte können anschließend implementiert werden. Aktuell dient ausschließlich das Terminal als UI. Web-UI-Gestaltung und Recherche zu deren Best Practices folgen später. Für diesen Dokumentationsschritt werden weder Produktionscode noch Tests geändert oder Checks ausgeführt. Tests bleiben vorerst zurückgestellt.

Die Session-Grundlage wurde mit `c77825c` implementiert: serverseitige Kriterien, Cookie-Zuordnung, Cookie-Mitnahme in der CLI und serverseitiger Reset. Der freigegebene Code verwendet eine prozesslokale Map mit 30 Minuten Inaktivitätsfrist und maximal 1.000 Sessions. Diese implementierten Startwerte sind keine explorativ hergeleiteten dauerhaften Betriebsanforderungen. `clarify`, `execute` und die konkrete Auftrags-/Fragebindung sind noch nicht implementiert. Dieser Nachtrag implementiert sie nicht.

## Architekturübersicht

```text
Terminal-UI
├── bestätigte Kriterien anzeigen
├── Ergebnisinformationen anzeigen
├── konkrete Aktionen als Auswahlliste anbieten
└── Eingabeabsicht eindeutig übermitteln
    │
    ▼
Serverseitige Anwendung
├── Suchablauf-State-Machine
│   ├── Session, Auftrag und Revision zuordnen
│   ├── bestätigte Kriterien führen
│   ├── Rückfragen öffnen und Antworten prüfen
│   ├── Ausführbarkeit bestimmen
│   └── Suchausführungen und Ergebnisse behandeln
├── Interpretations-State-Machine / gemeinsamer LLM-Parser
│   ├── neue Suchabsicht interpretieren
│   └── ausdrücklich gebundene Freitextantwort interpretieren
├── Fragekatalog und fachliche Auswahlregeln
│   ├── Anlass und Voraussetzungen
│   ├── Textschlüssel, Parameter und angebotene Aktionen
│   └── Antwortvertrag und fachliche Wirkung
└── Suchausführung
    ├── technischer Fehler
    ├── erfolgreich ohne Treffer
    └── erfolgreich mit Treffern
```

Beide State Machines liegen in der Anwendung. Der Parser hat keinen zweiten unabhängigen Bestand bestätigter Kriterien oder offener Fragen. Die konkrete Modul-/Dateiaufteilung wird damit nicht vorgegeben.

## Beschlossen: Aktionen, Bindung und Revision

- Die Session wird über den Cookie zugeordnet. Eine Auftragskennung allein berechtigt nicht zum Zugriff.
- `submit` eröffnet einen neuen Auftrag derselben Session und ersetzt den offenen Auftrag. Bestätigte Kriterien bleiben Ausgangspunkt. `/reset` beginnt einen neuen Suchkontext.
- `clarify` überträgt `requestId`, `questionId`, `revision` und die Antwort. Es prüft beziehungsweise übernimmt zulässige Antworten, bewertet erneut und startet niemals eine Treffersuche.
- `execute` überträgt `requestId` und `revision` und verwendet den bestätigten Serverstand ohne erneute Interpretation der Suchabsicht.
- Ohne Klärungsbedarf bleibt die direkte Suche durch `submit` erhalten. Nach einer Klärung ist eine weitere ausdrückliche Suchaktion erforderlich.
- Jeder neue Auftrag beginnt mit Revision `1`. Übernommene Änderungen an Kriterien oder aktueller Klärung erhöhen die Revision. Unbrauchbare Antworten ohne fachliche Änderung und rein technische Ausführungszustände erhöhen sie nicht.
- Vor der Verarbeitung und nach asynchroner Interpretation wird die Bindung geprüft. Alte Antworten und verspätete Vorschläge dürfen keinen neueren Stand überschreiben oder alte Aufträge reaktivieren.

```text
Suchsession (Cookie-Zuordnung)
├── bestätigte Kriterien
└── aktueller Auftrag: requestId
    ├── fachlicher Stand: revision
    ├── aktuelle Rückfrage, falls vorhanden: questionId
    ├── Interpretation
    └── Suchausführungen / Ergebnisse

submit  → neuer Auftrag, Revision 1; offenen Auftrag ersetzen
clarify → bestehenden Auftrag und konkrete Frage bearbeiten
execute → bestätigten ausführbaren Stand ausdrücklich suchen
/reset  → neuer Suchkontext
```

## Modellrichtung: zwei zusammenarbeitende Zustandsmaschinen

Die Zustandsmaschinen beschreiben zunächst das fachliche Ablaufmodell. Ihre technische Umsetzung ist noch nicht festgelegt. Für den ersten Submit-Schnitt genügen einfache, explizite Operationen im Suchbereich. Eine ausdrückliche Übergangsfunktion oder State-Machine-Implementierung wird ergänzt, wenn sie die konkreten Abläufe verständlicher macht. Eine zusätzliche Bibliothek ist damit nicht beschlossen.

Unabhängig von der Umsetzung bleiben die Verantwortungsgrenzen bestehen: HTTP-Routen behandeln Ein- und Ausgabe, Session-/Storage-Anbindung übernimmt Zuordnung und Ablage, und der frameworkfreie Suchablauf entscheidet über Auftragseröffnung, Ablösung, Revision und zulässige Übergänge.

### Suchablauf

Die serverseitige Ablaufsteuerung führt Session, Auftrag, bestätigte Kriterien, Revision, aktuelle Frage und Suchausführungen zusammen. Fragezustand, Antwortverarbeitung, Ausführbarkeit und technische Requests bleiben getrennt; keine globale `pending`-Phase.

```text
submit
└── neue Suchabsicht interpretieren und Vorschlag prüfen
    ├── technischer Interpretationsfehler → getrennt zurückmelden
    ├── nicht unterstützt → Einschränkung erklären
    ├── Klärung erforderlich → konkrete Frage öffnen
    │   └── gültiges clarify
    │       ├── weitere Klärung erforderlich → nächste Frage
    │       ├── kein unterstützter Suchweg → Einschränkung erklären
    │       └── ausführbar → auf ausdrückliches execute warten
    └── ohne Klärung ausführbar → direkt suchen

execute
└── Session, Auftrag, Revision und Ausführbarkeit prüfen
    ├── nicht anwendbar → nicht suchen; Grund zurückgeben
    └── anwendbar → Suchausführung
        ├── technischer Fehler
        ├── erfolgreich ohne Treffer
        └── erfolgreich mit Treffern
```

Die Darstellung legt noch keine vollständigen Fehler-Enums oder Wiederholungsregeln fest. Unbrauchbare Klärungsantworten verändern keine Kriterien; unaufgelöster Klärungsbedarf bleibt bestehen.

### Interpretation mit dem gemeinsamen LLM-Parser

Der Interpretationsablauf umfasst sowohl neue Suchabsichten als auch ausdrücklich gebundene Freitextantworten auf Rückfragen. Er ist nicht nur ein Transportstatus für einen Modellaufruf und kein autonomer LLM-Dialog mit eigenem Kriterienbestand.

Bei einer gebundenen Freitextantwort erhält der gemeinsame Parser die konkrete Frage, den fachlichen Fragetyp, angebotene Optionen/Kandidaten, bestätigte Kriterien, erlaubte Änderungen und den Antworttext. Er liefert einen Vorschlag. Die Anwendung entscheidet über Gültigkeit, Übernahme, weiteren Klärungsbedarf und Suchweg. Direkte Auswahl und strukturierte Eingaben werden ohne LLM geprüft.

```text
Interpretationsanlass
├── neue Suchabsicht aus submit
└── ausdrücklich gebundene Freitextantwort aus clarify
    │
    ▼
Parser mit passendem Kontext aufrufen
├── technischer Fehler → Interpretationsfehler, kein Suchfehler
└── Vorschlag liegt vor
    └── serverseitig validieren und Aktualität prüfen
        ├── veraltet → nicht übernehmen
        └── aktuell → fachlich bewerten
            ├── zulässige Änderungen übernehmen
            ├── verbleibenden Klärungsbedarf bestimmen
            └── nicht unterstützte Absicht erklären

Direkte Auswahl / strukturierte Eingabe
└── ohne LLM gegen Fragevertrag prüfen
    └── gleicher fachlicher Übernahme- und Bewertungsschritt
```

Die fachlichen Bewertungspunkte sind keine zwingend exklusiven Parser-Ergebnis-Enums. Exakte Zustandsnamen und Übergangsverträge beider Maschinen sind noch auszuarbeiten. Aus den diskutierten Diagrammen wird noch kein vollständiges Enum-Modell abgeleitet.

## Suchantwort und anschließende Interaktion trennen

Die ausgeführte Suche hat genau drei fachlich unterschiedene Rückmeldungen:

1. Technischer Fehler.
2. Erfolgreiche Rückgabe ohne Treffer.
3. Erfolgreiche Rückgabe mit Treffern.

Eine Rückfrage ist kein viertes Suchergebnis. Sie kann sich vor der Suche oder aus der anschließenden Bewertung einer Suchantwort ergeben. Eine leere Trefferliste ist kein technischer Fehler. Interpretationsfehler des LLM bleiben von Fehlern der Treffersuche getrennt.

```text
Suchantwort                       Mögliche Fortsetzung [noch offen]
├── technischer Fehler         ──→ ausdrückliche Wiederholung anbieten?
├── erfolgreich ohne Treffer   ──→ passende Kriterienänderung klären?
└── erfolgreich mit Treffern
    ├── überschaubare Menge    ──→ Treffer ansehen
    └── viele Treffer          ──→ konkrete Eingrenzungsaktionen anbieten?
```

Die genaue Fortsetzung nach einer Suchantwort ist noch nicht vollständig entschieden. Insbesondere ist nicht beschlossen, dass jeder Auftrag nur eine Suchausführung haben darf oder dass jede leere Trefferliste zwingend eine Frage erzeugt. Eine optionale Eingrenzung nach erfolgreicher Suche ist von einer zwingend nötigen Klärung vor einer ausführbaren Suche zu unterscheiden; ihr genauer Lebenszyklus bleibt offen.

## Fragekatalog und konkrete Aktionen

Rückfragen müssen zum Kriterienstand passen und dem Nutzer zeigen, wie er weiterkommt. Ein bloßes „Möchtest du weiter eingrenzen?“ genügt nicht. Ein Fragetyp umfasst Anlass, Voraussetzungen, Text beziehungsweise Textschlüssel, angebotene Aktionen, Antwortvertrag und fachliche Wirkung. Die Anwendung wählt passende Fragen; die konkrete Instanz erhält eine `questionId`.

Beispielhafte Eingrenzungsaktionen sind „Nur Filme“, „Nur Serien“, „Jahr angeben“ und „Treffer ansehen“. Bereits festgelegte Werte dürfen nicht als neue Eingrenzung angeboten werden. Angeboten werden nur unterstützte Suchmöglichkeiten. Keine generische Regel-Engine allein für diesen Schnitt vorsehen.

```text
Fragetyp im Katalog
├── fachlicher Typ: kind
├── Anlass und Voraussetzungen
├── Textschlüssel und Parameter
└── mögliche Aktionen
    ├── konkrete Auswahl → Wert prüfen und gegebenenfalls übernehmen
    ├── Eingabe öffnen → noch keine Kriterienänderung
    └── ohne Änderung fortfahren → kein neuer Suchaufruf allein dadurch

Konkrete Frage im Auftrag
├── questionId
├── Bindung an requestId und revision
└── für den aktuellen Stand tatsächlich angebotene Aktionen
```

Fachliche Medientypen sind `movie` und `tv`. Personen sind kein Typ unseres Suchmodells. Eine nicht festgelegte Einschränkung auf Film oder Serie ist kein zusätzlicher Inhaltstyp.

Mehr als 30 Treffer wurde als erster Schwellenwert für ein Eingrenzungsangebot diskutiert. Die genaue Regel, die aussagekräftige Gesamtzählung über Seiten hinweg und das Verhalten ohne sinnvolle weitere Eingrenzung bleiben offen. Nicht die Länge einer einzelnen geladenen Trefferseite als Gesamtzahl ausgeben. Die konkreten Fragetexte und Aktionsfolgen sind Entwürfe, kein fertiger Katalog.

## Terminal: Eingabeabsicht sichtbar und eindeutig machen

Allgemeiner Freitext ist eine neue Suchabsicht über `submit`, auch wenn eine Frage offen ist. Das LLM darf eine solche Eingabe nicht allein wegen der offenen Frage als Antwort vereinnahmen.

Gebundene Antworten entstehen durch eine angebotene Auswahl oder eine ausdrücklich ausgewählte, zugehörige Eingabe. Im Terminal werden Optionen als nummerierte Auswahlliste dargestellt. Eine Option wie „Jahr angeben“ öffnet eine sichtbar gebundene Eingabe. Freitextantworten über den Parser bleiben möglich, benötigen aber einen erkennbar gewählten Antwortweg; sie sind nicht der Standard für beliebigen Text am allgemeinen Prompt.

```text
Terminal-Eingabe
├── allgemeiner Freitext → submit
├── angebotene Auswahl
│   ├── konkrete Antwort → clarify ohne LLM
│   ├── „Jahr angeben“ → gebundenes Eingabefeld öffnen
│   │   └── strukturierter Wert → prüfen, clarify ohne LLM
│   └── expliziter Freitext-Antwortweg [Ausgestaltung offen]
│       └── gebundener Text → clarify mit gemeinsamem Parser
└── ausdrückliche Suchaktion nach Klärung → execute
```

Die vorgeschlagenen Details zu Promptnamen, Abbruchbefehlen, ungültigen Listennummern und einem möglichen „Anders antworten“ werden beim Terminal-Vertrag konkretisiert. Eine konkrete Eingabesyntax ist noch nicht beschlossen. „Treffer ansehen“ ist eine Darstellungsaktion und nicht automatisch ein neuer execute-Aufruf.

Kriterien und Ergebnisse getrennt anzeigen:

```text
Suchkriterien:
  Titel: …
  Typ: Serie
  Jahr: 2005

Suchergebnis:
  Treffer insgesamt: …

Mögliche nächste Aktionen:
  1. …
  2. …
```

Trefferzahl ist Ergebnisinformation, kein Suchkriterium. Genre bleibt ein späterer Anwendungsfall; seine Nennung in Darstellungsbeispielen erweitert nicht den aktuellen Funktionsumfang. Die UI stellt bestätigten Stand und serverseitig bestimmte Aktionen dar, erfindet keine fachlichen Optionen.

## Zeitangaben im Parser-Vertrag

Der Parser darf nur zeitliche Kriterien vorschlagen, die das fachliche Modell unterstützt: Jahr beziehungsweise künftig Jahresbereich, kein vollständiges Datum. Diese Grenze gehört sowohl in die Parser-Anweisungen als auch in das validierte Ausgabeschema.

Aktuell wird nur ein einzelnes Jahr unterstützt. Jahresbereiche sind eine spätere bewusste Erweiterung; ihr Schema, ihre Grenzen und die ausführbaren Suchwege sind noch festzulegen.

```text
Zeitangabe im Nutzertext
├── einzelnes Jahr → unterstützten Jahreswert vorschlagen
├── Jahresbereich → spätere Erweiterung, aktuell nicht vorziehen
└── genaues Datum / Monatsgrenze
    └── nicht stillschweigend vergröbern
        └── Einschränkung erklären und akzeptable Änderung klären
```

Ein vollständiges Datum oder eine Angabe wie „seit März 2005“ darf nicht ungefragt auf ein Jahr beziehungsweise einen Jahresbereich verkürzt werden. Die genaue Rückfrage und ihre Aktionen zur akzeptierten Vergröberung oder zum Weglassen der Zeitangabe sind noch auszuarbeiten. Eine ausdrücklich strukturierte Jahreseingabe benötigt keinen LLM-Aufruf.

## Offene nächste Entscheidungen

- Konkrete Zustände und Übergänge für Suchablauf und Interpretation.
- Lebenszyklus einer Rückfrage nach einer Suchantwort und Zuordnung weiterer Suchausführungen zum Auftrag.
- Atomare Antwortübernahme und Ausführungsreservierung; doppelte und parallele Aktionen.
- Wiederholung nach technischem Suchfehler: ausdrückliche Freigabe und technischer Vertrag. Die Vorschläge „nur neuer submit“ und „erneut versuchen“ sind nicht als endgültige Entscheidung festgehalten.
- Verhalten nach leerer Trefferliste sowie konkrete Eingrenzungsangebote bei vielen Treffern.
- Schwellenwert und Gesamtzählung der Treffer; keine verfrühte Behauptung einer verfügbaren Gesamtzahl.
- Ergebnis-Enums, HTTP-Statuscodes, Darstellung und genaue Eingabesyntax im Terminal.
- Konkreter Fragen-/Textkatalog und Parser-Vertrag für nicht abbildbare Zeitangaben.

Web-UI-Best-Practices, Jahresbereiche, Genre, Discovery und Keyword-Auflösung werden hier nicht vorgezogen.
