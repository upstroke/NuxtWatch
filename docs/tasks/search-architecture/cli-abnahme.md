# CLI-Abnahme: erste Titelsuche

Diese Fälle beschreiben das Zielverhalten, nicht den Iststand. Die CLI zeigt Serverentscheidungen an; sie wählt keinen TMDb-Endpunkt selbst.

## Direkt: Finde The Matrix

`submit` startet die direkt ausführbare Titelsuche über TMDb Multi Search und liefert Treffer. Die CLI stellt keine Rückfrage und verlangt keine zweite Bestätigung. Mehrere Treffer allein sind kein Klärungsgrund.

## Mit Rückfrage: Finde The Office von 2005

1. `submit` liefert die Rückfrage „Meinst du einen Film oder eine Serie?“. Es gibt noch keinen TMDb-Trefferaufruf.
2. Der Nutzer wählt „Serie“ und bestätigt mit „Übernehmen“. `clarify` liefert die bestätigten Kriterien `The Office`, `2005` und `Serie`. Die CLI zeigt sie an; es gibt weiterhin keinen TMDb-Trefferaufruf.
3. Erst „Suche starten“ sendet `execute`. Der Server ruft TMDb TV Search mit `query=The Office` und `first_air_date_year=2005` auf. Die CLI zeigt die zurückgegebenen Treffer an.

Im ersten Schnitt werden Film- und TV-Listen für diesen Fall nicht zusammengeführt. Die dokumentierte US-Serie (TMDb-ID `2316`) eignet sich als Fixture; eine feste Live-Trefferzahl ist kein Abnahmekriterium. Siehe [TMDb-Beispiele](../../tmdb-search-examples.md).
