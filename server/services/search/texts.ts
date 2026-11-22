/** Central application wording; free model messages are not catalog entries. */
export const searchTexts = {
  clarification: {
    titleRequired: 'Welchen Titel möchtest du suchen?',
    mediaTypeRequiredForYear:
      'Bei einer Titelsuche mit Jahresangabe musst du zwischen Film und Serie wählen. Möchtest du nach einem Film oder einer Serie suchen?',
  },
  http: {
    invalidResponse: 'Invalid search response',
    processingFailed: 'Search processing failed',
    executionNotApplicable: 'Search execution not applicable',
    requestSuperseded: 'Search request replaced or session expired',
    invalidRequest: 'Invalid search request',
    configurationUnavailable: 'Search configuration unavailable',
    clarificationNotApplicable: 'Clarification no longer applicable',
  },
  session: {
    expired: 'Search session expired; reset required',
    capacityReached: 'Search session capacity reached',
  },
} as const;
