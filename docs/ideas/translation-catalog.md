# Idee und Entscheidung: übersetzbare Texte mit verbindlichem Schlüsselkatalog

Stand: 20. November 2026. Zielbild vereinbart; keine sofortige Implementierung der Mehrsprachigkeit oder des Prüfskripts. Bezug: [Klärungs-Wizard](clarificaton-wizzard-flow.md) und [Rückfrage-Vertrag](../tasks/search-architecture/clarification-flow.md).

## Zunächst eine Datei

Für den aktuellen Arbeitsstand genügt eine einzige zentrale Textdatei mit deutschen Texten und stabilen Schlüsseln. Dateiformat und Laufzeitpfad bei der Umsetzung festlegen. Noch keine zusätzlichen Sprachdateien, keine i18n-Bibliothek und kein Prüfskript allein für diesen Entwurf anlegen.

Diese Markdown-Datei dokumentiert die Entscheidung; sie ist noch kein von der Anwendung geladener Textkatalog. Die spätere Aufteilung darf den Rückfrage-Durchstich nicht blockieren.

## Späteres Zielbild

- Eine sprachunabhängige Schlüsseldatei definiert alle Pflichtschlüssel und die je Text benötigten benannten Platzhalter.
- Jede unterstützte Sprache erhält eine eigene Textdatei mit denselben Schlüsseln.
- Unterstützte Sprachen werden ausdrücklich konfiguriert, nicht nur aus vorhandenen Dateien abgeleitet. So fällt auch eine vollständig fehlende Sprachdatei auf.
- Anwendungstypen beziehungsweise erlaubte Textschlüssel möglichst aus dem gemeinsamen Katalog ableiten; keine zweite manuell gepflegte Schlüsselliste im Code.
- Deutsch ist eine Sprache unter mehreren, nicht die implizite Quelle für die Vollständigkeit aller anderen Sprachen.

Beispiel des späteren Schlüsselvertrags, kein festgelegtes Speicherformat:

```json
{
  "clarification.mediaType.required_for_year": { "params": [] },
  "clarification.answer.accepted": { "params": ["label"] }
}
```

Beispiel einer deutschen Sprachdatei:

```json
{
  "clarification.mediaType.required_for_year": "Meinst du einen Film oder eine Serie?",
  "clarification.answer.accepted": "„{label}“ wurde übernommen."
}
```

## Späterer Vollständigkeitscheck

Ein kleines Skript soll für jede konfigurierte Sprache gesammelt prüfen und mit Sprache sowie Schlüssel melden:

1. Sprachdatei fehlt, ist nicht lesbar oder hat ein ungültiges Format.
2. Pflichtschlüssel fehlt.
3. Wert ist kein Text oder nach Entfernen äußerer Leerzeichen leer.
4. Unbekannter Schlüssel ist vorhanden, etwa durch Tippfehler oder veraltete Einträge.
5. Platzhalter fehlen oder zusätzliche, nicht vereinbarte Platzhalter werden verwendet. Wiederholung oder Reihenfolge eines vereinbarten Platzhalters ist kein Fehler.

Bei Fehlern endet der Check mit einem Fehlercode. Später als eigener lokaler und automatisierter Check einbindbar, zum Beispiel `i18n:check`. Ein Laufzeit-Fallback darf fehlende Übersetzungen in dieser Prüfung nicht verdecken. Nicht automatisch Texte erzeugen oder als übersetzt markieren.

Beispielausgabe:

```text
en:
  Fehlende Übersetzung: clarification.mediaType.required_for_year
  Fehlender Platzhalter {label}: clarification.answer.accepted
```

Der Check bestätigt Struktur und Vollständigkeit, nicht sprachliche Qualität oder fachliche Richtigkeit. Identische Texte in verschiedenen Sprachen sind nicht grundsätzlich fehlerhaft.

## Fachliche Textgliederung bleibt unabhängig

Texte nach Kriterium und konkretem Klärungsgrund gliedern; zusätzlich Optionslabels, Bestätigungen, Aktionen und sichere Fehlerrückmeldungen berücksichtigen. Ein universelles „Eingabe präzisieren“ ohne Erklärung reicht nicht. Gültige Antworten mit weiterer Folgefrage nicht als Fehler darstellen.

Fachlogik liefert Textschlüssel und Parameter; Clients stellen die Texte dar. Fachwerte wie `tv`, konkrete `questionId` und wiederverwendbare Fragetypen sind keine Übersetzungen. Der Textkatalog entscheidet nicht über Fragezustand, Kriterienübernahme oder Suchausführung.

## Später konkretisieren

Laufzeitpfad, Dateiformat, Platzhaltersyntax, Sprachkonfiguration und Lade-/Fallback-Verhalten festlegen, sobald Mehrsprachigkeit umgesetzt wird. Zunächst nur die tatsächlich benötigten Texte in der einen Arbeitsdatei pflegen; keine vollständigen Kataloge für spätere Suchkriterien vorwegnehmen.
