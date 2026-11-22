/** Interactive bound search client; authoritative state remains on the server. */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';

// Terminal presentation only; no server imports or cataloging of free model messages.
const terminalTexts = {
  connected: (endpoint) => `Suche über ${endpoint}`,
  commands: 'Befehle: /reset, /execute, /submit TEXT, /exit. Bei Auswahlfragen: /select NUMMER.',
  inputHelp: 'Bei offener Frage ist normaler Text eine clarify-Antwort; sonst ein neuer submit.',
  prompts: { answer: 'Antwort> ', search: 'Suche> ' },
  invalidServerUrl: 'Expected an HTTP(S) server URL without embedded credentials.',
  executionUnavailable: 'Keine bestätigte ausführbare Klärung vorhanden.',
  selectionRequired: 'Bitte eine angebotene Auswahl mit /select NUMMER wählen.',
  unknownCommand: 'Unbekannter Befehl.',
  httpFailure: (status) =>
    `HTTP ${status}: Anfrage fehlgeschlagen. Kein automatischer Folgeaufruf.`,
  bindingUnavailable: 'Bindung nicht mehr nutzbar. /reset oder /submit TEXT verwenden.',
  unexpectedResponse: 'Unerwartete Antwort; /reset oder /submit TEXT verwenden.',
  criteria: 'Server-Kriterien:',
  reset: 'Neuer serverseitiger Suchkontext begonnen.',
  notExecuted: 'Nicht ausgeführt. Serverentscheidung:',
  mediaTypeQuestion: 'Anwendungsfrage: Film oder Serie?',
  mediaTypes: { movie: 'Film', tv: 'Serie' },
  selection: (number, label) => `${number}: ${label} (/select ${number})`,
  freeTextHelp: 'Freier Antworttext wird vom LLM interpretiert.',
  question: (source, message) => `Frage (${source}): ${message}`,
  executeHelp: 'Kriterien bestätigt. Mit /execute ausdrücklich suchen.',
  noFollowUp: 'Kein automatischer Folgeaufruf.',
  requestFailure:
    'Anfrage oder Antwort fehlgeschlagen. Serverstand unklar; keine automatische Wiederholung. /reset oder /submit TEXT verwenden.',
  startupFailure: 'CLI konnte nicht gestartet werden.',
  noResults: 'Suche erfolgreich: keine Titel auf der ersten Ergebnisseite angezeigt.',
  resultCount: (count) =>
    `Suche erfolgreich: ${count} Titel aus der ersten Ergebnisseite angezeigt.`,
  totalCount: (count) => `${count.toLocaleString('de-DE')} Titel insgesamt gefunden.`,
  totalUnavailable: 'Gesamtzahl derzeit nicht verfügbar.',
  columns: { title: 'Titel', mediaType: 'Typ', date: 'Datum', id: 'TMDb-ID' },
  missingDate: '—',
};

const binding = { requestId: z.string().min(1), revision: z.number().int().min(1) };
const questionBinding = { ...binding, questionId: z.string().min(1) };
const questionSchema = z.discriminatedUnion('kind', [
  z.object({
    ...questionBinding,
    kind: z.literal('select_media_type'),
    field: z.literal('mediaType'),
    options: z.array(z.enum(['movie', 'tv'])).min(1),
  }),
  z.object({
    ...questionBinding,
    kind: z.literal('free_text'),
    source: z.enum(['application', 'llm']),
    message: z.string().min(1),
  }),
]);
const criteria = z.record(z.string(), z.unknown());
const decision = z.record(z.string(), z.unknown());
// Validate only fields used by this HTTP client's result presentation.
const resultCardSchema = z.object({
  id: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
  title: z.string().trim().min(1),
  date: z.iso.date().nullable(),
});
const responseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('completed'),
    ...binding,
    criteria,
    results: z.array(resultCardSchema),
    totalResults: z.number().int().nonnegative().nullable(),
  }),
  z.object({
    status: z.literal('not_executed'),
    ...binding,
    criteria,
    decision,
    question: questionSchema.optional(),
  }),
  z.object({
    status: z.literal('clarified'),
    ...binding,
    criteria,
    decision,
    question: questionSchema.optional(),
  }),
  z.object({ status: z.literal('reset'), criteria }),
]);

function displayResults(results, totalResults) {
  console.log(
    totalResults === null
      ? terminalTexts.totalUnavailable
      : terminalTexts.totalCount(totalResults),
  );
  if (results.length === 0) {
    console.log(terminalTexts.noResults);
    return;
  }
  console.log(terminalTexts.resultCount(results.length));
  console.table(
    results.map((result) => ({
      [terminalTexts.columns.title]: result.title,
      [terminalTexts.columns.mediaType]: terminalTexts.mediaTypes[result.mediaType],
      [terminalTexts.columns.date]: result.date ?? terminalTexts.missingDate,
      [terminalTexts.columns.id]: result.id,
    })),
  );
}

async function main() {
  const baseUrl = new URL(process.argv[2] ?? 'http://localhost:3000');
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password)
    throw new Error(terminalTexts.invalidServerUrl);
  const endpoint = new URL('/api/search', baseUrl);
  const terminal = createInterface({ input: stdin, output: stdout });
  let cookie;
  let current;
  terminal.on('SIGINT', () => terminal.close());
  console.log(terminalTexts.connected(endpoint.href));
  console.log(terminalTexts.commands);
  console.log(terminalTexts.inputHelp);
  try {
    while (!terminal.closed) {
      const text = (
        await terminal.question(
          current?.question ? terminalTexts.prompts.answer : terminalTexts.prompts.search,
        )
      ).trim();
      if (!text) continue;
      if (text === '/exit') break;
      let body;
      if (text === '/reset') body = { action: 'reset' };
      else if (text === '/execute') {
        if (
          !current ||
          current.question ||
          current.status !== 'clarified' ||
          current.decision.status !== 'ready'
        ) {
          console.error(terminalTexts.executionUnavailable);
          continue;
        }
        body = { action: 'execute', requestId: current.requestId, revision: current.revision };
      } else if (text.startsWith('/submit ')) {
        body = { action: 'submit', userText: text.slice(8).trim() };
      } else if (text.startsWith('/select ')) {
        const question = current?.question;
        const index = Number(text.slice(8));
        if (
          !question ||
          question.kind !== 'select_media_type' ||
          !Number.isInteger(index) ||
          index < 1 ||
          index > question.options.length
        ) {
          console.error(terminalTexts.selectionRequired);
          continue;
        }
        body = {
          action: 'clarify',
          requestId: question.requestId,
          revision: question.revision,
          questionId: question.questionId,
          answer: { type: 'selection', value: question.options[index - 1] },
        };
      } else if (text.startsWith('/')) {
        console.error(terminalTexts.unknownCommand);
        continue;
      } else if (current?.question) {
        const question = current.question;
        body = {
          action: 'clarify',
          requestId: question.requestId,
          revision: question.revision,
          questionId: question.questionId,
          answer: { type: 'text', text },
        };
      } else body = { action: 'submit', userText: text };
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: JSON.stringify(body),
          redirect: 'error',
          signal: AbortSignal.timeout(120000),
        });
        for (const value of response.headers.getSetCookie()) {
          const pair = value.split(';', 1)[0];
          if (pair?.startsWith('nuxtwatch-search=')) cookie = pair;
        }
        if (!response.ok) {
          console.error(terminalTexts.httpFailure(response.status));
          if ([409, 410].includes(response.status)) {
            current = undefined;
            console.error(terminalTexts.bindingUnavailable);
          }
          continue;
        }
        const result = responseSchema.safeParse(await response.json());
        if (!result.success) {
          current = undefined;
          console.error(terminalTexts.unexpectedResponse);
          continue;
        }
        current = result.data.status === 'reset' ? undefined : result.data;
        console.log(terminalTexts.criteria);
        console.log(JSON.stringify(result.data.criteria, null, 2));
        if (result.data.status === 'reset') console.log(terminalTexts.reset);
        else if (result.data.status === 'completed') {
          displayResults(result.data.results, result.data.totalResults);
        } else {
          console.log(terminalTexts.notExecuted);
          console.log(JSON.stringify(result.data.decision, null, 2));
          const question = result.data.question;
          if (question?.kind === 'select_media_type') {
            console.log(terminalTexts.mediaTypeQuestion);
            question.options.forEach((value, index) =>
              console.log(terminalTexts.selection(index + 1, terminalTexts.mediaTypes[value])),
            );
            console.log(terminalTexts.freeTextHelp);
          } else if (question)
            console.log(terminalTexts.question(question.source, question.message));
          else if (result.data.status === 'clarified' && result.data.decision.status === 'ready')
            console.log(terminalTexts.executeHelp);
          console.log(terminalTexts.noFollowUp);
        }
      } catch {
        current = undefined;
        console.error(terminalTexts.requestFailure);
      }
    }
  } finally {
    terminal.close();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : terminalTexts.startupFailure);
  process.exitCode = 1;
});
