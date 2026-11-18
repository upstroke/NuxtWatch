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
| Catalog | [`/genre/movie/list`](https://developer.themoviedb.org/reference/genre-movie-list) | List film genres. |
| Catalog | [`/genre/tv/list`](https://developer.themoviedb.org/reference/genre-tv-list) | List series genres. |
| Credits | [`/person/{person_id}/tv_credits`](https://developer.themoviedb.org/reference/person-tv-credits) | Retrieve a person's TV credits. |
| External ID | [`/find/{external_id}`](https://developer.themoviedb.org/reference/find-by-id) | Look up TMDb entries using an external identifier. |

## Observed responses

No observations recorded yet. For each test, record the endpoint and parameters, HTTP status, relevant response fields, and any limits or surprises. Do not include credentials.

## Decisions for NuxtWatch

Open: which endpoints to use, which response fields to retain, and when to combine requests or filter results in the application.
