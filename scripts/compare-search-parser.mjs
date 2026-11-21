/** Local evaluation only: no sessions, HTTP search handlers or TMDb calls. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

const root = fileURLToPath(new URL('../', import.meta.url));
const folder = 'docs/tasks/search-architecture/parser-comparison';
const hash = (text) => createHash('sha256').update(text).digest('hex');
const sources = {};
const modules = new Map();
const allowed = new Set([
  'server/services/search/parser.ts',
  'server/services/search/llm.ts',
  'src/lib/parser/instructions.ts',
  'src/lib/schemas/search-criteria.ts',
  'src/lib/schemas/runtime-config.ts',
]);

// Load only the existing parser dependency graph, without Nuxt or a new TS runtime.
async function moduleUrl(path) {
  if (modules.has(path)) return modules.get(path);
  if (!allowed.has(path)) throw new Error(`Unexpected parser dependency: ${path}`);
  const source = await readFile(resolve(root, path), 'utf8');
  sources[path] = hash(source);
  let code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [];
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const name = node.moduleSpecifier.text;
    let target;
    if (name.startsWith('@lib/')) {
      target = await moduleUrl(`src/lib/${name.slice(5)}.ts`);
    } else if (name.startsWith('.')) {
      const pathName = resolve(root, dirname(path), `${name}.ts`);
      const relative = pathName.slice(root.length).replaceAll('\\', '/');
      target = await moduleUrl(relative);
    } else {
      target = import.meta.resolve(name);
    }
    edits.push([
      node.moduleSpecifier.getStart(ast),
      node.moduleSpecifier.end,
      JSON.stringify(target),
    ]);
  }
  for (const [start, end, value] of edits.reverse())
    code = code.slice(0, start) + value + code.slice(end);
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(path, url);
  return url;
}

function literalExport(source, name) {
  const ast = ts.createSourceFile('baseline.ts', source, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isVariableStatement(node)) continue;
    for (const declaration of node.declarationList.declarations) {
      if (declaration.name.getText(ast) !== name || !declaration.initializer) continue;
      const value = declaration.initializer;
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text;
    }
  }
  throw new Error(`Expected a literal baseline export: ${name}`);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

function apply(criteria, changes) {
  const next = structuredClone(criteria);
  for (const change of changes) {
    if (change.value === null) delete next[change.field];
    else next[change.field] = change.value;
  }
  return next;
}

function assess(proposal, item) {
  const expected = item.expected;
  const result = {
    statusAllowed: expected.allowedStatuses.includes(proposal.status),
    candidatePreferredStatusMatched: expected.candidatePreferredStatus
      ? proposal.status === expected.candidatePreferredStatus
      : null,
    manualReviewRequired: true,
  };
  if (proposal.status !== 'ready') return result;
  const before = item.input.context.currentFilters;
  const changes = proposal.changes ?? [];
  const after = apply(before, changes);
  result.criteriaAfter = after;
  result.criteriaMatch = Array.isArray(expected.changes)
    ? equal(after, apply(before, expected.changes))
    : null;
  result.preservedFieldsMatch = (expected.preservedFields ?? []).every((field) =>
    equal(after[field], before[field]),
  );
  result.redundantEdits = changes.filter((change) => equal(apply(before, [change]), before));
  return result;
}

async function main() {
  const { values } = parseArgs({
    options: {
      run: { type: 'boolean', default: false },
      smoke: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
      'model-label': { type: 'string' },
      temperature: { type: 'string' },
      'max-output-tokens': { type: 'string', default: '256' },
      'timeout-ms': { type: 'string', default: '120000' },
    },
  });
  if (values.help) {
    console.log(
      'node scripts/compare-search-parser.mjs [--smoke] [--run --model-label LABEL] [--temperature NUMBER] [--max-output-tokens NUMBER] [--timeout-ms NUMBER]',
    );
    return;
  }
  const maxOutputTokens = Number(values['max-output-tokens']);
  const timeoutMs = Number(values['timeout-ms']);
  const temperature = values.temperature === undefined ? undefined : Number(values.temperature);
  if (
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    (temperature !== undefined && (!Number.isFinite(temperature) || temperature < 0))
  ) {
    throw new Error('Invalid token limit, timeout or temperature.');
  }
  const fixtureText = await readFile(resolve(root, folder, 'cases-0.1.json'), 'utf8');
  const fixture = JSON.parse(fixtureText);
  if (
    fixture.version !== 'search-preparation-comparison-0.1' ||
    fixture.candidate !== 'candidate-0.1.md' ||
    fixture.baseline.commit !== 'd9f93fc' ||
    fixture.baseline.path !== 'src/lib/parser/instructions.ts' ||
    fixture.baseline.export !== 'PARSER_INSTRUCTIONS' ||
    fixture.baseline.version !== '1.4.0' ||
    fixture.repetitions !== 3 ||
    fixture.cases.length !== 14 ||
    new Set(fixture.cases.map((item) => item.id)).size !== 14
  ) {
    throw new Error('Unexpected fixture package; review and version the runner before use.');
  }
  const baselineSource = execFileSync(
    'git',
    ['show', `${fixture.baseline.commit}:${fixture.baseline.path}`],
    { cwd: root, encoding: 'utf8' },
  );
  if (literalExport(baselineSource, 'PARSER_INSTRUCTIONS_VERSION') !== fixture.baseline.version) {
    throw new Error('Baseline version mismatch.');
  }
  const prompts = {
    A: literalExport(baselineSource, fixture.baseline.export),
    B: await readFile(resolve(root, folder, fixture.candidate), 'utf8'),
  };
  prompts.C = prompts.B;
  const { parseSearchProposal } = await import(await moduleUrl('server/services/search/parser.ts'));
  const { searchCriteriaSchema } = await import(
    await moduleUrl('src/lib/schemas/search-criteria.ts')
  );
  const { LlmRuntimeConfigSchema } = await import(
    await moduleUrl('src/lib/schemas/runtime-config.ts')
  );
  const dummy = { provider: 'comparison', baseUrl: 'http://localhost', model: 'offline' };
  const validate = (text, input) =>
    parseSearchProposal(
      dummy,
      {
        currentFilters: input.context.currentFilters,
        userText: input.userText,
      },
      async () => text,
    );

  for (const item of fixture.cases) {
    searchCriteriaSchema.parse(item.input.context.currentFilters);
    if (
      typeof item.input.userText !== 'string' ||
      !item.input.userText.trim() ||
      item.input.context.openQuestion !== null ||
      !Array.isArray(item.expected.allowedStatuses) ||
      !item.expected.allowedStatuses.length
    ) {
      throw new Error(`Invalid fixture: ${item.id}`);
    }
    if (item.expected.changes) {
      await validate(
        JSON.stringify({ status: 'ready', changes: item.expected.changes }),
        item.input,
      );
    }
    await parseSearchProposal(
      dummy,
      {
        currentFilters: item.input.context.currentFilters,
        userText: item.input.userText,
      },
      async (_config, generated) => {
        const actual = JSON.parse(generated.userContent);
        if (!equal(actual.context.capabilities, fixture.capabilities)) {
          throw new Error('Fixture capabilities differ from the current parser.');
        }
        return '{"status":"ready","changes":[]}';
      },
    );
  }

  const plan = [];
  for (let repeat = 0; repeat < fixture.repetitions; repeat += 1) {
    for (const [index, item] of fixture.cases.entries()) {
      const variants = ['A', 'B', 'C'];
      const offset = (repeat + index) % variants.length;
      for (const variant of [...variants.slice(offset), ...variants.slice(0, offset)]) {
        const context = {
          currentFilters: structuredClone(item.input.context.currentFilters),
          capabilities: structuredClone(fixture.capabilities),
        };
        if (variant === 'C') {
          context.previousTurn = structuredClone(item.input.context.previousTurn);
          context.openQuestion = item.input.context.openQuestion;
        }
        plan.push({
          id: item.id,
          variant,
          repetition: repeat + 1,
          input: { context, userText: item.input.userText },
        });
      }
    }
  }
  const selected = values.smoke ? plan.slice(0, 1) : plan;
  let config;
  let provider;
  if (values.run) {
    config = LlmRuntimeConfigSchema.parse({
      provider: process.env.NUXT_LLM_PROVIDER,
      baseUrl: process.env.NUXT_LLM_BASE_URL,
      model: process.env.NUXT_LLM_MODEL,
    });
    const url = new URL(config.baseUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    ) {
      throw new Error('Only a loopback LLM URL without credentials, query or fragment is allowed.');
    }
    if (!values['model-label']?.trim())
      throw new Error('--model-label must document model and quantization.');
    provider = createOpenAICompatible({
      name: config.provider,
      baseURL: config.baseUrl,
      fetch: (url, init) => fetch(url, { ...init, redirect: 'error' }),
    });
  }
  const outputRoot = resolve(root, 'test-results/parser-comparison');
  await mkdir(outputRoot, { recursive: true });
  const output = await mkdtemp(
    resolve(outputRoot, values.run ? (values.smoke ? 'smoke-' : 'comparison-') : 'dry-run-'),
  );
  const save = (name, value) =>
    writeFile(resolve(output, name), JSON.stringify(value, null, 2) + '\n');
  const metadata = {
    startedAt: new Date().toISOString(),
    mode: values.run ? (values.smoke ? 'smoke' : 'comparison') : 'dry-run',
    node: process.version,
    gitHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    gitStatus: execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }),
    scriptSha256: hash(await readFile(fileURLToPath(import.meta.url), 'utf8')),
    fixtureSha256: hash(fixtureText),
    sourceSha256: sources,
    promptSha256: Object.fromEntries(
      Object.entries(prompts).map(([key, text]) => [key, hash(text)]),
    ),
    config: config ?? null,
    modelLabel: values['model-label'] ?? null,
    settings: {
      maxOutputTokens,
      temperature: temperature ?? null,
      maxRetries: 0,
      timeoutMs,
      unspecified: 'SDK/provider/server defaults; verify and record server settings separately.',
    },
    plannedCalls: selected.length,
  };
  await save('metadata.json', metadata);
  await save('plan.json', selected);
  await save('fixtures.json', fixture);
  await writeFile(resolve(output, 'baseline.txt'), prompts.A);
  await writeFile(resolve(output, 'candidate.txt'), prompts.B);
  if (!values.run) {
    console.log(`Dry-run: ${selected.length} planned calls, no network requests. ${output}`);
    return;
  }
  let completed = 0;
  let invalid = 0;
  for (const step of selected) {
    const started = Date.now();
    const record = { ...step, startedAt: new Date(started).toISOString() };
    let result;
    try {
      result = await generateText({
        model: provider.chatModel(config.model),
        system: prompts[step.variant],
        messages: [{ role: 'user', content: JSON.stringify(step.input) }],
        maxOutputTokens,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(timeoutMs),
        ...(temperature === undefined ? {} : { temperature }),
      });
    } catch (error) {
      record.transportError = { name: error instanceof Error ? error.name : 'UnknownError' };
      record.durationMs = Date.now() - started;
      await appendFile(resolve(output, 'responses.jsonl'), JSON.stringify(record) + '\n');
      await save('summary.json', {
        completed,
        invalid,
        planned: selected.length,
        aborted: true,
        reason: 'Transport/SDK failure; see local model server logs. No automatic retry.',
      });
      console.error(`Stopped after transport/SDK failure. ${output}`);
      process.exitCode = 1;
      return;
    }
    record.durationMs = Date.now() - started;
    record.rawText = result.text;
    record.finishReason = result.finishReason;
    record.truncated = result.finishReason === 'length';
    record.usage = result.usage;
    record.warnings = result.warnings;
    record.responseModelId = result.response.modelId;
    try {
      JSON.parse(result.text);
      try {
        record.proposal = await validate(result.text, step.input);
        record.contractValid = true;
        record.assessment = assess(
          record.proposal,
          fixture.cases.find((item) => item.id === step.id),
        );
      } catch (error) {
        record.contractValid = false;
        record.contractIssues = error instanceof Error ? error.message : 'Invalid proposal';
      }
    } catch {
      record.contractValid = false;
      record.jsonError = true;
    }
    if (!record.contractValid || record.truncated) invalid += 1;
    completed += 1;
    await appendFile(resolve(output, 'responses.jsonl'), JSON.stringify(record) + '\n');
    await save('summary.json', {
      completed,
      invalid,
      planned: selected.length,
      aborted: false,
      finished: completed === selected.length,
      manualReviewRequired: true,
    });
    console.log(
      `${completed}/${selected.length} ${step.id} ${step.variant} contract=${record.contractValid} truncated=${record.truncated}`,
    );
  }
  console.log(`Finished; semantic review is still required. ${output}`);
  if (invalid) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Comparison could not be started.');
  process.exitCode = 1;
});
