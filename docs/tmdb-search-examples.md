# TMDb search examples

Collect concrete NuxtWatch searches and their observed TMDb responses here. Keep one entry per user request, even when it takes multiple API calls. Never include credentials. Separate observations from provisional decisions.

## 1. Title search: The Matrix

### User request

“Finde The Matrix.” Treat this as a title search. The user supplied neither a media type nor a year; do not ask for either before the initial search.

### TMDb request

`GET https://api.themoviedb.org/3/search/multi?query=The%20Matrix`

Use `/search/multi` as the first endpoint to evaluate, not as a settled implementation choice. Send TMDb authentication separately from the recorded URL.

### Observed results

The unauthenticated fetch did not return a usable response. No HTTP status, response payload, or results were captured. An authenticated run is pending. Record its HTTP status, `page`, `total_pages`, `total_results`, and a short excerpt of `results`. Preserve the returned field names and include representative movie or TV results if present.

### Implications for NuxtWatch

The title is the only user-supplied input in this example. After the authenticated run, identify which response fields are needed for movie and TV cards and for a detail request after card selection. Check how media types are distinguished and how non-title results should be handled. Do not change schemas or tests based on an unobserved payload.
