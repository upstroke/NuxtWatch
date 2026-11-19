import { afterEach, expect, it, vi } from 'vitest';
import { setupTitleRefineHandler } from '@test-mocks/title-refine';

const completion = (content: string) => ({ choices: [{ message: { content } }] });

afterEach(() => vi.unstubAllGlobals());

it('TMDB-INT-027: applies the reference follow-up without changing the title', async () => {
  // Statement coverage: applies a validated OpenRouter proposal to the current title filters.
  const { body, fetchMock, run } = setupTitleRefineHandler();
  fetchMock.mockResolvedValue(completion(JSON.stringify({
    status: 'ready',
    changes: [
      { field: 'mediaType', operation: 'set', value: 'movie' },
      { field: 'year', operation: 'set', value: 1999 },
    ],
  })));

  await expect(run()).resolves.toEqual({
    status: 'refined',
    criteria: { title: 'The Matrix', mediaType: 'movie', year: 1999 },
  });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
    'https://openrouter.ai/api/v1/chat/completions',
    expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        model: 'test-model',
        messages: [
          { role: 'system', content: expect.any(String) },
          { role: 'user', content: JSON.stringify(body) },
        ],
      }),
    }),
  );
});

it('TMDB-INT-028: preserves filters for an unsupported proposal', async () => {
  // Branch coverage: returns unchanged when the model cannot support the request.
  const { fetchMock, run } = setupTitleRefineHandler();
  fetchMock.mockResolvedValue(completion('{"status":"unsupported"}'));
  await expect(run()).resolves.toEqual({ status: 'unchanged' });
});

it('TMDB-INT-029: rejects invalid input before contacting OpenRouter', async () => {
  // Branch coverage: rejects an incomplete request body.
  const { fetchMock, readBodyMock, run } = setupTitleRefineHandler();
  readBodyMock.mockResolvedValue({ userText: '1999' });
  await expect(run()).rejects.toMatchObject({ statusCode: 400 });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('TMDB-INT-030: rejects missing OpenRouter configuration', async () => {
  // Branch coverage: avoids an outbound call when the parser is not configured.
  const { fetchMock, runtimeConfigMock, run } = setupTitleRefineHandler();
  runtimeConfigMock.mockReturnValue({});
  await expect(run()).rejects.toMatchObject({ statusCode: 503 });
  expect(fetchMock).not.toHaveBeenCalled();
});
