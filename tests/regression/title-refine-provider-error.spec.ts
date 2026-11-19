import { afterEach, expect, it, vi } from 'vitest';
import { setupTitleRefineHandler } from '@test-mocks/title-refine';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('TMDB-INT-035: maps an OpenRouter 400 to 502 and records the upstream status', async () => {
  // Branch coverage: preserves the status of a rejected provider request in the server log.
  const { fetchMock, run } = setupTitleRefineHandler();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  fetchMock.mockRejectedValue(Object.assign(new Error('Synthetic upstream error'), { statusCode: 400 }));

  await expect(run()).rejects.toMatchObject({ statusCode: 502 });
  expect(warn).toHaveBeenCalledWith('[title-refine] Parser provider failed', {
    phase: 'fetch',
    upstreamStatus: 400,
  });
});
