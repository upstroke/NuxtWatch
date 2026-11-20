/** Defines supported criterion values shared by search proposals and HTTP contracts. */
import { z } from 'zod';

export const searchTitleSchema = z.string().trim().min(1).max(500);
export const searchMediaTypeSchema = z.enum(['all', 'movie', 'tv']);
export const searchYearSchema = z.number().int().min(1).max(9999);

export const searchCriteriaSchema = z.strictObject({
  title: searchTitleSchema.optional(),
  mediaType: searchMediaTypeSchema,
  year: searchYearSchema.optional(),
});

export type SearchCriteria = z.infer<typeof searchCriteriaSchema>;
