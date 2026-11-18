import { z } from 'zod';

const TitleProposalSchema = z
  .object({
    status: z.literal('ready'),
    changes: z.tuple([
      z
        .object({
          field: z.literal('title'),
          operation: z.literal('set'),
          value: z.string().trim().min(1),
        })
        .strict(),
    ]),
  })
  .strict();

export type TitleSearchCriteria = { title: string };

type TitleSearchDispatchResult<T> =
  | { status: 'not-dispatched' }
  | { status: 'dispatched'; criteria: TitleSearchCriteria; result: T };

export async function dispatchTitleSearch<T>(
  proposal: unknown,
  search: (criteria: TitleSearchCriteria) => Promise<T>,
): Promise<TitleSearchDispatchResult<T>> {
  const parsed = TitleProposalSchema.safeParse(proposal);

  if (!parsed.success) {
    return { status: 'not-dispatched' };
  }

  const criteria = { title: parsed.data.changes[0].value };
  const result = await search(criteria);

  return { status: 'dispatched', criteria, result };
}
