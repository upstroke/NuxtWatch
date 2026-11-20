# Sucharchitektur – Arbeitsstand

Einstieg für die Weiterarbeit ohne Chatverlauf. Stand: 20. November 2026, Architekturgespräch bis 10:35 Uhr. Branch: `feat/shared-search-architecture`.

## Dokumente

- [Architekturkonzept](../../sucharchitektur-konzept.md)
- [Wizard-Spezifikation](../../ideas/clarificaton-wizzard-flow.md)
- [Bisherige Zielstruktur](zielstruktur.md) – ergänzende Session-Einordnung und aktualisierter Iststand unten.
- [CLI-Abnahme](cli-abnahme.md), [HTTP-Schnitt](http-submit.md), [direkte CLI](cli-direkt.md)
- [Testinventur](test-inventory.md), [Rückfrage-Task](clarification-flow.md)
- [Entscheidung 1: Session und Auftrag](session-request-decision.md)
- [Textkatalog-Skizze](../../ideas/translation-catalog.md)

Diese Übersicht aktualisiert ältere Offen-Vermerke der Schritt-Dokumente. Beschlossene Regeln, technische Vorschläge und implementierter Stand werden nicht gleichgesetzt.

## Implementierter und geprüfter Stand

Der direkte Titelsuch-Durchstich funktioniert live:

```text
CLI → POST /api/search → LLM-Parser → Koordinator → TMDb-Titelsuchdienst → CLI
```

- A1 abgeschlossen. `server/services/tmdb/title-search.ts` verwendet `/search/multi`, validiert die Rohantwort, normalisiert Film und Serie und lässt Personen aus.
- `submitAndSearch` in `server/services/search/submit.ts` verbindet Parser, Koordinator und Titelsuchdienst (`68de6a6`). Direkt unterstützt: Titel mit `mediaType: all` ohne Jahr. Rückfragen und Ablehnungen lösen keine Treffersuche aus. Nicht unterstützte Kriterien werden nicht weggelassen.
- Koordinator-/Parser-Unit-Tests und kontrollierte Integration unter `tests/integration/tmdb` wurden nach Teststrategie getrennt; doppelte Mapping-/Transportfehlerprüfungen entfernt und Testinventur ergänzt (`08757a2`).
- `server/api/search.post.ts` und `src/lib/schemas/search-request.ts` stellen bisher nur `submit` bereit (`23e349b`). Default: `mediaType: all`; sichere Fehlerabbildung, `Cache-Control: no-store`, TMDb-Redirects verweigert. Noch keine serverseitige Session-/Auftragsbindung.
- `scripts/search.mjs` ist der erste interaktive HTTP-Client (`981e487`). Er zeigt Serverkriterien und Ergebnisse als JSON, sendet den letzten gültigen Kriterienstand zurück und bietet `/reset` und `/exit`. Derzeit ist jede Texteingabe ein neuer `submit`; keine gebundene Klärungsantwort. Reset wirkt bisher nur lokal.
- Lokal läuft das Modell über LM Studio. Runtime-Konfiguration unverändert. Gehostete Modelle und API-Key-Erweiterungen sind kein aktuelles Arbeitspaket; langfristiges Ziel ist eine hostbare WebApp.
- Nutzerbestätigung vom 19. November: Tests, Typecheck und Lint grün, vor den HTTP-/CLI-Erweiterungen. Keine erneute vollständige Check-Bestätigung für diese neueren Commits.
- Nutzerbestätigung vom 20. November: HTTP 200 mit `no-store`, `completed`, Kriterien `all` und `The Matrix`, normalisierter Treffer ID 603. Danach CLI-Erfolg mit denselben Kriterien und 20 Treffern in dieser Antwort. Keine feste Trefferzahl oder Aussage über sämtliche TMDb-Seiten ableiten.
- Reset, Fehlerfälle, Rückfragefortsetzung und HTTP-Integration sind dadurch nicht vollständig abgenommen. Frühere Offen-Vermerke zum direkten Live-Abgleich sind durch diese Rückmeldungen überholt.
- `llm.ts`: laut Nutzerbericht 0 % Coverage. Entscheidung: jetzt keine Tests dafür ergänzen. Globaler Mindestwert unverändert, kein Coverage-Ziel pro Datei; aktueller globaler Wert nicht gemeldet.

## Beschlossene Rückfrage- und Antwortregeln

Diese Regeln umfassen auch die Diskussion vor der technischen Entscheidungsrunde; noch nicht als Rückfrageablauf implementiert.

- Das LLM schlägt Interpretationen und Kriterienänderungen vor. Die Anwendung validiert, löst Begriffe bei Bedarf auf und entscheidet über Klärungsbedarf, unterstützte Suchwege und technische Aufrufe. Das LLM wählt keinen TMDb-Endpunkt und bestätigt nicht verbindlich die Auflösung einer Frage.
- Klärungsbedarf ergibt sich daraus, ob die Antwort fachlich brauchbar ist und welche Unklarheiten beziehungsweise Voraussetzungen danach noch bestehen; keine starre Fragenliste. Ein formal gültiger Kriterienwert ist nicht automatisch technisch ausführbar.
- Rückfragen und Hinweise sind kriteriums- und grundspezifisch. Kein pauschales „Eingabe präzisieren“ ohne Erklärung, warum die Antwort nicht genügt und was konkret benötigt wird. Mehrere Titeltreffer allein sind kein Rückfragegrund.
- Eine gültige Antwort kann eine Entscheidung bestätigen und zugleich eine weitere Frage auslösen. Sie wird deshalb nicht als Fehler dargestellt. Unklare Bedeutung und eindeutig verstandene, aber nicht unterstützte Suche bleiben unterscheidbar.
- Direkte Auswahl und strukturierte Eingabe benötigen kein LLM. Freitext wird mit offener Frage, Optionen/Kandidaten, bisherigen Kriterien und erlaubten Änderungen interpretiert; dafür den gemeinsamen Parser ergänzen, keinen getrennten Parser pro Suchstrecke bauen.
- „Keins davon“ und Korrekturen des Suchauftrags nicht in falsche Optionen zwingen. Nicht eindeutig interpretierbare Antworten verändern keine Kriterien. Technische Modellfehler sind keine missverständlichen Nutzerantworten.
- `questionId` bezeichnet die konkrete Frage; `kind` ihren wiederverwendbaren fachlichen Typ. Texte und Textschlüssel sind davon unabhängig. Alle erforderlichen Kriterien werden nach Antwortübernahme neu bewertet.
- Fragezustand, Ergebnis der Antwortverarbeitung, Kriterienstand, Ausführbarkeit und laufende Requests bleiben getrennt. Keine globale `pending`-Phase. Exakte Ergebnis-Enums sind noch festzulegen.
- Ohne Klärungsbedarf startet der erste ausdrückliche Suchauftrag direkt. `clarify` startet niemals die Treffersuche. Nach Abschluss der Klärung schließt das Overlay, bestätigte Werte erscheinen als Pills; erst eine erneute ausdrückliche Suchaktion sendet `execute`.
- Unabhängig geklärte Kriterien dürfen gemäß Architekturkonzept während offener Klärung bestätigt werden; gekoppelte Änderungen gemeinsam oder gar nicht übernehmen. Konkrete Übernahme- und Darstellungsdetails weiter ausarbeiten, nicht durch eine globale Alles-oder-nichts-Regel ersetzen.

## Texte und zurückgestellte Ausbaustufen

- Zunächst genügt eine zentrale deutsche Textdatei mit stabilen Schlüsseln. Fragen, Optionslabels, Bestätigungen, Aktionen und sichere Fehlerrückmeldungen berücksichtigen. Pfad und Format noch nicht implementiert.
- Später: sprachunabhängiger Pflichtschlüsselkatalog einschließlich Platzhaltern, eine Datei je Sprache, explizite Sprachenliste und ein kleiner Vollständigkeitscheck. Details in der [Skizze](../../ideas/translation-catalog.md), im Hauptkonzept verlinkt (`a0be8fe`). Jetzt keine Mehrsprachigkeits-Infrastruktur oder Prü skripte vorziehen.
- `docs/ideas` ersetzt `docs/work`. Die Wizard-Datei liegt jetzt unter `docs/ideas/clarificaton-wizzard-flow.md`.
- Zurückgestellte Lösungen und nächste Ausbaustufen in `docs/ideas` dokumentieren. Sie sind keine bereits implementierten Fähigkeiten oder automatisch beschlossene Hosting-Architektur. Der Durchstich dient auch dazu, die weitere Planung an Erfahrungen auszurichten.

## Entscheidung 1: fachlich abgeschlossen

Details: [Session-/Auftragsentscheidung](session-request-decision.md), Commit `05e553d`.

- `sessionId`: zusammenhängender Suchkontext mit bestätigten Kriterien.
- `requestId`: konkreter Suchauftrag, nicht einzelner HTTP-Aufruf; ersetzt die frühere vorgeschlagene Bezeichnung `searchId`.
- `questionId`: konkrete Rückfrage; `revision`: Bindung an den fachlichen Stand.
- Neuer `submit` derselben Session ersetzt den offenen Auftrag und baut auf bestätigten Kriterien auf. Nicht bestätigte Annahmen werden nicht ungeprüft übernommen.
- `clarify` beantwortet den bestehenden Auftrag. Alte Antworten und verspätete Interpretationsergebnisse dürfen einen neueren Stand nicht verändern oder eine alte Suche starten.
- `/reset` beginnt einen neuen Suchkontext. Die erforderliche serverseitige Ablösung ist noch zu implementieren.

## Vereinbarte Speicherrichtung für den Durchstich

Nachtrag zur Entscheidung 1: Kriterien, aktueller Auftrag, Rückfragen und Ausführungsinformationen sollen zunächst gemeinsam in einer kurzlebigen serverseitigen Suchsession gehalten werden. Sie bleiben darin fachlich getrennt; mehrere Speicher oder Dienste sind nicht erforderlich. Keine zusätzliche Datenbank für den Durchstich einführen. Diese Richtung ist vereinbart, aber noch nicht implementiert; ältere Dokumente nennen die Ablage noch vollständig offen.

Session bezeichnet den Zusammenhang, Storage seine technische Ablage. Vorhandene Nuxt-/H3-/Nitro-Bausteine vor eigener Infrastruktur prüfen. Cookie-basierte Session-Helfer sind nicht automatisch ein serverseitiger Speicher des gesamten Kriterienstands. Keine dauerhafte Wiederaufnahme zusichern; die konkrete Laufzeitablage und ihre Neustart-/Instanzgrenzen vor Umsetzung bestimmen.

### Technischer Vorschlag, noch nicht vollständig beschlossen

- Geschützte Cookie-Zuordnung für CLI und Weboberfläche; Cookie enthält nur Zuordnungsdaten, nicht den gesamten Suchstand. CLI müsste Cookies behalten und mitsenden.
- Maßgeblicher Kriterienstand serverseitig, bei gebundenem `clarify`/`execute` keine frei ersetzbaren Client-Kriterien. Session-Eigentümerschaft und Zugriffsschutz konkretisieren; Auftrags-ID allein ist keine Berechtigung.
- Nitro `useStorage` als mögliche Ablage; geeignete Session-Helfer und tatsächliches Verhalten gegen die installierten Versionen prüfen. Noch keine Bibliothek, Treiber- oder Cookie-Konfiguration ausgewählt.
- Reset muss bei serverseitiger Ablage auch den Server erreichen. Fehlender Kontext bei `clarify`/`execute` darf nicht stillschweigend als neue leere Suche weiterlaufen.
- 30 Minuten Lebensdauer, Kapazitätsgrenzen und Single-Instance-Details waren Vorschläge, keine festgelegten Betriebswerte. Atomare Revision-/Ausführungsprüfung wird nicht allein durch Storage-Methoden garantiert.

## Vorgeschlagene Einordnung in die Ordnerstruktur

`[neu]` bedeutet vorgeschlagen, nicht angelegt. Bestehende Methoden wiederverwenden; keine vorsorglichen leeren Dateien. Die genaue Aufteilung bleibt beim Umsetzungsschritt überprüfbar.

```text
server/
├── api/search.post.ts                  # vorhanden, um clarify/execute erweitern
├── utils/
│   ├── tmdb.ts                        # vorhanden
│   ├── search-session.ts              # [neu] Cookie-/Session-Zuordnung
│   └── search-storage.ts              # [neu] Nitro-Storage-Anbindung
└── services/
    ├── search/
    │   ├── llm.ts                     # vorhanden, Modelltransport
    │   ├── parser.ts                  # vorhanden, Fragekontext ergänzen
    │   ├── coordinator.ts             # vorhanden, Kriterien/Fachentscheidung
    │   ├── submit.ts                  # vorhanden, direkter Ablauf
    │   └── clarification.ts           # [neu] Antwort-/Fragenübergänge
    └── tmdb/
        ├── http.ts                    # vorhanden
        ├── title-search.ts            # vorhanden, TV-/Film-Wege ergänzen
        └── errors.ts                  # vorhanden
src/lib/
├── schemas/
│   ├── search-request.ts              # vorhanden, Aktionen ergänzen
│   ├── search-session.ts              # [neu] Zustandsverträge
│   └── ui/search-result-card.ts       # vorhanden
├── texts/search.ts                    # [neu] eine deutsche Textdatei
└── parser/instructions.ts             # vorhanden, Klärung ergänzen
scripts/search.mjs                     # vorhanden, Session/Dialog ergänzen
```

H3-/Cookie-/Nitro-Zugriffe bleiben an der Framework-Grenze in `server/utils`. Suchdienste bleiben frameworkfrei und erhalten Zustand beziehungsweise eine schmale Speicherabhängigkeit injiziert. Fachwerte nicht pro Schicht duplizieren. Der Tree ist kein Auftrag für einen zusätzlichen globalen Store oder eine generische Regel-Engine.

## Nächster Durchstich und verbleibende Entscheidungen

Ziel gemäß [CLI-Abnahme](cli-abnahme.md): „The Office von 2005“ → Medientyp-Frage → „Serie“ übernehmen ohne Treffersuche → ausdrückliches `execute` → TV Search mit `query=The Office` und `first_air_date_year=2005`. Bestehendes Matrix-Direktverhalten erhalten.

Vor Code konkretisieren: Client-/Session-Zuordnung und Berechtigung, technische Ablage/Lebensdauer, Revisionsumfang und -erhöhung, atomare Übernahme nach asynchroner Interpretation, Schutz gegen doppelte Ausführung und Fehler-/Wiederholungsverhalten, Ergebnis-Enums und HTTP-Statuscodes. Frühere Aufzählungen sind Diskussionsgliederungen, kein bereits vollständig beschlossener Implementierungsplan.

Weitere offene Arbeit:

- `SEARCH-SUBMIT-INT-005` und Inventur präzisieren: prüft die Kombination Medientyp/Jahr, nicht isoliert die Jahresprüfung; kein nachgewiesener Funktionsfehler.
- Relevante HTTP-/CLI- und Klärungstests nach [Teststrategie](../../testing.md) schließen; keine doppelte interne Fallmatrix und keine Tests für `llm.ts` ergänzen.
- Für `/api/search/title/refine` wurde in A1 kein Handler/Aufrufer gefunden; keine vorsorgliche Migration.
- Discovery, Genre-Katalog, Keyword-Auflösung und UI-Ausbau später. Vor öffentlichem Hosting Zugriffsschutz, Missbrauchsbegrenzung und Ressourcenlimits klären.

Dieser Nachtrag ist ausschließlich Dokumentation. Session-Verwaltung, Textdatei, Cookie-Zuordnung, `clarify` und `execute` sind damit nicht implementiert; keine neuen Tests oder Checks ausgeführt.
