/** Defines runtime configuration contracts for server-side provider integrations. */
import { z } from 'zod';

export const TmdbRuntimeConfigSchema = z.object({
  apiReadAccessToken: z.string(),
  baseUrl: z.string(),
});

export type TmdbRuntimeConfig = z.infer<typeof TmdbRuntimeConfigSchema>;

export const LlmRuntimeConfigSchema = z.object({
  provider: z.string().trim().min(1),
  baseUrl: z.string().trim().min(1),
  model: z.string().trim().min(1),
});

export type LlmRuntimeConfig = z.infer<typeof LlmRuntimeConfigSchema>;
