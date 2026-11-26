/**
 * Tests search proposals at the LLM boundary with an injected text generator, and the
 * generation request settings against an isolated loopback OpenAI-compatible server.
 */
import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateLlmText, parseSearchProposal } from '@server/services/search/llm';
import type { ParserInput } from '@server/services/search/llm';
import { composeParserInstructions } from '@lib/parser/instructions';

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

  // Branch coverage: selects the composed modules by call kind and only names supplied context fields.
  it('uses the composed modules and references only context fields that are supplied', async () => {
    const clarification = { originalUserText: 'Original', turns: [], question: 'Question' };
    for (const withClarification of [false, true]) {
      const generate = proposalGenerator({ status: 'ready' });
      await parseSearchProposal(
        config,
        withClarification ? { ...input, clarification } : input,
        generate,
      );
      const call = generate.mock.calls[0];
      if (!call) throw new Error('Expected one generator call');
      const { system, userContent } = call[1];
      expect(system).toBe(composeParserInstructions({ clarification: withClarification }));
      if (!withClarification) continue;
      const supplied = Object.keys(JSON.parse(userContent).context);
      const referenced = new Set([...system.matchAll(/context\.([A-Za-z]+)/g)].map((m) => m[1]));
      for (const field of referenced) expect(supplied).toContain(field);
    }
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

  // Branch coverage: accepts a model question without manufacturing partial edits.
  it('preserves a valid needs_clarification decision', async () => {
    const proposal = { status: 'needs_clarification', message: 'Synthetic question' };
    await expect(parseSearchProposal(config, input, proposalGenerator(proposal))).resolves.toEqual(
      proposal,
    );
  });

  // Branch coverage: accepts every unsupported reason code without free model text.
  it.each(['year_range', 'people', 'unsupported_criterion', 'other'])(
    'preserves an unsupported decision with reason %s',
    async (reason) => {
      const proposal = { status: 'unsupported', reason };
      await expect(
        parseSearchProposal(config, input, proposalGenerator(proposal)),
      ).resolves.toEqual(proposal);
    },
  );

  // Branch coverage: accepts a proposal enclosed in one Markdown code fence, with or without a tag.
  it.each([
    '```json\n{"status":"ready","changes":[]}\n```',
    '```\n{"status":"ready","changes":[]}\n```',
    '  ```JSON\r\n{"status":"ready","changes":[]}\r\n```  ',
  ])('accepts fenced output %#', async (text) => {
    const generate = vi.fn<typeof generateLlmText>().mockResolvedValue(text);
    await expect(parseSearchProposal(config, input, generate)).resolves.toEqual({
      status: 'ready',
      changes: [],
    });
  });

  // Branch coverage: keeps fenced output an error when text surrounds the fence or the JSON is malformed.
  it.each([
    { label: 'text before the fence', text: 'Result:\n```json\n{"status":"ready"}\n```' },
    { label: 'text after the fence', text: '```json\n{"status":"ready"}\n```\nDone.' },
    { label: 'malformed JSON inside the fence', text: '```json\n{"status":"ready",}\n```' },
  ])('rejects fenced output with $label', async ({ text }) => {
    const generate = vi.fn<typeof generateLlmText>().mockResolvedValue(text);
    await expect(parseSearchProposal(config, input, generate)).rejects.toThrow(SyntaxError);
  });

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
      label: 'unsupported with free text instead of a reason',
      value: { status: 'unsupported', message: 'Synthetic explanation' },
    },
    {
      label: 'unsupported with an unknown reason',
      value: { status: 'unsupported', reason: 'genre' },
    },
    {
      label: 'unsupported with a reason and free text',
      value: { status: 'unsupported', reason: 'people', message: 'Synthetic explanation' },
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

describe('LLM generation request', () => {
  const requests: Record<string, unknown>[] = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      requests.push(JSON.parse(body));
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          id: 'synthetic',
          object: 'chat.completion',
          created: 0,
          model: 'synthetic-model',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '{"status":"ready"}' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });
  let baseUrl = '';

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
    baseUrl = `http://127.0.0.1:${address.port}/v1`;
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  beforeEach(() => {
    requests.length = 0;
  });

  /** Sends one synthetic generation request and returns the body the server received. */
  async function receivedBody(reasoning?: '' | 'none') {
    const text = await generateLlmText(
      { provider: 'synthetic', baseUrl, model: 'synthetic-model', reasoning },
      { system: 'SYSTEM_SENTINEL', userContent: 'USER_SENTINEL' },
    );
    expect(text).toBe('{"status":"ready"}');
    expect(requests).toHaveLength(1);
    return requests[0];
  }

  // Statement coverage: sends deterministic sampling and the configured reasoning effort.
  it('sends temperature 0 and the configured reasoning effort', async () => {
    expect(await receivedBody('none')).toMatchObject({
      model: 'synthetic-model',
      temperature: 0,
      max_tokens: 256,
      reasoning_effort: 'none',
    });
  });

  // Branch coverage: omits reasoning_effort when reasoning is empty or not configured.
  it.each<{ reasoning?: '' }>([{ reasoning: '' }, { reasoning: undefined }])(
    'omits reasoning_effort for reasoning $reasoning',
    async ({ reasoning }) => {
      const body = await receivedBody(reasoning);
      expect(body).toMatchObject({ temperature: 0 });
      expect(body).not.toHaveProperty('reasoning_effort');
    },
  );
});
