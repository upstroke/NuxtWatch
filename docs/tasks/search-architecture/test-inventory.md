# Direkter Suchablauf: Abnahme und Testinventur

## Umfang

`submitAndSearch` verbindet Parser, Koordinator und den bestehenden Titelsuchdienst. Der erste Schnitt unterstützt einen Titel mit `mediaType: all` ohne Jahr. Runtime-Konfiguration, HTTP-Einstieg, CLI und die Fortsetzung nach einer Klärung sind nicht Bestandteil dieses Schritts.

Die folgende Inventur wurde nach der ersten Implementierung ergänzt und korrigiert deren Testeinordnung. Sie ist kein Nachweis bereits ausgeführter Tests.

## Beobachtbare Abnahmekriterien

- AC1: Eine ausführbare direkte Eingabe führt genau zu einer gemischten Titelsuchanfrage; Kriterien und Ergebnis werden zurückgegeben.
- AC2: Eine Parser-Rückfrage lässt bestehende Kriterien unverändert und startet keine Treffersuche.
- AC3: Ein Jahr bei Medientyp `all` führt zur fachlichen Medientyp-Rückfrage, nicht zur Treffersuche.
- AC4: Ein vom aktuellen Dienst nicht unterstützter konkreter Medientyp wird nicht weggelassen; die Suche wird ausdrücklich abgelehnt.
- AC5: Ein vom aktuellen Dienst nicht unterstütztes Jahr wird nicht weggelassen; die Suche wird ausdrücklich abgelehnt.

## Zusicherung → Grenze → vorhandener Test oder Lücke

| Zusicherung                                                                                                                         | Testgrenze                                                                                | Test oder verbleibende Lücke                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| AC1: Parser, Kriterienentscheidung und Suchdienst sind korrekt verbunden.                                                           | Kontrollierte Integration mit kontrollierter Modellausgabe und ausgehendem TMDb-Transport | `tests/integration/tmdb/search-submission.spec.ts`, SEARCH-SUBMIT-INT-001                                                               |
| AC2: Parser-Klärungsbedarf verhindert einen Suchaufruf.                                                                             | Kontrollierte Integration                                                                 | SEARCH-SUBMIT-INT-002                                                                                                                   |
| AC3: Fachliche Rückfrage verhindert einen Suchaufruf.                                                                               | Kontrollierte Integration                                                                 | SEARCH-SUBMIT-INT-003                                                                                                                   |
| AC4: Konkreter Medientyp bleibt erhalten und verhindert eine unvollständige Suche.                                                  | Kontrollierte Integration                                                                 | SEARCH-SUBMIT-INT-004                                                                                                                   |
| AC5: Jahr bleibt erhalten und verhindert eine unvollständige Suche.                                                                 | Kontrollierte Integration                                                                 | SEARCH-SUBMIT-INT-005                                                                                                                   |
| Akzeptierte Änderungen werden auf eine Kopie angewandt; `year: null` entfernt das Jahr.                                             | Unit, Koordinator                                                                         | `tests/unit/services/search-submission.spec.ts`                                                                                         |
| Systeminstruktionen und Nutzereingabe bleiben getrennt; ungültige Ausgabe und Modell-Endpunktwahl werden abgelehnt.                 | Unit, tatsächlich verwendete Parser-Vertragsgrenze                                        | `tests/unit/services/search-parser.spec.ts`                                                                                             |
| Gemischte Treffer werden normalisiert, Personen ausgelassen, leere und ungültige Antworten unterschieden, Transportfehler erhalten. | Unit, Titelsuchdienst                                                                     | Bereits in `tests/unit/services/title-search.spec.ts`; keine erneute Kartenfeld- oder Transportfehlermatrix im Suchablauf               |
| HTTP-Eingaben, Statuscodes und Fehlerabbildung funktionieren am laufenden Server.                                                   | HTTP-Integration                                                                          | Offen bis zum HTTP-Einstieg; dort nicht die gesamte interne Fallmatrix wiederholen                                                      |
| LM Studio und TMDb funktionieren mit realer lokaler Konfiguration zusammen.                                                         | Manueller Live-Abgleich                                                                   | Noch nicht bestätigt                                                                                                                    |
| SDK-Aufruf und Leerantwortbehandlung des LLM-Adapters erfüllen den benötigten Vertrag.                                              | Unit an der SDK-Grenze                                                                    | Noch nicht geprüft; ein zusätzlicher Test wird nach konkreter Risikoprüfung gewählt, nicht aufgrund eines dateibezogenen Coverage-Ziels |

## Einordnung und Prüfstatus

Die frühere gemischte Unit-Suite wurde durch engere Koordinator- und Parser-Tests sowie die kontrollierte Integration ersetzt. Integrationskennungen sind je Test eindeutig. Deterministische Daten und Transport-Doubles sind derzeit nur lokal nötig; bei gemeinsamer Nutzung nach `tests/fixtures` beziehungsweise `tests/mocks` auslagern.

Die kontrollierte Integration verwendet reale interne Module und ersetzt ausschließlich externe Grenzen. Die Prüfung der leeren Ergebnisweitergabe in AC1 ist keine erneute Mapping-Fallmatrix.

Tests, Typecheck, Lint und Coverage wurden bei der Erstellung dieser Korrektur nicht ausgeführt. Der globale Statement-Mindestwert bleibt unverändert; es gibt kein Coverage-Ziel pro Datei. Maßgeblich sind `docs/testing.md` und `vitest.config.ts`.
