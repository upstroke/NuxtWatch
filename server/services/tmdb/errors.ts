export type TmdbErrorCode =
  'MISSING_TOKEN' | 'INVALID_BASE_URL' | 'INVALID_QUERY' | 'UPSTREAM_FAILED' | 'INVALID_RESPONSE';

/** English wording under stable text keys; future translations remain separate from error codes. */
const tmdbErrorTexts = {
  invalidQuery: 'Invalid query',
  configurationUnavailable: 'TMDb configuration unavailable',
  requestOrResponseInvalid: 'TMDb request or response invalid',
} as const;

const tmdbErrors = new WeakSet<Error>();

/**
 * Creates a TMDb error marked as originating from this module.
 *
 * @param code - The TMDb error code describing the failure category.
 * @param options - Optional error context, including the underlying cause.
 * @returns The marked error instance.
 */
export function createTmdbError(code: TmdbErrorCode, options?: { cause?: unknown }) {
  const error = Object.assign(new Error(code, { cause: options?.cause }), {
    name: 'TmdbError',
    code,
  } as const);
  tmdbErrors.add(error);
  return error;
}

export type TmdbError = ReturnType<typeof createTmdbError>;

/** Recognize only errors created by this module, not lookalike external values. */
export function isTmdbError(error: unknown): error is TmdbError {
  return error instanceof Error && tmdbErrors.has(error);
}

/**
 * Maps a TMDb error to a safe HTTP error response.
 * Unknown errors are treated as an upstream request or response failure.
 * @param error - The caught error to classify.
 * @returns The HTTP status code and sanitized status message.
 */
export function toTmdbHttpError(error: unknown) {
  const code = isTmdbError(error) ? error.code : undefined;

  if (code === 'INVALID_QUERY') {
    return { statusCode: 400, statusMessage: tmdbErrorTexts.invalidQuery };
  }

  if (code === 'MISSING_TOKEN' || code === 'INVALID_BASE_URL') {
    return { statusCode: 503, statusMessage: tmdbErrorTexts.configurationUnavailable };
  }

  return { statusCode: 502, statusMessage: tmdbErrorTexts.requestOrResponseInvalid };
}
