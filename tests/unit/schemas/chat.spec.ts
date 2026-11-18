import { describe, expect, it } from 'vitest';
import { ChatIntentSchema } from '@lib/schemas/chat';

describe('ChatIntentSchema', () => {
  // Statement coverage: defaults omitted changes to an empty list.
  it('defaults omitted changes to an empty list', () => {
    expect(ChatIntentSchema.parse({ status: 'ready', baseRevision: 0 })).toEqual({
      status: 'ready',
      baseRevision: 0,
      changes: [],
    });
  });

  // Statement coverage: preserves a valid change and defaults clarification options.
  it('preserves a valid change and defaults clarification options', () => {
    const change = { field: 'genreIds', operation: 'add', value: [28] };

    expect(
      ChatIntentSchema.parse({
        status: 'needs_clarification',
        baseRevision: 2,
        changes: [change],
        clarification: { questionKey: 'which-genre' },
      }),
    ).toEqual({
      status: 'needs_clarification',
      baseRevision: 2,
      changes: [change],
      clarification: { questionKey: 'which-genre', options: [] },
    });
  });

  // Branch coverage: rejects invalid revisions, unknown fields and unsupported operations.
  it.each([
    { label: 'a negative revision', input: { baseRevision: -1 } },
    { label: 'a fractional revision', input: { baseRevision: 1.5 } },
    { label: 'an unknown top-level field', input: { execute: true } },
    {
      label: 'an unsupported operation',
      input: { changes: [{ field: 'genreIds', operation: 'clear', value: [] }] },
    },
  ])('rejects $label', ({ input }) => {
    expect(
      ChatIntentSchema.safeParse({ status: 'ready', baseRevision: 0, ...input }).success,
    ).toBe(false);
  });
});
