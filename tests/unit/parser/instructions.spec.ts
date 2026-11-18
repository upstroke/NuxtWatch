import { describe, expect, it } from 'vitest';
import { PARSER_INSTRUCTIONS_VERSION } from '@lib/parser/instructions';

describe('Parser instructions', () => {
  // Statement coverage: exposes the parser instructions version in dotted numeric format.
  it('exports a dotted numeric version', () => {
    expect(PARSER_INSTRUCTIONS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
