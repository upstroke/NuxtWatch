# Keyword Resolution

Planned. Nothing described here is implemented. Phase A is independent; Phases B and C build on the Discover genre path described in the [search concept](search-architecture-concept.md#descriptive-search-planned).

## Goal

Support requests such as "Ich suche einen Sci-Fi-Film mit dunkler Atmosphäre". The genre maps to `with_genres`; the mood is represented by TMDb keyword IDs passed as `with_keywords`. A keyword is a means of representing the mood, not a proven mood filter; whether it improves results is checked in Phase B.

Follow the [search concept](search-architecture-concept.md), [development rules](../AGENTS.md), [typing rules](typing.md) and [testing rules](testing.md). Provider facts belong in the [API analysis](tmdb-api-analysis.md#genre-and-keyword-filters).

## Flow

| Step                     | Owner            | Example result                                                                 |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| 1. Interpret the request | Parser model     | `mediaType: movie`, `genre: science_fiction`, `keywordQuery: "dark"`; no title |
| 2. Map the genre         | Application      | Provider genre ID for the media type (no model, no lookup)                     |
| 3. Retrieve candidates   | Keyword catalog  | Local candidates whose names match `dark`                                      |
| 4. Select keywords       | Resolver model   | 1–3 candidate IDs such as `dark`, not `dark comedy`; or no match or a question |
| 5. Evaluate the path     | Matrix           | No title, `movie`, genre and resolved keywords → Discover Movie                |
| 6. Execute               | Discover adapter | `/discover/movie?with_genres=…&with_keywords=…`                                |

The parser never returns keyword IDs. The resolver never interprets the full search object, accepts criteria or authorizes execution. Execution waits until every requested keyword preference is resolved, answered with no match, or explicitly withdrawn.

## Parser Recognition

Implemented as a separate instruction module, added to the parser instructions only when keyword support is enabled.

- `genre`: only when the user names a category that matches a listed genre identifier. Never a provider ID.
- `keywordQuery`: a short English lookup term (one or two words) for a requested mood, theme or setting that no listed genre covers. Always English, regardless of locale and input language, because keyword names are English. The meaning is translated, not the words: "dunkle Atmosphäre" → `dark`.
- A genre is not put into `keywordQuery`, and a mood is not expressed as a genre.
- No mood, theme or setting is added that the user did not request.
- A description is not a title. When a title and a description are both requested, both are represented; the matrix decides whether the combination can run.
- A mood too vague for one lookup term leads to a clarification question.

## Local Keyword Catalog

- Source: the TMDb daily keyword export (see [API analysis](tmdb-api-analysis.md#genre-and-keyword-filters)). Line fields are verified against a real download before the schema is written.
- A download script stores the export in a local data directory that is not committed. The server loads it at startup into a `Map` from ID to name, validating each line with Zod. Invalid lines are counted and reported; a catalog with load errors is not presented as complete.
- The catalog records its export date. Refresh is a manual script run at first; a scheduled refresh is added only when needed.
- Candidate retrieval: case-insensitive substring match on `keywordQuery`, ordered exact match, prefix match, then other matches, at most 50 candidates. When more names match, the result is marked as truncated.
- Semantic retrieval (embeddings over keyword names) is added only if the evaluation shows that substring matching misses suitable keywords.
- The export has no usage counts. A fitting keyword may be attached to very few titles; Phase B checks this.

## Resolver

Separate versioned instructions in `src/lib/parser/keyword-selection-instructions.ts`, using the shared model transport.

Input: the full user request, the mood phrase, explicitly confirmed context (media type, genre, year) and the complete candidate list (ID and name). User text and candidate names are untrusted data.

Output, one of:

```
{ status: 'selected', keywordIds: number[], reason: string }   // 1–3 unique IDs
{ status: 'no_match', reason: string }
{ status: 'needs_clarification', question: string }
```

- The application checks that every ID belongs to the supplied candidates and is unique. Display names come from the catalog, not from model text.
- Lexical matches are not accepted on their own: `dark comedy`, `dark fantasy` and `dark future` add unrequested genre, theme or setting constraints.
- Several IDs do not define AND/OR semantics; the application decides how they combine.
- Invalid output is a failure, not permission to drop the preference. `reason` is one short sentence for diagnostics.

## Phases

- **Phase A — catalog and resolver.** Terminal-only experiment: retrieve candidates for a supplied lookup term, run the resolver, display the outcome. No Discover call, no change to confirmed criteria.
- **Phase B — result usefulness.** Requires separate approval and the Discover genre path. Compare a genre-only baseline with the same request plus selected keywords. Define relevance criteria before the comparison. Decide whether the keyword works as a hard filter, needs another treatment, or cannot be supported faithfully.
- **Phase C — integration.** Requires separate approval and Phase B evidence. Shared criteria distinguish the requested `keywordQuery` from resolved `keywordIds`; the parser keyword module, matrix, flow and Discover adapter are extended as one vertical slice.

## Tasks

- [ ] K1 — Verify provider evidence: download the keyword export (fields, line count, size); request `/search/keyword?query=düster` and `/search/keyword?query=dark`; record the results in the [search examples](tmdb-search-examples.md).
- [ ] K2 — Keyword catalog: download script, line schema, loader, candidate retrieval. Unit tests for invalid lines, ordering and truncation.
- [ ] K3 — Resolver: instructions, output schema, membership and uniqueness validation. Unit tests with controlled model output.
- [ ] K4 — Terminal experiment and real-model evaluation (live audit): synonyms (`düster`, `dunkel`, `finster`), lexical traps, no-match and vague cases.
- [ ] K5 — Review Phase A; decide on Phase B.
- [ ] K6 — Phase B comparison (separate approval).
- [ ] K7 — Phase C integration (separate approval).

## Open Points

- Whether one lookup term per mood is enough, or the parser should return up to three.
- Whether embeddings are needed (decided after K4).
- How English keyword names are shown to users of other locales.
- Data directory location and refresh mechanism in deployed environments.
