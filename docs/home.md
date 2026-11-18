# Home screen

The home screen shows trending movies and TV shows before the user starts a search. The cards give users something to browse immediately. They are not search results or personalized recommendations.

## Data source

Use TMDb `GET /3/trending/all/week` to populate the initial cards. Make the request server-side. Use the weekly window as the default; the home screen does not need a day/week selector.

## Card rules

- Map movie and TV entries to title cards. Skip person entries.
- Do not exclude movies or TV shows based on the `adult` flag. Titles with `adult: true` are eligible if TMDb returns them. This is a rule for handling the response, not an additional request parameter.
- Keep an empty result distinct from a loading failure. A failed TMDb request is not an empty list of trending titles.

## Search boundary

Loading the home screen only populates the cards. It does not call the LLM, prefill the search input, create or modify the shared search object, or start a title search. The chat-driven title search is separate; see [Task 001](tasks/001-title-search.md).
