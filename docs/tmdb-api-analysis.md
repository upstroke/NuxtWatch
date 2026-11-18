# TMDb API analysis

This working document collects findings for NuxtWatch. Start with the API endpoints; record observed responses and decisions separately as we test them. The inventory is not a commitment to use every listed endpoint. No request has been verified live for this document yet.

## Endpoint inventory

All paths below are GET endpoints relative to `https://api.themoviedb.org/3`.

| Group | Endpoint | Documented purpose |
| --- | --- | --- |
| Search | [`/search/movie`](https://developer.themoviedb.org/reference/search-movie) | Find films by title. |
| Search | [`/search/tv`](https://developer.themoviedb.org/reference/search-tv) | Find series by title. |
| Search | [`/search/multi`](https://developer.themoviedb.org/reference/search-multi) | Search films, series and people with one text query. |
| Search | [`/search/person`](https://developer.themoviedb.org/reference/search-person) | Find people by name. |
| Search | [`/search/keyword`](https://developer.themoviedb.org/reference/search-keyword) | Find TMDb keywords by text. |
| Search | [`/search/company`](https://developer.themoviedb.org/reference/search-company) | Find companies by name. |
| Search | [`/search/collection`](https://developer.themoviedb.org/reference/search-collection) | Find film collections by name. |
| Discover | [`/discover/movie`](https://developer.themoviedb.org/reference/discover-movie) | Find films by filters. |
| Discover | [`/discover/tv`](https://developer.themoviedb.org/reference/discover-tv) | Find series by filters. |
| Trending | [`/trending/all/{time_window}`](https://developer.themoviedb.org/reference/trending-all) | List trending films, series and people together. |
| Trending | [`/trending/movie/{time_window}`](https://developer.themoviedb.org/reference/trending-movies) | List trending films. |
| Trending | [`/trending/tv/{time_window}`](https://developer.themoviedb.org/reference/trending-tv) | List trending series. |
| Trending | [`/trending/person/{time_window}`](https://developer.themoviedb.org/reference/trending-people) | List trending people. |
| Details | [`/movie/{movie_id}`](https://developer.themoviedb.org/reference/movie-details) | Get film details by TMDb ID. |
| Details | [`/tv/{series_id}`](https://developer.themoviedb.org/reference/tv-series-details) | Get series details by TMDb ID. |
| Watch providers | [`/movie/{movie_id}/watch/providers`](https://developer.themoviedb.org/reference/movie-watch-providers) | Get film availability by country. |
| Watch providers | [`/tv/{series_id}/watch/providers`](https://developer.themoviedb.org/reference/tv-series-watch-providers) | Get series availability by country. |
| Catalog | [`/genre/movie/list`](https://developer.themoviedb.org/reference/genre-movie-list) | List film genres. |
| Catalog | [`/genre/tv/list`](https://developer.themoviedb.org/reference/genre-tv-list) | List series genres. |
| Credits | [`/person/{person_id}/tv_credits`](https://developer.themoviedb.org/reference/person-tv-credits) | Retrieve a person's TV credits. |
| External ID | [`/find/{external_id}`](https://developer.themoviedb.org/reference/find-by-id) | Look up TMDb entries using an external identifier. |

Trending uses `day` or `week` as `time_window`. It lists trends for that window rather than matching a text query or a set of Discover filters.

For a detail page opened from a TMDb result, use the result's TMDb ID and media type to choose the details endpoint. `/find` is not needed for this flow. The watch-provider endpoints report availability by country (for example, `results.DE` for Germany) and distinguish options such as subscription (`flatrate`), rental (`rent`), and purchase (`buy`). Attribute the data to JustWatch when displaying it. The returned link points to TMDb, not directly to playback.

## Observed responses

No observations recorded yet. For each test, record the endpoint and parameters, HTTP status, relevant response fields, and any limits or surprises. Do not include credentials.

## Decisions for NuxtWatch

Open: which endpoints to use, which response fields to retain, when to combine requests or filter results in the application, and whether to use Trending when no search criteria are set.
