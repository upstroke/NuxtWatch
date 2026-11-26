/** Central application wording; free model messages are not catalog entries. */
import type { UnsupportedReason } from '@lib/schemas/search';

export const searchTexts = {
  clarification: {
    titleRequired: 'Welchen Titel möchtest du suchen?',
    mediaTypeRequiredForYear:
      'Bei einer Titelsuche mit Jahresangabe musst du zwischen Film und Serie wählen. Möchtest du nach einem Film oder einer Serie suchen?',
  },
  // Rendered for unsupported proposals; the model only supplies the reason code.
  unsupported: {
    year_range: 'Ich kann nur nach einem einzelnen Jahr suchen, nicht nach einem Zeitraum.',
    people: 'Nach Personen kann ich nicht suchen.',
    unsupported_criterion:
      'Diese Bedingung kann ich nicht suchen. Möglich sind ein Titel, Film oder Serie und ein einzelnes Jahr.',
    other: 'Diese Anfrage kann ich nicht als Film- oder Seriensuche ausführen.',
  } satisfies Record<UnsupportedReason, string>,
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
