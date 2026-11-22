# Task 01 – Gemeinsame Suchmatrix und Ablaufsteuerung

Status: im vereinbarten Such-/Titelumfang abgeschlossen. Stand: 22. November 2026, nach Live-Lauf um 18:23 CET. Branch `feat/shared-search-architecture`, geprüfter Arbeitsstand mit `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69`. Keine vollständige Produktions-, Race-, Browser- oder Modellabnahme.

Grundlagen: [Konzept](../../sucharchitektur-konzept.md), [Zielstruktur](zielstruktur.md), [Arbeitsstand](README.md), [TMDb-Analyse](../../tmdb-api-analysis.md), [Requests](../../tmdb-search-examples.md). Ältere Detailprotokolle einschließlich B-/R-/D-Audits, Altbestandsbereinigung, AC-Historie und Modellvergleich bleiben im [Dokumentstand vor Abschluss](https://github.com/upstroke/NuxtWatch/blob/d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69/docs/tasks/search-architecture/01-shared-search-matrix.md) erhalten. Historische Fehler oder eingeschränkte Nachweise werden durch den Abschluss nicht rückwirkend bestanden.

## Umfang und Ergebnis

Gemeinsamer Coordinator mit Kriterienübernahme, Hindernismatrix, konsolidierten externen Verträgen, zentralen Texten, Titeladapter, Terminal und HTTP-/Sessionanbindung. Titel ist Abnahmefall gemeinsamer Architektur, kein eigener Parser je Weg. Gesamtzählung ausdrücklich nachbeauftragt. Keine neue Keyword-/Personen-/Discovery-Strecke, Jahresbereiche, Web-Wizard, Datenbank, Regel-Engine, vollständige i18n oder neuer Modellvergleich.

Titel/all ohne Jahr nutzt Multi. Movie/TV optional mit Jahr nutzt den jeweiligen Endpunkt. Titel/Jahr/all verlangt gebundene Medienauswahl, auch bei ausdrücklich beiden Medien. Titel/Jahr bleiben erhalten; kein geratenes Medium, entferntes Jahr oder Zusammenführen/Nachfiltern von Listen. Bestätigte Kriterien nur ausdrücklich ändern; Prompt 1.5.3 präzisiert dies nach dem früher beobachteten Kriterienerhaltsfehler. Positive Modellfälle sind keine allgemeine Zuverlässigkeitsgarantie.

Clarify sucht nicht; angebotene Auswahl ohne LLM, Freitext über gemeinsame Interpretation. Nach Klärung erst Execute; ausführbarer neuer Submit darf direkt suchen. Execute interpretiert nicht erneut. Gemeinsame Reservierung verhindert erneuten Start laufender/erfolgreicher Revision; Fehler erlaubt ausdrücklichen Neuversuch.

## Gezielter Testabschluss

Allgemeiner Testumbau war zurückgestellt; die folgenden Blöcke wurden anschließend separat vereinbart und einzeln freigegeben. Kein pauschales Löschen, keine Coverage-Ausschlüsse oder Kompatibilitätsschichten. Keine Behauptung eines vollständigen projektweiten Testbestandsaudits. Die priorisierten Lücken im vereinbarten Suchbereich wurden durch die gezielten Blöcke bearbeitet.

| Commit | Änderung und Nachweis |
| --- | --- |
| `8172f08` | Titeladapter: Movie/TV mit/ohne Jahr, direkte Zahlen, Multi minus Person, fehlende/unplausible Metadaten, isolierter Personen-Zählungsfehler, leere Seiten; Testlauf vom Nutzer erfolgreich bestätigt |
| `0e0e002` | Echter Flow mit Matrix/Vorschlagsvalidierung/Adapter: Kriterienkopie/-erhalt, ausdrückliche Änderungen/Jahrentfernung, Medien-/Freitextklärung ohne Suche, Execute, Altbindungen, Reservierung, expliziter Neuversuch nach Providerfehler; Nutzer bestätigt Tests |
| `e885a7c` | Echter Handler und echte Sessionverwaltung über isolierten H3-HTTP-Server: Validierung, Cookie, Sessiontrennung, Reset, Konflikte, Antwortvertrag und no-store; Nutzer bestätigt Tests |
| `d6e071c` | Initialisierungsprüfung des Provider-Gates vor Ausführungsstart statt Throw im finally; Freigabe im finally erhalten, keine Regelabschaltung |

Interne Suchmodule werden nicht gemockt. Kontrolliert werden äußere Modellgenerierung und TMDb-Transport; im HTTP-Harness Runtime-Konfiguration sowie Nuxt-Autoimports durch echte H3-Implementierungen bereitgestellt. Kein vollständiger Nuxt-/Nitro-/Browserlauf.

Am 22. November 18:17 CET bestätigt der Nutzer nach der Lint-Korrektur Tests, Lint und Typecheck als in Ordnung; anschließend Coverage über 80%. Keine genaue Quote, Coverage-Metrik oder Testanzahl angegeben. Diese Projektbefehle wurden lokal vom Nutzer ausgeführt, nicht vom Assistant.

## Aktueller Live-HTTP-Audit

Nutzerlauf am 22. November 2026 gegen `http://localhost:3000`, Bericht `search-flow-audit-report.json`, 17:23:14.748Z bis 17:23:31.397Z (18:23 CET). Acht PASSED, null FAILED, null BLOCKED. Konsolenausgabe und JSON-Bericht in der Unterhaltung geprüft. Bericht enthält Commit `d6e071ca8e5a2f28ccf14831c1d7e5f547f46e69`; vom Aufrufer übergeben, nicht gegen den laufenden Server verifiziert. Kein vom Assistant gestarteter Live-Lauf.

| Fall | Beobachtung |
| --- | --- |
| LIVE-001 | Neuer Submit bei offener Frage ersetzt Auftrag; alte Antwort 409, neue Frage beantwortbar |
| LIVE-002 | Falsche Request-ID, Frage-ID und Revision jeweils 409; gültige Antwort danach nutzbar |
| LIVE-003 | Doppelte Klärungsantwort 409; bestätigte Revision danach erfolgreich ausführbar |
| LIVE-004 | Reset setzt Ausgangskriterien; alte Bindungen unter neuem Cookie 409, altes Cookie 410 |
| LIVE-005 | Neuer Submit invalidiert zuvor vorbereitetes Execute; alter Aufruf 409, neue Frage nutzbar |
| LIVE-006 | Erstes Execute completed; Wiederholung derselben Revision 409 |
| LIVE-007 | Gleichzeitig abgesendet: einmal completed/200, einmal 409; keine garantierte interne Überlappung |
| LIVE-008 | Filme und Serien mit Jahr erzeugt Medienfrage; Execute davor 409, Auswahl clarified |

Alle protokollierten Antworten tragen Cache-Control: no-store. Die drei erfolgreichen Execute-Antworten enthalten jeweils drei Karten; kein allgemeiner Treffer-/Gesamtzahlvertrag aus dieser Stichprobe. Der Audit prüft benötigte Antwortfelder, nicht das vollständige gemeinsame Schema.

Skript nur lokal als Datei bereitgestellt, Syntaxprüfung mit node --check erfolgreich. Commit des Skripts vom Nutzer abgelehnt; weder Skript noch Rohberichte werden mit diesem Dokumentationsabschluss ins Repository übernommen. Keine dauerhafte Startanleitung auf eine angeblich versionierte Auditdatei.

## Architektur- und Abnahmeeinordnung

- AC1/AC9: Struktur-/Import- und Textzuordnungsprüfung auf gelesene Suchproduktionspfade begrenzt, ohne blockierenden Befund. Konkrete Chat-Verträge/Export und Spike-Fehleralias gezielt entfernt. Projektweiter Vollscan am 22. November ausdrücklich aus dem Abschlussumfang genommen; nicht durchgeführt und kein offener Pflichtauftrag.
- AC2–AC5: gemeinsame Kriterien-/Umfangsbewertung, direkte Titelwege, Jahresparameter und gebundene Medienfrage im vereinbarten Umfang durch Codeprüfung, normale Nutzerläufe und gezielte Tests belegt.
- AC6/AC7: Auswahl, Freitextkorrektur, Kriterienerhalt und Klärung/Execute-Trennung gezielt automatisch geprüft; aktueller Live-Audit belegt strukturierte Auswahl. Kein umfassender Live-Freitext-/Modellnachweis.
- AC8: falsche/alte/verbrauchte Bindungen, Wiederholung und Reservierung automatisch sowie HTTP-stichprobenartig geprüft. Deterministischer Provider-Gate-Test belegt Reservierung auf Serviceebene, nicht interne Überlappung im Live-Server.
- AC10: Karten-/Zählungsgrenzen und isolierter Zählungsfehler automatisch geprüft; kontrollierter realer Personen-Zählungsausfall weiterhin nicht live erzeugt. Erfolgreiche leere Antworten in Tests sind kein vollständiger Live-Nachweis aller Leer-/Fehler-/Altresultatzustände.
- AC11: Projektchecks, gezielte Tests und aktuelle Live-Nachweise getrennt mit Herkunft dokumentiert. Dokumentationsabgleich abgeschlossen; kein universeller Bestandsaudit behauptet.

Zentrale Textkette: searchTexts → gebundenes question.message → gemeinsames Schema/HTTP → CLI und Freitextkontext. Reine Terminaltexte lokal, freie Modellnachrichten separat. Seit `0e7c642` drei stabile englische TMDb-Textschlüssel in services/tmdb/errors.ts; Wortlaut, Fehlercodes und Statusabbildung unverändert. Keine neue i18n oder Sprachauswahl.

Bekannte Architekturgrenzen: konkrete Matrix-Wegkennung wird nicht bis zur Ausführung durchgereicht; Medienfrage bleibt pauschaler Restfall nach fehlendem Titel/passendem Weg. Bei neuen Kriterien erneut prüfen. Allgemeine Teilübernahme bei LLM-Klärung ist nicht vollständig umgesetzt.

## Verbleibende Grenzen und weitere Arbeit

Nicht nachgewiesen: garantierte Live-Überlappung, instrumentierte interne Provideraufrufzahlen, gezielt verzögerte TMDb-Antworten, kontrollierte reale Provider-/Personenzählungsausfälle, vollständige Browser-Cookierennen, Sessionablauf/Kapazitätsgrenze, Mehrinstanz-/Neustartverhalten oder dauerhafte semantische LLM-Zuverlässigkeit. Technischer Fehler und ausdrücklicher Neuversuch sind auf Serviceebene automatisch geprüft, nicht als realer Providerfehler simuliert.

Historische D01/D02-Verzögerungsnachweise bleiben mit ihren damaligen Einschränkungen im verlinkten Vorzustand. R04-Freitext select 1 bleibt historisch fehlgeschlagen und ausdrücklich außerhalb des vereinbarten Terminalumfangs; kein stillschweigender Fix oder aktueller Erfolgsnachweis. Strukturierte Wizardanbindung selbst nicht abgenommen.

Keine Produktionsfreigabe; Zugriffsschutz und Betriebsanforderungen separat klären. Keine weiteren Simulationen, neuen Suchwege oder allgemeinen Testmigrationen aus diesem Abschluss ableiten. Task 02 erst nach ausdrücklicher Wahl eines nächsten Anwendungsfalls.
