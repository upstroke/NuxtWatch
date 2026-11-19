# Typing

This document defines TypeScript and runtime-validation conventions for NuxtWatch. TypeScript checks structure at compile time; it does not validate runtime data.

## Type checking

Run `pnpm typecheck` to check TypeScript and Vue single-file components. TypeScript, `vue-tsc`, and Zod versions are pinned in [`package.json`](../package.json).

## Zod contracts

Use Zod 4 for external or untrusted data. Prefer `z.iso.date()` over the deprecated `z.string().date()`. Define one authoritative schema per external contract in `src/lib/schemas` and derive its TypeScript type instead of redeclaring the fields:

```ts
export const TmdbRuntimeConfigSchema = z.object({
  apiReadAccessToken: z.string(),
  baseUrl: z.string(),
});

export type TmdbRuntimeConfig = z.infer<typeof TmdbRuntimeConfigSchema>;
```

- Parse once at the actual boundary (for example, HTTP requests, LLM output, TMDb responses, or runtime configuration). Code consuming validated data imports the derived type, not the schema. A semantic alias may reference a derived type without redefining it. Derive related field keys and dependent types from existing contracts.
- Schemas validate shape and contract-level constraints, and normalize values when required by the contract. Stateful and domain decisions belong in the application. For example, the schema checks the shape of `revision` and `questionId`; the search flow checks that the revision is current and the question belongs to the open clarification.
- For deciding which validation behavior to test, see [Testing](testing.md).

## Internal functions and assertions

- Prefer the simplest type that makes the behavior clear or prevents a concrete mistake. Keep meaningful distinctions, such as a search being ready or needing clarification. Use a plain array for clarification options unless fixed length, order, or read-only access is part of the contract.
- Do not create a schema, interface, or type alias for every internal function. Let TypeScript infer types where context is sufficient. Prefer inferred return types unless an explicit public contract or clearer annotation is needed. Reuse or derive a type where possible; define a local shape inline when used only locally.
- Never use `as` to suppress a type error or replace validation. Use a type predicate only after a real runtime check, and an assertion only when TypeScript cannot infer information already established by such a check.

## Shared type locations

| Type | Location | Rule |
| --- | --- | --- |
| Zod contract and derived type | `src/lib/schemas` or relevant domain module for the derived type | Keep the type associated with its schema |
| Cross-module type | `src/types/<topic>.ts` | Only for types shared by independent modules |
| Feature or domain type | Near its feature or domain | Keep it close to its use |
| Local function type | In the function’s file | Do not centralize one-off types |
| Injected dependency type | At the boundary defining it | Keep it with its consumer or provider |

Do not create a catch-all `types.ts` or an automatic type barrel. Import from the specific defining file. Prefer `type` for reusable types; use `interface` for intentional declaration merging or extension.

## Related documentation

- [Testing](testing.md)
- [Service boundaries and ADR 001](work/specs/architecture/001-service-boundaries.md)
