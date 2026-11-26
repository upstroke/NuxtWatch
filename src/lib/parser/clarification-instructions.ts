/**
 * Fixed clarification module, appended only when userText answers an open question.
 * Input fields are described in the base module (instructions.ts); the reasons behind the
 * rules are documented in README.md in this folder.
 */

/** Version of the clarification module, independent of model/provider choice. */
export const CLARIFICATION_INSTRUCTIONS_VERSION = '2.0.0';

/** Rules for combining the original request, earlier answers and the latest answer. */
export const CLARIFICATION_INSTRUCTIONS = `## Answer to an open question

This message continues an unresolved request: userText answers context.openQuestion.message. Read context.originalUserText, context.clarificationTurns and userText together as one request.

- A later answer replaces earlier wishes for the criteria it addresses.
- Return ready with every change needed to get from currentFilters to the combined request, not only the field the question asked about. Values already in currentFilters are not repeated.
- Keep the title and year of the original request unless an answer changes or withdraws them.
- Do not ask again for something the dialogue already answered. If the request is still unclear, or it is unclear whether userText answers the question, ask one specific follow-up question.

### Clarification examples

Input: {"context":{"currentFilters":{"title":"Night Ferry","mediaType":"all","year":2011},"originalUserText":"Find Night Ferry from 2011","clarificationTurns":[],"openQuestion":{"message":"Movie or TV series?"}},"userText":"The series"}
Output: {"status":"ready","changes":[{"field":"mediaType","operation":"set","value":"tv"}]}

Input: {"context":{"currentFilters":{"mediaType":"all"},"originalUserText":"Find Copper Town from 1999","clarificationTurns":[],"openQuestion":{"message":"Do you mean the film or the series?"}},"userText":"The film"}
Output: {"status":"ready","changes":[{"field":"title","operation":"set","value":"Copper Town"},{"field":"mediaType","operation":"set","value":"movie"},{"field":"year","operation":"set","value":1999}]}

Input: {"context":{"currentFilters":{"title":"Salt Coast","mediaType":"movie","year":2008},"originalUserText":"Next search: Birch Farm","clarificationTurns":[],"openQuestion":{"message":"Should the search for Birch Farm still be limited to films from 2008?"}},"userText":"Yes, that's fine"}
Output: {"status":"ready","changes":[{"field":"title","operation":"set","value":"Birch Farm"}]}`;
