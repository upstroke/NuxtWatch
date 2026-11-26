import { describe, expect, it } from 'vitest';
import { LlmRuntimeConfigSchema, TmdbRuntimeConfigSchema } from '@lib/schemas/runtime-config';

describe('TMDb runtime config schema', () => {
  // Statement coverage: accepts a complete runtime configuration
  it('accepts a complete runtime configuration', () => {
    const config = TmdbRuntimeConfigSchema.parse({
      apiReadAccessToken: 'synthetic-token',
      baseUrl: 'https://api.themoviedb.org/3',
    });

    expect(config).toEqual({
      apiReadAccessToken: 'synthetic-token',
      baseUrl: 'https://api.themoviedb.org/3',
    });
  });

  // Branch coverage: rejects a missing access token
  it('rejects a missing access token', () => {
    expect(() =>
      TmdbRuntimeConfigSchema.parse({
        baseUrl: 'https://api.themoviedb.org/3',
      }),
    ).toThrow();
  });

  // Branch coverage: rejects a missing base URL
  it('rejects a missing base URL', () => {
    expect(() =>
      TmdbRuntimeConfigSchema.parse({
        apiReadAccessToken: 'synthetic-token',
      }),
    ).toThrow();
  });
});

describe('LLM runtime config schema', () => {
  const base = { provider: 'synthetic', baseUrl: 'http://127.0.0.1:1234/v1', model: 'synthetic' };

  // Statement coverage: accepts an empty, absent or supported reasoning effort
  it.each([{}, { reasoning: '' }, { reasoning: 'none' }, { reasoning: 'high' }])(
    'accepts reasoning %o',
    (extra) => {
      expect(LlmRuntimeConfigSchema.parse({ ...base, ...extra })).toEqual({ ...base, ...extra });
    },
  );

  // Branch coverage: rejects an unknown reasoning effort
  it('rejects an unknown reasoning effort', () => {
    expect(() => LlmRuntimeConfigSchema.parse({ ...base, reasoning: 'off' })).toThrow();
  });
});
