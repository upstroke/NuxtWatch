/** Tests search proposals at the LLM boundary with an injected text generator. */
import { describe, expect, it, vi } from 'vitest';
import { parseSearchProposal } from '@server/services/search/llm';
import type { generateLlmText, ParserInput } from '@server/services/search/llm';

const config = { provider: 'test', baseUrl: 'http://localhost:1234/v1', model: 'test' };
const input: ParserInput = {
  currentFilters: { title: 'Synthetic Film', mediaType: 'movie', year: 2021 },
  userText: 'USER_SENTINEL_42',
};

/** Supplies serialized model data without invoking a provider. */
function proposalGenerator(proposal: unknown) {
  return vi.fn<typeof generateLlmText>().mockResolvedValue(JSON.stringify(proposal));
}

describe('Search LLM boundary', () => {
  // Statement coverage: keeps user text and confirmed criteria outside fixed instructions.
  it('serializes the current request separately from nonempty system instructions', async () => {
    const generate = proposalGenerator({ status: 'ready', changes: [] });
    await expect(parseSearchProposal(config, input, generate)).resolves.toEqual({
      status: 'ready',
      changes: [],
    });

    expect(generate).toHaveBeenCalledTimes(1);
    const call = generate.mock.calls[0];
    if (!call) throw new Error('Expected one generator call');
    const [receivedConfig, request] = call;
    expect(receivedConfig).toEqual(config);
    expect(request.system.trim().length).toBeGreaterThan(0);
    expect(request.system).not.toContain(input.userText);
    expect(JSON.parse(request.userContent)).toMatchObject({
      context: {
        currentFilters: input.currentFilters,
        capabilities: { mediaTypes: ['all', 'movie', 'tv'], yearRange: { min: 1, max: 9999 } },
      },
      userText: input.userText,
    });
  });

  // Branch coverage: carries bound clarification data without moving it into instructions.
  it('passes original intent, prior answers and the open question as context data', async () => {
    const clarification = {
      originalUserText: 'ORIGINAL_SENTINEL_43',
      turns: [{ question: 'QUESTION_SENTINEL_44', answer: 'ANSWER_SENTINEL_45' }],
      question: 'OPEN_SENTINEL_46',
    };
    const generate = proposalGenerator({ status: 'ready' });
    await parseSearchProposal(config, { ...input, clarification }, generate);

    const call = generate.mock.calls[0];
    if (!call) throw new Error('Expected one generator call');
    const request = call[1];
    expect(JSON.parse(request.userContent)).toMatchObject({
      context: {
        currentFilters: input.currentFilters,
        originalUserText: clarification.originalUserText,
        clarificationTurns: clarification.turns,
        openQuestion: { message: clarification.question },
      },
      userText: input.userText,
    });
    for (const value of [
      input.userText,
      clarification.originalUserText,
      clarification.question,
      ...clarification.turns.flatMap((turn) => [turn.question, turn.answer]),
    ])
      expect(request.system).not.toContain(value);
  });

  // Statement coverage: validates requested edits without applying them to confirmed input.
  it('returns normalized edits including year removal without changing confirmed criteria', async () => {
    const before = structuredClone(input);
    const generate = proposalGenerator({
      status: 'ready',
      changes: [
        { field: 'title', operation: 'set', value: '  Synthetic Replacement  ' },
        { field: 'year', operation: 'set', value: null },
      ],
    });
    await expect(parseSearchProposal(config, input, generate)).resolves.toEqual({
      status: 'ready',
      changes: [
        { field: 'title', operation: 'set', value: 'Synthetic Replacement' },
        { field: 'year', operation: 'set', value: null },
      ],
    });
    expect(input).toEqual(before);
  });

  // Branch coverage: accepts non-ready model decisions without manufacturing partial edits.
  it.each(['needs_clarification', 'unsupported'])(
    'preserves a valid %s decision',
    async (status) => {
      const proposal = { status, message: 'Synthetic explanation' };
      await expect(
        parseSearchProposal(config, input, proposalGenerator(proposal)),
      ).resolves.toEqual(proposal);
    },
  );

  // Branch coverage: rejects non-JSON output at the actual parser boundary.
  it('rejects non-JSON model output', async () => {
    const generate = vi.fn<typeof generateLlmText>().mockResolvedValue('not json');
    await expect(parseSearchProposal(config, input, generate)).rejects.toThrow(SyntaxError);
  });

  // Branch coverage: rejects model-selected endpoints and contradictory or unsupported edits.
  it.each([
    { label: 'provider endpoint', value: { status: 'ready', endpoint: '/search/multi' } },
    {
      label: 'duplicate field',
      value: {
        status: 'ready',
        changes: [
          { field: 'year', operation: 'set', value: 2020 },
          { field: 'year', operation: 'set', value: 2021 },
        ],
      },
    },
    {
      label: 'unsupported operation',
      value: {
        status: 'ready',
        changes: [{ field: 'title', operation: 'add', value: 'Synthetic Film' }],
      },
    },
    {
      label: 'invalid media scope',
      value: {
        status: 'ready',
        changes: [{ field: 'mediaType', operation: 'set', value: 'person' }],
      },
    },
    {
      label: 'partial edits during clarification',
      value: {
        status: 'needs_clarification',
        message: 'Synthetic question',
        changes: [{ field: 'year', operation: 'set', value: 2021 }],
      },
    },
  ])('rejects $label without altering the input', async ({ value }) => {
    const before = structuredClone(input);
    await expect(parseSearchProposal(config, input, proposalGenerator(value))).rejects.toThrow();
    expect(input).toEqual(before);
  });

  // Branch coverage: preserves generator failures instead of interpreting them as a proposal.
  it('propagates a generator failure unchanged', async () => {
    const failure = new Error('Synthetic model failure');
    const generate = vi.fn<typeof generateLlmText>().mockRejectedValue(failure);
    await expect(parseSearchProposal(config, input, generate)).rejects.toBe(failure);
  });
});
