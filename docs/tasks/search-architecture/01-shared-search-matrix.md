# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: implementiert und im vereinbarten Terminal-/HTTP-Prüfumfang erfolgreich geprüft; Abschlussaudit noch offen. Stand: 22. November 2026, Rückmeldungen bis 17:30 CET. Aktueller Codebezug nach Bereinigung `e111ef60150d391cf074fbb4bd57bf94dfa93b09`; Suchprüfung und HTTP-Audits auf `b1e3a8fa92e37e76835ff0487b6c5114ccfc37f2`, Branch `feat/shared-search-architecture`. Keine vollständige Produktions-, Race- oder Ausfallabnahme.

Grundlagen: [Konzept/Hindernismatrix](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [Requests](../../tmdb-search-examples.md), [Prüfregeln](../../testing.md). Keine zweite vollständige Regelmatrix.

Diese Datei enthält den aktuellen Prüfstand. Ältere Offenmeldungen in README/Zielstruktur sind anhand dieses datierten Protokolls einzuordnen; beide Dateien wurden mit dieser Aktualisierung nicht angeglichen. Das vollständige frühere Protokoll einschließlich Commitchronik, manueller Einzelbeobachtungen und API-Zähltabelle bleibt im [Stand vor dieser Dokumentationsaktualisierung](https://github.com/upstroke/NuxtWatch/blob/b1e3a8fa92e37e76835ff0487b6c5114ccfc37f2/docs/tasks/search-architecture/01-shared-search-matrix.md) erhalten.

## Ziel und Umfang

Bestehende Suche gemäß Zielstruktur ordnen und Titelwege gemeinsam bewerten. Titel ist Abnahmefall gemeinsamer Architektur, kein eigener Parser. Nächsten Anwendungsfall erst nach Abschluss auswählen; Keyword möglich, nicht beauftragt.

Umfang: gemeinsamer Coordinator, Hindernisbewertung, externe Verträge, zentrale Texte und nötige Terminaldarstellung. Sessionbindung, JSON-Interpretation und Adapter erhalten. Gesamtzählung ausdrücklich nachbeauftragt: Multi zusätzliche Personenabfrage, Movie/TV direkte Zahlen; keine Personensuchoberfläche. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Datenbank, Regel-Engine, vollständige i18n, Web-UI oder Modellvergleich.

LLM interpretiert, Matrix bewertet Kriterien-/Umfangsabdeckung, Flow bestimmt den nächsten Schritt und bindet die Frage, Textkatalog formuliert, Oberfläche zeigt an. Titel/all ohne Jahr führt zu Multi. Titel/Jahr/all verlangt die Auswahl movie/tv, auch bei ausdrücklich beiden Medien. Titel und Jahr bleiben erhalten; kein geratenes Medium, keine Jahres-Nachfilterung oder Listen-Zusammenführung. Bestätigte Kriterien ändern sich nur auf ausdrücklichen Wunsch.

Angebotene Auswahl erfolgt ohne LLM; Freitext nutzt die gemeinsame Interpretation. Clarify sucht nie. Nach Klärung startet erst ausdrückliches Execute; ein neuer ausführbarer Submit darf dagegen direkt suchen. Execute interpretiert nicht erneut.

## Prüfvereinbarung und Grenzen

Allgemeiner Testausbau bleibt bis zum Bestandsaudit zurückgestellt. Keine vorsorgliche Migration, pauschale Löschung oder Änderung von Ausschlüssen/Coverage/Checks zum Verbergen von Fehlern. Konkrete Teständerungen separat vereinbaren.

Historische Freigaben bleiben bestehen: zwei alte Submission-Tests entfernt; Titeltesterwartung um include_adult ergänzt; Parser-Vertragstestimport auf llm umgestellt; bestehende Adaptererwartungen mit ed031e3 minimal auf .results angepasst. Keine zusätzliche automatische Zählungsabsicherung daraus ableiten. Die unten dokumentierte gezielte Chat-/Aliasbereinigung wurde anschließend ausdrücklich beauftragt und einzeln bestätigt; daraus folgt keine allgemeine Löschungsfreigabe.

Die eigenständigen HTTP-Audits waren gesonderte Prüfaufträge, keine allgemeine Erweiterung des Projekttestbestands. Die zusätzliche Simulationsserie wurde auf Nutzerwunsch beendet. Weitere Providerverzögerungs-/Fehlersimulationen sind nicht Voraussetzung eines stillschweigend erweiterten Terminalauftrags; fehlende Nachweise bleiben aber ausdrücklich offen.

Am 22. November um 17:23 CET wurde der projektweite Vollscan ausdrücklich aus dem Abschlussumfang genommen. Die Struktur-/Importaussage bleibt auf die tatsächlich gelesenen Suchproduktionspfade begrenzt. Kein Vollscan durchgeführt und kein offener Pflichtauftrag zu dessen Nachholung; keine projektweite Fehlerfreiheit daraus ableiten.

## Umsetzung und Abschlussarbeiten

- [x] Flow zusammenführen, HTTP/Session anbinden; alte Workflow-/Coordinator-/Submission-Module aus dem Suchbereich entfernen.
- [x] Suchverträge konsolidieren; gemeinsame aktive Suchimporte auf schemas/search führen.
- [x] HTTP-Zielpfad server/api/search/index.post.ts herstellen; URL POST /api/search erhalten.
- [x] Interpretation/Validierung nach llm.ts verlagern; ausführendes Parsermodul entfernen.
- [x] Bestehenden Titeladapter ohne zusätzliche Wrapper-Schicht verwenden.
- [x] Kompakte Treffer und getrennte Gesamtzahl implementieren.
- [x] Zentrale Anwendungs-/HTTP-/Sessiontexte und lokale Terminaltexte zuordnen; AC9 statisch im Suchpfad prüfen.
- [x] Struktur und interne Importe der gelesenen Suchproduktionspfade prüfen.
- [x] Parserzuständigkeit und gebundene Medienfrage umsetzen; Kriterienerhalt mit Prompt 1.5.3 präzisieren.
- [x] Vereinbarte normale Terminalprüfungen und HTTP-Audit B01–B08 durchführen und Ergebnisse erfassen.
- [x] Alte Chat-Verträge samt Export und zugehörigen zwei Tests gezielt entfernen; TMDb-Fehleralias durch direkten Import im bestehenden Trending-Test ersetzen.
- [x] Erneute Typecheck-/Lint-Nutzerbestätigung nach der Bereinigung erfassen.
- [x] Prüfumfang ausdrücklich auf den Suchbereich begrenzen; projektweiten Vollscan auf Nutzerentscheidung aus dem Abschlussumfang nehmen (nicht durchgeführt).
- [ ] Aktuellen Lauf des bestehenden Projekttestbestands belegen; Typecheck/Lint sind kein Ersatz.
- [ ] Bestehenden Testbestand auditieren und priorisierte Lücken-/Doppelungsbewertung dokumentieren.
- [ ] Dokumentationsabgleich und abschließende Bewertung der ACs mit verbleibenden Grenzen durchführen.

Umgesetzt beziehungsweise erfolgreich stichprobenartig geprüft bedeutet keine uneingeschränkte fachliche Vollabnahme.

## Aktuelle Nachweise

### Terminal und Kriterienerhalt

Normale Terminalabläufe vom Nutzer als erfolgreich bestätigt; daraus keine nicht protokollierten Einzelfälle ableiten. Der Wechsel Dune/movie/2021 → neuer Submit Dark/2017 entfernte zunächst ungefragt movie. LM-Studio-Logs zeigten movie im Modelleingang und einen ausdrücklichen fehlerhaften Vorschlag mediaType=all im Ausgang.

Commit b1e3a8f erhöht die Parser-Instruktionen auf 1.5.3: neue Suchformulierungen allein entfernen keine bestätigten Einschränkungen; explizite Aufhebung bleibt erlaubt. Regeln Englisch, Beispiel-Eingaben Deutsch. Nachtest: Modell ändert nur Titel/Jahr; Nutzer bestätigt Ergebnistabelle mit Dark/movie/2017. Ausdrückliches Filme und Serien ändert bestätigtes movie beziehungsweise tv auf all und führt bei Jahr zur Medienfrage, nicht zur Suche. Positive Fälle, kein allgemeiner LLM-Zuverlässigkeitsnachweis.

### HTTP-Hauptaudit

Nutzerlauf am 22. November gegen localhost:3000, Bericht search-flow-audit-report.json, testedCommit b1e3a8fa92e37e76835ff0487b6c5114ccfc37f2. Korrigierter Audit: acht bestanden, null fehlgeschlagen, null blockiert; overall passed_with_explicit_limits. Bericht in der Unterhaltung geprüft, nicht mit dieser Änderung ins Repository übernommen.

| Fall | Beobachtung |
| --- | --- |
| B01 | Neuer Submit ersetzt offene Frage; alte Antwort abgelehnt, aktuelle Frage nutzbar. |
| B02 | Falsche Frage-ID abgelehnt; richtige Bindung bleibt nutzbar. |
| B03 | Doppelte Antwort und alte Execute-Revision abgelehnt; aktuelle Revision ausführbar. |
| B04 | Reset nach Klärung invalidiert alte Bindungen und vorbereitetes Execute. |
| B05 | Neuer Dark-Submit erhält bestätigtes movie, liefert completed mit neuer requestId; alter Dune-Execute liefert 409. |
| B06 | Wiederholtes Execute nach Erfolg liefert 409. |
| B07 | Gleichzeitig abgesendete Execute-Anfragen liefern einmal completed und einmal 409. Keine instrumentierte Aufrufzahl-/Überlappungsgarantie. |
| B08 | Ausdrücklich Filme und Serien plus Jahr verlangt Medienauswahl. |

B05 verwendete zunächst die falsche Hilfserwartung einer neuen Medienfrage. Das eigenständige Skript wurde korrigiert, bevor der erfolgreiche Gesamtlauf erfolgte. Alte grüne Ergebnisse werden nicht rückwirkend als Kriterienerhaltsnachweis verwendet.

### Ergänzender HTTP-Audit

Bericht audi-report.json auf b1e3a8f: R01, R02, R03 und R05 bestanden. Reset bei wirklich offener Frage separat belegt; explizite Aufhebung movie/tv → all und cookie-getrennte Sitzungstrennung geprüft. Fremde Bindungen abgelehnt, eigene weiter nutzbar. Single-Server-Beobachtung, keine Mehrinstanzprüfung.

R04 schickte Freitext select 1 ohne Schrägstrich und erhielt tv statt movie. Der Nutzer hat diesen Terminal-Sonderfall ausdrücklich aus dem Abnahmeumfang genommen; vorgesehen ist die strukturierte Wizardauswahl. Historischer Bericht bleibt fehlgeschlagen, R04 wird nicht als behoben/bestanden umgedeutet. Keine weitere Prompt-/Flowänderung dafür. Wizardanbindung selbst nicht abgenommen.

R06–R11 wurden vom Ergänzungsskript mangels Teststeuerung nur als BLOCKED aufgeführt, nicht ausgeführt.

### LLM-Verzögerungssimulation

Separates delay-audit.mjs mit lokalem synthetischem Modell-Mock und zweiter Nuxt-Instanz. D01 hält alten Modellaufruf nachweislich an, verarbeitet neueren Submit und gibt alte Antwort danach frei. D02 entsprechend mit Reset. Erwartung jeweils: alter Submit 409, aktueller Auftrag/neue Sitzung nutzbar.

D01 im vorgelegten Bericht bestanden. D02 zunächst 410 beim Folgeauftrag mit veralteter Prüfdatei; Nutzer bestätigt erfolgreichen Wiederholungslauf mit aktueller Datei. Erfolgreicher neuer D02-Bericht nicht vorgelegt. Kein bestätigter Anwendungsfehler aus dem verworfenen Altlauf. Der aktuelle Prüfclient ignoriert nach Reset verspätete Cookie-Aktualisierungen älterer Requests; Browser-Cookierennen sind damit nicht geprüft. Synthetischer Mock prüft Flow, nicht Modellsemantik.

### Projektchecks

| Check | Aktueller Nachweis |
| --- | --- |
| Typecheck | Vom Nutzer am 22. November um 17:30 CET erneut nach der Bereinigung bis e111ef6 als in Ordnung bestätigt; frühere Bestätigung 17:15 CET. Keine eigenen Befehlsläufe oder erfundenen Ausgabe-/Testzahlen. |
| Lint | Dieselbe erneute Nutzerbestätigung nach der Bereinigung bis e111ef6. |
| Bestehende Projekttests | Kein aktueller Lauf bestätigt; letzte historische grüne Rückmeldung 08:29 CET nach 794788f nicht auf spätere Änderungen übertragen. |

### Gezielte Altbestandsbereinigung

Am 22. November ausdrücklich beauftragt; Änderungen vor Ausführung einzeln bestätigt. Kein allgemeiner Testumbau und kein Ersatz für den noch offenen Testbestandsaudit.

| Commit | Änderung |
| --- | --- |
| c63b80d | Chat-Re-Export aus src/lib/schemas/index.ts entfernt; createTmdbSpikeError-Alias aus server/utils/tmdb.ts entfernt; tests/unit/utils/tmdb.spec.ts auf direkten createTmdbError-Import und entsprechenden Fabrikaufruf umgestellt. |
| 2f54361 | tests/unit/schemas/chat.spec.ts mit den zwei Tests des ausgemusterten ChatIntent-Vertrags entfernt. |
| e111ef6 | src/lib/schemas/chat.ts mit altem ChatIntent-Vertrag und zugehörigen Teilschemas/Typen entfernt. |

getTmdbConfig(), fetchWeeklyTrending(), der TmdbRequest-Typexport sowie sämtliche Trending-Testfälle und deren fachliche Erwartungen bleiben erhalten. Aktuelle Suchverträge, Matrix, Flow und Suchlogik wurden nicht geändert. Keine automatische Ersetzung des alten Chat-Vertrags durch schemas/search; unterschiedliche Verträge nicht gleichgesetzt. Kein neuer Projekttestlauf aufgrund dieser Commits behauptet. Typecheck/Lint anschließend vom Nutzer erfolgreich bestätigt.

## Struktur-/Import- und Textzuordnungsprüfung

Statischer GitHub-Prüfstand b1e3a8f, keine Erfassung nicht gepushter lokaler Änderungen. Verzeichnisse des Suchkerns aufgelistet; Implementierungen unter server/api, server/services, server/utils, gemeinsame Schemas und scripts/search.mjs gelesen. Parser-Anweisungen bereits separat geprüft. Kein projektweiter Vollscan einschließlich app/app.vue, sämtlicher Build-Konfigurationen und Styles; nachfolgend auf Nutzerentscheidung nicht weiter als Abschlussarbeit verfolgt. Die gezielte spätere Altbestandsprüfung und Bereinigung ist oben separat dokumentiert.

Keine fehlenden internen Importziele oder veralteten Suchimporte in den gelesenen Produktionsdateien gefunden. Aktiver Einstieg nur server/api/search/index.post.ts; Suchverzeichnis enthält flow.ts, matrix.ts, llm.ts, texts.ts. Parserverzeichnis enthält nur die beiden Instruktionsdateien. Keine alten Workflow-/Coordinator-/Submission-/ausführenden Parsermodule dort. Aktive Suchverträge direkt aus schemas/search; Runtime-/Provider-/Kartenverträge separat.

Verantwortungen entsprechen dem Suchzielbaum: Matrix bewertet ohne Texte/Zustandsänderung/Provideraufrufe; LLM interpretiert und validiert ohne Suche oder Zustandsübernahme; Flow übernimmt Kriterien/bindet Fragen/reserviert Ausführung; HTTP validiert und ordnet Sitzungen/Fehler zu; Titeladapter bildet Providerparameter/Karten/Zahlen ab.

Textkette geprüft: searchTexts.clarification → Flow bindet question.message → Pflichtfeld im gemeinsamen Schema → HTTP-Antwortvalidierung → Terminal zeigt gelieferten Text. Derselbe gebundene Text wird für Freitextklärung verwendet. Keine zweite fachliche Medienfrage im Client. Zwei Anwendungsfragen, sieben HTTP- und zwei Sessionmeldungen im zentralen Suchkatalog. Reine Terminalhilfen/Labels/Vorlagen in terminalTexts, keine Serverimporte. Freie Modellnachrichten separat. Interne LLM-Fehler werden am Such-HTTP-Rand auf processingFailed abgebildet.

TMDb-Fehlertexte seit 0e7c642 unter drei stabilen englischen Textschlüsseln in services/tmdb/errors.ts; Fehlercodes und Statusabbildung getrennt (400 ungültige Anfrage, 503 Konfiguration, 502 übriger Provider-/Antwortfehler). Keine i18n-Infrastruktur oder Sprachauswahl daraus ableiten.

Die zunächst als zu bewerten erfassten Chat-Verträge samt Barrel-Export und der createTmdbSpikeError-Alias sind durch die oben protokollierte Bereinigung entfernt. Das aktive TMDb-Hilfsmodul wurde nicht als Ganzes ausgemustert. Keine noch offene Löschungsentscheidung zu diesen konkreten Altbeständen.

Bekannte Architekturgrenzen: konkrete Matrix-Wegkennung wird nicht bis zur Ausführung durchgereicht; Medienfrage bleibt nach fehlendem Titel/passendem Weg der pauschale Restfall. Bei neuen Kriterien erneut bewerten. Keine Änderung aufgrund der statischen Prüfung.

## Abnahmekriterien und aktuelles Prüfprotokoll

| ID | Kriterium | Stand/Beleg und Grenze |
| --- | --- | --- |
| AC1 | Zielstruktur, keine alten Schichten/Importe, Testlücken erfasst | Suchproduktionspfade statisch ohne blockierenden Befund; konkrete Altbestände bereinigt. Projektweiter Vollscan ausdrücklich nicht im Abschlussumfang, nicht durchgeführt. Testbestandsaudit offen. |
| AC2 | Wege gegen gleichen Stand, bestätigte Kriterien/Umfang erhalten, keine mehrfachen Fachregeln | Code geprüft, Kriterienerhaltsfehler mit 1.5.3 nachgetestet; keine allgemeine Garantie semantischer LLM-Zuverlässigkeit. |
| AC3 | Titel allein/all über Multi, keine optionale Typ-/Jahresfrage | Normale Terminalfälle vom Nutzer bestätigt und Codeweg geprüft; keine nicht protokollierten Einzelresultate erfinden. |
| AC4 | Movie/TV, Jahr über primary_release_year/first_air_date_year | Titeladapterparameter statisch geprüft; normale Typ-/Jahreswege manuell bestätigt. |
| AC5 | Titel/Jahr/all erzeugt gebundene zentrale Anwendungsfrage, auch ausdrücklich beide Medien | Terminal/B08/R02/R03 und Code; keine instrumentierte vollständige Provideraufrufzählung. |
| AC6 | Auswahl ohne LLM, Freitext mit Kontext, Kriterien erhalten/ausdrücklich korrigiert | Strukturierter Pfad und Kriterienerhalt geprüft; select 1-Freitext außerhalb vereinbarten Umfangs; kein umfassender Freitextnachweis. |
| AC7 | Clarify sucht nicht, Execute nutzt bestätigten Stand ohne erneutes LLM | Flow/HTTP-Code und Hauptaudit; kein umfassendes internes Aufrufmonitoring. |
| AC8 | Altantworten unschädlich, reservierte Revision nicht doppelt starten | Bindungs-/Wiederholungs-/Parallelitäts-HTTP-Fälle und LLM-Verzögerung nachgewiesen bzw. Nutzerbestätigung; exakte Trefferaufrufzahl/Providerverzögerung/Browserrennen offen. |
| AC9 | Gründe und Formulierung getrennt, message bis CLI/Klärungskontext, keine doppelte Medienfrage/i18n auf Vorrat | Statische Textzuordnungsprüfung im Suchpfad abgeschlossen, ohne blockierenden Befund. |
| AC10 | Kompakte Treffer und getrennte Seiten-/Gesamtzahl, unbekannt nicht null, Zustände unterscheidbar | Anzeige/Adapter statisch geprüft, erfolgreiche Tabellen und HTTP-Zahlen beobachtet; kontrollierter Zählungsausfall/alle Leer-/Fehler-/Altresultatzustände nicht vollständig live geprüft. |
| AC11 | Aktuelle Check-/manuelle Nachweise einzeln dokumentiert, Testausbau zurückgestellt | Typecheck/Lint nach Bereinigung erneut vom Nutzer bestätigt, Terminal-/HTTP-Nachweise erfasst; gezielte Altbestandsausnahme dokumentiert. Testbestandsaudit und aktueller Projekttestlauf offen. |

## Gesamtzählung und historische Nachweise

Titeladapter liefert results/totalResults. Movie/TV direkte Providerzahlen ohne Zusatzaufruf; Multi zieht gesonderte Personenzählung bei gleichen Such-/Adult-/Standardparametern ab. Nur plausible Differenz, mindestens sichtbare Karten; Personenzahl mindestens Personen der ersten Multi-Seite. Fehlende/fehlerhafte/unplausible Metadaten → null, gültige Karten bleiben. Keine Rückkehr zur ungefilterten Multi-Zahl, keine Auffüllung/Pagination/Neusortierung. Leere erste Seite bedeutet nicht null insgesamt. Statische Prüfung ersetzt keine kontrollierte Fehlersimulation.

Historischer API-Versuch 09:13 CET: fünf Suchtexte mit Multi − Person = Movie + TV; Stichprobe, kein API-Vertrag oder ID-/Mengenbeweis. Historische Terminal-/Parservergleichs-/Commitdetails siehe verlinkten Vorzustand, nicht als neue Abnahme behandeln.

Entfernte Tests und offene Ersatzabsicherung: tests/unit/services/search-submission.spec.ts (25aaf44; Kriterienkopie/Jahrentfernung/unabhängige Kriterien), tests/integration/tmdb/search-submission.spec.ts (7940ca3; Direktsuche/Klärung/vollständige Kriterien). SEARCH-SUBMIT-INT-001 bis 005 historisch ausgemustert. Frühere Testimportprüfung auf 5244cb3 las 20 TS-Testdateien ohne Verweise auf entfernte Schemas; kein aktueller Testbestandsaudit. Die spätere Entfernung von chat.spec.ts betrifft einen ausgemusterten anderen Vertrag, keine nachgewiesene Ersatzabsicherung des aktuellen Suchvertrags.

## Verbleibende Grenzen und nächster Arbeitspunkt

Keine weiteren Simulationen beauftragt: Providerverzögerungen, kontrollierter Suchfehler und ausdrücklicher Neuversuch, isolierter Personenzählungsausfall, instrumentierte Provideraufrufzahlen, garantierte interne Execute-Überlappung, Sitzungslaufzeit/Mehrinstanzverhalten und Browser-/Wizardrennen bleiben ungeprüft. Kein Produktionsfreigabenachweis. Projektweiter Vollscan ausdrücklich nicht vorgesehen.

Nächster begrenzter Arbeitspunkt: bestehenden Testbestand auf fachliche Aktualität, Grenzen Matrix/Flow/LLM/Provider/HTTP, Doppelungen und fehlende Zusicherungen auditieren; priorisierte Bestandsbewertung dokumentieren. Konkrete Teständerungen separat vereinbaren. Danach aktuellen Testlauf und Dokumentationsabgleich erfassen und Architekturabschluss mit ausdrücklich verbleibenden Grenzen bewerten. Kein neuer Suchweg vor separater Entscheidung.
