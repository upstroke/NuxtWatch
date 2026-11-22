/** Tests the LLM input contract where the parser uses it. */
import { describe, expect, it, vi } from 'vitest';
import { parseSearchProposal } from '@server/services/search/llm';

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };

describe('search parser contract', () => {
  // Statement coverage: user content is serialized separately from fixed instructions.
  it('keeps user text and current criteria outside the system instructions', async () => {
    const generate = vi.fn().mockResolvedValue('{"status":"ready"}');
    const input = { currentFilters: { mediaType: 'all' as const }, userText: 'USER_SENTINEL_42' };
    await parseSearchProposal(config, input, generate);
    expect(generate).toHaveBeenCalledTimes(1);
    const [receivedConfig, request] = generate.mock.calls[0]!;
    expect(receivedConfig).toEqual(config);
    expect(request.system).not.toContain(input.userText);
    expect(request.system.trim().length).toBeGreaterThan(0);
    expect(JSON.parse(request.userContent)).toMatchObject({
      context: { currentFilters: input.currentFilters },
      userText: input.userText,
    });
  });

  // Branch coverage: invalid serialized output is rejected at the parser boundary.
  it('rejects non-JSON model output', async () => {
    await expect(
      parseSearchProposal(
        config,
        {
          currentFilters: { mediaType: 'all' },
          userText: 'search',
        },
        async () => 'not json',
      ),
    ).rejects.toThrow(SyntaxError);
  });

  // Branch coverage: a model-supplied endpoint is not an accepted search proposal.
  it('rejects endpoint selection by the model', async () => {
    await expect(
      parseSearchProposal(
        config,
        {
          currentFilters: { mediaType: 'all' },
          userText: 'search',
        },
        async () => JSON.stringify({ status: 'ready', endpoint: '/search/multi' }),
      ),
    ).rejects.toThrow();
  });
});
