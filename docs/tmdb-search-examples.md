# TMDb search examples

Collect concrete NuxtWatch searches and observed TMDb responses here. Keep one entry per user request, even when it takes multiple API calls. Never include credentials. Distinguish verified API behavior from proposed application contracts.

## 1. Title search: The Matrix

### User request and search contract

“Finde The Matrix.” No media type or year was supplied; neither is required for the initial search. The search object is `{ title: 'The Matrix' }`. The proposed `TitleSearchSchema` has one required field: `title: z.string().trim().min(1)`.

### TMDb request

`GET https://api.themoviedb.org/3/search/multi?query=The%20Matrix&include_adult=true`

Map `title` to `query`. Always request `include_adult=true` and do not exclude movie or TV hits based on `adult`. The default app locale is `en`: omit `language` for `en`, and explicitly map other supported locales (for example, `de` to `de-DE`). Omit `page` on the initial call; request subsequent pages on demand. These are execution options, not fields in the search object.

### Observed results

The authenticated default request returned HTTP 200, `page: 1`, `total_pages: 4`, and `total_results: 62`. Page 1 contained 20 results: 18 movies and two TV shows. The first result was The Matrix (1999), ID `603`. No hit on this page had `adult: true`; pages 2–4 of this request were not inspected. The reported total is the upstream count, not a count of cards. A person hit was observed in an earlier Multi Search run with different options.

### Card contract

Map only `movie` and `tv` hits to title cards. Use `id` and `mediaType` together to identify a result; do not merge titles by display name. Map `title` or `name` to `title`, `release_date` or `first_air_date` to `date`, `backdrop_path` to `backdropPath`, and `genre_ids` to `genreIds`. Use `vote_average` as `rating` when `vote_count > 0`; otherwise use `null`. Pagination belongs to the result list, not the card.

Example mapped from the first result:

```json
{
  "id": 603,
  "mediaType": "movie",
  "title": "The Matrix",
  "backdropPath": "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg",
  "date": "1999-03-31",
  "genreIds": [28, 878],
  "rating": 8.263
}
```

Keep `id`, `mediaType`, and `title` required. Preserve missing display data as `null` for `backdropPath`, `date`, or `rating`, and as an empty list for `genreIds`. The Approval Matrix (`tv`, ID `325692`) had no backdrop, no genres, and no votes. The card component will handle display fallbacks later: a fallback graphic for a missing backdrop, fallback text for missing genres, and field-specific choices for the remaining values. Do not inject visual placeholders into mapped data. Age certification, match percentage, and favorite state are outside this TMDb card contract.

Status: API request verified; application schemas and card rendering are not implemented by this documentation change.

## 2. Movie title search with a release year: The Matrix (1999)

User request: “Finde den Film The Matrix von 1999.” The comparison uses the same Movie Search endpoint and query, omitting only `primary_release_year`. Both requests omit `language` and `page`.

### TMDb requests

With `NUXT_TMDB_API_READ_ACCESS_TOKEN` set in the shell, run the comparison request without a year:

```bash
curl --silent --show-error --get \
  --url 'https://api.themoviedb.org/3/search/movie' \
  --data-urlencode 'query=The Matrix' \
  --data-urlencode 'include_adult=true' \
  --header "Authorization: Bearer ${NUXT_TMDB_API_READ_ACCESS_TOKEN:?Set the TMDb read access token}" \
  --header 'accept: application/json' \
  --write-out '\nHTTP %{http_code}\n'
```

For the year-filtered request, add `--data-urlencode 'primary_release_year=1999'` to the same command.

### Observed results

| Request | HTTP | `page` | `total_pages` | `total_results` | Results returned |
| --- | ---: | ---: | ---: | ---: | ---: |
| Without year | 200 | 1 | 3 | 58 | 20 |
| With `primary_release_year=1999` | 200 | 1 | 1 | 3 | 3 |

*The Matrix* (1999, ID `603`) ranked first in both responses. Without the year, three sequels ranked second through fourth, and two other entries shared the display title *The Matrix* (IDs `1386216` and `1502836`). Pages 2 and 3 were not inspected.

The year-filtered response also contained *Making "The Matrix"* (`684431`) and *The Matrix: What Is Bullet-Time?* (`684428`). The year narrows the result list but does not make the match unique. The latter result was not on page 1 of the unfiltered response; its position in the full unfiltered list was not checked.

Status: Both API requests verified. No parser, schema, or selection behavior is defined by this example.
