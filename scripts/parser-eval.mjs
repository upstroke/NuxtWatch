/**
 * Live audit of the configured parser model against synthetic cases.
 * Calls the application's parser path (parseSearchProposal) without the search flow or TMDb.
 * Results belong in a verification log; this script is not part of `pnpm test`.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const aliases = { '@lib/': 'src/lib/', '@server/': 'server/' };
const defaultCasesPath = path.join(root, 'tests/fixtures/parser-eval-cases.json');
const maxRepeat = 20;
const rawTextLimit = 1000;

/**
 * Maps the project aliases and extensionless local imports to TypeScript files so Node's
 * type stripping can load the application modules directly. Package imports are unchanged.
 */
function resolveProjectModule(specifier, context, nextResolve) {
  let target = specifier;
  for (const [alias, directory] of Object.entries(aliases)) {
    if (target.startsWith(alias)) {
      target = pathToFileURL(path.join(root, directory, target.slice(alias.length))).href;
    }
  }
  const isLocal = target.startsWith('file:') || target.startsWith('.');
  if (isLocal && !path.extname(target) && context.parentURL?.startsWith('file:')) {
    const base = target.startsWith('file:')
      ? fileURLToPath(target)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), target);
    if (existsSync(`${base}.ts`)) target = pathToFileURL(`${base}.ts`).href;
  }
  return nextResolve(target, context);
}

registerHooks({ resolve: resolveProjectModule });

/** Imports an application module by its project-relative path after the hook is registered. */
function importProjectModule(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

const { generateLlmText, parseSearchProposal } = await importProjectModule(
  'server/services/search/llm.ts',
);
const { PARSER_INSTRUCTIONS_VERSION } = await importProjectModule('src/lib/parser/instructions.ts');
const { CLARIFICATION_INSTRUCTIONS_VERSION } = await importProjectModule(
  'src/lib/parser/clarification-instructions.ts',
);
const { searchCriteriaSchema, searchProposalSchema } = await importProjectModule(
  'src/lib/schemas/search.ts',
);
const { LlmRuntimeConfigSchema } = await importProjectModule('src/lib/schemas/runtime-config.ts');

// Expected proposals compare status and, for ready, the changes; messages are never compared.
const expectedSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('ready'),
    changes: z.array(z.unknown()).optional(),
  }),
  z.strictObject({ status: z.literal('needs_clarification') }),
  z.strictObject({ status: z.literal('unsupported') }),
]);
const caseSchema = z.strictObject({
  id: z.string().regex(/^PARSER-EVAL-\d{3}$/),
  description: z.string().trim().min(1),
  input: z.strictObject({
    currentFilters: searchCriteriaSchema,
    userText: z.string().trim().min(1).max(4000),
    clarification: z
      .strictObject({
        originalUserText: z.string().trim().min(1),
        turns: z.array(z.strictObject({ question: z.string(), answer: z.string() })),
        question: z.string().trim().min(1),
      })
      .optional(),
  }),
  accept: z.array(expectedSchema).min(1),
});
const caseFileSchema = z.strictObject({
  description: z.string(),
  cases: z
    .array(caseSchema)
    .min(1)
    .refine(
      (cases) => new Set(cases.map((entry) => entry.id)).size === cases.length,
      'Case identifiers must be unique',
    ),
});

/** Reads command-line options; throws on unknown options or an out-of-range repeat count. */
function readOptions() {
  const { values } = parseArgs({
    options: {
      repeat: { type: 'string', default: '1' },
      report: { type: 'string' },
      cases: { type: 'string', default: defaultCasesPath },
    },
  });
  const repeat = Number(values.repeat);
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > maxRepeat) {
    throw new Error(`--repeat must be an integer from 1 to ${maxRepeat}.`);
  }
  return { repeat, reportPath: values.report, casesPath: values.cases };
}

/**
 * Loads the case file and checks every accepted ready proposal against the real proposal
 * schema, so a fixture cannot expect output the application would reject.
 */
async function loadCases(casesPath) {
  const file = caseFileSchema.parse(JSON.parse(await readFile(casesPath, 'utf8')));
  for (const entry of file.cases) {
    for (const expected of entry.accept) {
      if (expected.status === 'ready' && !searchProposalSchema.safeParse(expected).success) {
        throw new Error(`${entry.id}: accepted ready proposal violates the proposal schema.`);
      }
    }
  }
  return file.cases;
}

/** Reads the LLM configuration from the environment; returns null when it is incomplete. */
function readLlmConfig() {
  const result = LlmRuntimeConfigSchema.safeParse({
    provider: process.env.NUXT_LLM_PROVIDER ?? '',
    baseUrl: process.env.NUXT_LLM_BASE_URL ?? '',
    model: process.env.NUXT_LLM_MODEL ?? '',
    reasoning: process.env.NUXT_LLM_REASONING ?? '',
  });
  return result.success ? result.data : null;
}

/** Returns the checked-out commit and whether the work tree differs from it, if available. */
function readGitState() {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    return { commit: commit.trim(), dirty: status.trim().length > 0 };
  } catch {
    return { commit: null, dirty: null };
  }
}

/** Normalizes a title for comparison: trimmed, collapsed whitespace, case-insensitive. */
function normalizeTitle(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}

/**
 * Converts changes into a field-to-value map. Changes that only restate the confirmed value
 * (including removing an absent year) are dropped, because they do not change the criteria.
 */
function effectiveChanges(changes, currentFilters) {
  const result = new Map();
  for (const change of changes ?? []) {
    const current = currentFilters[change.field] ?? null;
    if (change.value === current) continue;
    if (
      change.field === 'title' &&
      current &&
      normalizeTitle(change.value) === normalizeTitle(current)
    )
      continue;
    result.set(
      change.field,
      change.field === 'title' ? normalizeTitle(change.value) : change.value,
    );
  }
  return result;
}

/** Checks whether an actual proposal matches one accepted proposal for the case input. */
function matchesExpected(actual, expected, currentFilters) {
  if (actual.status !== expected.status) return false;
  if (expected.status !== 'ready') return true;
  const actualChanges = effectiveChanges(actual.changes, currentFilters);
  const expectedChanges = effectiveChanges(expected.changes, currentFilters);
  if (actualChanges.size !== expectedChanges.size) return false;
  for (const [field, value] of expectedChanges) {
    if (!actualChanges.has(field) || actualChanges.get(field) !== value) return false;
  }
  return true;
}

/**
 * Describes a generation failure by error name and HTTP status only; raw messages and
 * response bodies are never recorded.
 */
function describeGenerationFailure(error) {
  const name =
    typeof error?.name === 'string' && /^[A-Za-z_]+$/.test(error.name) ? error.name : 'Error';
  const statusCode = Number.isSafeInteger(error?.statusCode) ? error.statusCode : null;
  return { category: 'generation_failed', errorName: name, statusCode };
}

/**
 * Runs one case once through the application's parser path. Generation failures are BLOCKED;
 * non-JSON, schema-invalid or mismatching proposals are FAILED.
 */
async function runCaseOnce(config, entry) {
  let generationError;
  let rawText;

  /** Wraps the real generator to separate transport failures from invalid model output. */
  const generate = async (generatorConfig, request) => {
    try {
      rawText = await generateLlmText(generatorConfig, request);
      return rawText;
    } catch (error) {
      generationError = error;
      throw error;
    }
  };

  const startedAt = performance.now();
  try {
    const proposal = await parseSearchProposal(config, entry.input, generate);
    const durationMs = Math.round(performance.now() - startedAt);
    const passed = entry.accept.some((expected) =>
      matchesExpected(proposal, expected, entry.input.currentFilters),
    );
    return passed
      ? { status: 'PASSED', durationMs, proposal }
      : { status: 'FAILED', category: 'mismatch', durationMs, proposal };
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    if (generationError) {
      return { status: 'BLOCKED', durationMs, ...describeGenerationFailure(generationError) };
    }
    return {
      status: 'FAILED',
      category: error instanceof SyntaxError ? 'non_json_output' : 'schema_invalid_output',
      durationMs,
      rawText: rawText?.slice(0, rawTextLimit),
    };
  }
}

/** Summarizes repeated runs: any FAILED run fails the case, otherwise any BLOCKED run blocks it. */
function summarizeRuns(runs) {
  const count = (status) => runs.filter((run) => run.status === status).length;
  const counts = { passed: count('PASSED'), failed: count('FAILED'), blocked: count('BLOCKED') };
  const status = counts.failed > 0 ? 'FAILED' : counts.blocked > 0 ? 'BLOCKED' : 'PASSED';
  return { status, ...counts };
}

/** Prints one case line and, for non-passing runs, the recorded proposal or failure category. */
function printCase(result, repeat) {
  console.log(
    `${result.id}  ${result.status.padEnd(7)}  ${result.passed}/${repeat}  ${result.description}`,
  );
  result.runs.forEach((run, index) => {
    if (run.status === 'PASSED') return;
    const detail = [
      run.category,
      run.errorName,
      run.statusCode,
      run.proposal && JSON.stringify(run.proposal),
    ]
      .filter(Boolean)
      .join(' ');
    console.log(`    run ${index + 1}: ${run.status} ${detail}`);
  });
}

/** Runs all cases sequentially, prints the results and optionally writes a JSON report. */
async function main() {
  const options = readOptions();
  const cases = await loadCases(options.casesPath);
  const config = readLlmConfig();
  const report = {
    startedAt: new Date().toISOString(),
    ...readGitState(),
    instructionsVersion: PARSER_INSTRUCTIONS_VERSION,
    clarificationInstructionsVersion: CLARIFICATION_INSTRUCTIONS_VERSION,
    provider: config?.provider ?? null,
    model: config?.model ?? null,
    reasoning: config ? config.reasoning || null : null,
    repeat: options.repeat,
    cases: [],
    totals: { passed: 0, failed: 0, blocked: 0 },
    limitations: [
      'Measures the configured model with synthetic cases only; not a general reliability claim.',
      'Generation settings are those of the application (temperature 0, 60 s timeout); provider-side settings are not recorded.',
      'Messages of needs_clarification and unsupported proposals are not evaluated.',
      'Changes that restate a confirmed value are ignored when comparing proposals.',
    ],
  };

  console.log(
    `Parser eval: instructions ${report.instructionsVersion}, clarification ` +
      `${report.clarificationInstructionsVersion}, model ${report.model ?? '(not configured)'}, ` +
      `repeat ${report.repeat}`,
  );

  for (const entry of cases) {
    const runs = [];
    for (let run = 0; run < options.repeat; run += 1) {
      runs.push(
        config
          ? await runCaseOnce(config, entry)
          : { status: 'BLOCKED', category: 'missing_llm_config', durationMs: 0 },
      );
    }
    const result = {
      id: entry.id,
      description: entry.description,
      ...summarizeRuns(runs),
      runs,
    };
    report.cases.push(result);
    report.totals[result.status.toLowerCase()] += 1;
    printCase(result, options.repeat);
  }

  report.finishedAt = new Date().toISOString();
  const { passed, failed, blocked } = report.totals;
  console.log(`Cases: ${passed} PASSED, ${failed} FAILED, ${blocked} BLOCKED`);

  if (options.reportPath) {
    await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Report written to ${options.reportPath}`);
  }
  if (failed > 0 || blocked > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Parser eval could not start.');
  process.exitCode = 1;
});
