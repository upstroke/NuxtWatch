# Home screen

The home screen shows trending movies and TV shows before a user starts a search. These cards are neither search results nor personalized recommendations. This document describes the home-screen goal, not a new implementation or verification record.

## Data source and cards

Use server-side TMDb `GET /3/trending/all/week` for the initial cards, with the weekly window as the default and no day/week selector required. Map movie and TV entries, skip people, and do not exclude returned titles based on the `adult` flag. This is response handling, not an added request parameter. Keep a loading failure distinct from an empty successful list.

## Search boundary

Loading the home screen does not call the LLM, create a search request, prefill criteria or mutate the shared search object. An empty search object does not itself request Trending. Explicit daily trends in a later search flow are different from the weekly home-screen default.

The shared search and clarification flow is defined in the [search concept](sucharchitektur-konzept.md), with the actual implementation status in the [search README](tasks/search-architecture/README.md). The text-based terminal remains an alternative search interface; it does not need to recreate the home screen.
