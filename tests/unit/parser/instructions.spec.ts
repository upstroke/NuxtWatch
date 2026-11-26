/** Tests the composition of the fixed parser instruction modules. */
import { describe, expect, it } from 'vitest';
import {
  BASE_INSTRUCTIONS,
  composeParserInstructions,
  TITLE_INSTRUCTIONS,
} from '@lib/parser/instructions';
import { CLARIFICATION_INSTRUCTIONS } from '@lib/parser/clarification-instructions';

describe('Parser instruction composition', () => {
  // Statement coverage: composes base and title modules in a stable order for a new request.
  it('composes base then title for a new request', () => {
    expect(composeParserInstructions({ clarification: false })).toBe(
      `${BASE_INSTRUCTIONS}\n\n${TITLE_INSTRUCTIONS}`,
    );
  });

  // Branch coverage: appends the clarification module only for answers to an open question.
  it('appends the clarification module last for an answer to an open question', () => {
    const composed = composeParserInstructions({ clarification: true });
    expect(composed).toBe(
      `${BASE_INSTRUCTIONS}\n\n${TITLE_INSTRUCTIONS}\n\n${CLARIFICATION_INSTRUCTIONS}`,
    );
    expect(composeParserInstructions({ clarification: false })).not.toContain(
      CLARIFICATION_INSTRUCTIONS,
    );
  });

  // Statement coverage: every module is non-empty and starts with its own Markdown heading.
  it.each([
    ['base', BASE_INSTRUCTIONS],
    ['title', TITLE_INSTRUCTIONS],
    ['clarification', CLARIFICATION_INSTRUCTIONS],
  ])('keeps the %s module self-contained', (_name, module) => {
    expect(module.trim()).toBe(module);
    expect(module).toMatch(/^#{1,2} \S/);
  });
});
