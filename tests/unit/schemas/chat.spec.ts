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

  // Branch coverage: rejects unknown top-level fields.
  it('rejects an unknown top-level field', () => {
    const result = ChatIntentSchema.safeParse({ status: 'ready', baseRevision: 0, execute: true });

    expect(result.success).toBe(false);
  });
});
