import { vi } from 'vitest';
import { createNuxtHandlerMocks } from './nuxt-handler';

export function setupTitleRefineHandler() {
  const mocks = createNuxtHandlerMocks();
  const body = {
    currentFilters: { title: 'The Matrix', mediaType: 'all' },
    userText: 'I mean the 1999 movie',
  };
  const readBodyMock = vi.fn().mockResolvedValue(body);
  mocks.install();
  mocks.runtimeConfigMock.mockReturnValue({ openrouter: { apiKey: 'synthetic-token', model: 'test-model' } });
  vi.stubGlobal('readBody', readBodyMock);

  async function run() {
    const { default: handler } = await import('@server/api/search/title/refine.post');
    return handler({ node: { res: {} } } as never);
  }

  return { ...mocks, body, readBodyMock, run };
}
