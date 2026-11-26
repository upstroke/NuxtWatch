/** Defines runtime configuration contracts for server-side provider integrations. */
import { z } from 'zod';

export const TmdbRuntimeConfigSchema = z.object({
  apiReadAccessToken: z.string(),
  baseUrl: z.string(),
});

export type TmdbRuntimeConfig = z.infer<typeof TmdbRuntimeConfigSchema>;

// Reasoning effort values accepted by the AI SDK; empty or absent sends no reasoning option.
export const LlmReasoningSchema = z.enum([
  '',
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
]);

export const LlmRuntimeConfigSchema = z.object({
  provider: z.string().trim().min(1),
  baseUrl: z.string().trim().min(1),
  model: z.string().trim().min(1),
  reasoning: LlmReasoningSchema.optional(),
});

export type LlmRuntimeConfig = z.infer<typeof LlmRuntimeConfigSchema>;
