/** Interactive bound search client; authoritative state remains on the server. */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';

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

function displayResults(results) {
  if (results.length === 0) {
    console.log('Suche erfolgreich: keine Treffer in dieser Antwort.');
    return;
  }
  console.log(`Suche erfolgreich: ${results.length} Treffer in dieser Antwort (keine Gesamtzahl).`);
  console.table(
    results.map((result) => ({
      Titel: result.title,
      Typ: result.mediaType === 'movie' ? 'Film' : 'Serie',
      Datum: result.date ?? '—',
      'TMDb-ID': result.id,
    })),
  );
}

async function main() {
  const baseUrl = new URL(process.argv[2] ?? 'http://localhost:3000');
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password)
    throw new Error('Expected an HTTP(S) server URL without embedded credentials.');
  const endpoint = new URL('/api/search', baseUrl);
  const terminal = createInterface({ input: stdin, output: stdout });
  let cookie;
  let current;
  terminal.on('SIGINT', () => terminal.close());
  console.log(`Suche über ${endpoint.href}`);
  console.log('Befehle: /reset, /execute, /submit TEXT, /exit. Bei Auswahlfragen: /select NUMMER.');
  console.log('Bei offener Frage ist normaler Text eine clarify-Antwort; sonst ein neuer submit.');
  try {
    while (!terminal.closed) {
      const text = (await terminal.question(current?.question ? 'Antwort> ' : 'Suche> ')).trim();
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
          console.error('Keine bestätigte ausführbare Klärung vorhanden.');
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
          console.error('Bitte eine angebotene Auswahl mit /select NUMMER wählen.');
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
        console.error('Unbekannter Befehl.');
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
          console.error(
            `HTTP ${response.status}: Anfrage fehlgeschlagen. Kein automatischer Folgeaufruf.`,
          );
          if ([409, 410].includes(response.status)) {
            current = undefined;
            console.error('Bindung nicht mehr nutzbar. /reset oder /submit TEXT verwenden.');
          }
          continue;
        }
        const result = responseSchema.safeParse(await response.json());
        if (!result.success) {
          current = undefined;
          console.error('Unerwartete Antwort; /reset oder /submit TEXT verwenden.');
          continue;
        }
        current = result.data.status === 'reset' ? undefined : result.data;
        console.log('Server-Kriterien:');
        console.log(JSON.stringify(result.data.criteria, null, 2));
        if (result.data.status === 'reset')
          console.log('Neuer serverseitiger Suchkontext begonnen.');
        else if (result.data.status === 'completed') {
          displayResults(result.data.results);
        } else {
          console.log('Nicht ausgeführt. Serverentscheidung:');
          console.log(JSON.stringify(result.data.decision, null, 2));
          const question = result.data.question;
          if (question?.kind === 'select_media_type') {
            console.log('Anwendungsfrage: Film oder Serie?');
            question.options.forEach((value, index) =>
              console.log(
                `${index + 1}: ${value === 'movie' ? 'Film' : 'Serie'} (/select ${index + 1})`,
              ),
            );
            console.log('Freier Antworttext wird vom LLM interpretiert.');
          } else if (question) console.log(`Frage (${question.source}): ${question.message}`);
          else if (result.data.status === 'clarified' && result.data.decision.status === 'ready')
            console.log('Kriterien bestätigt. Mit /execute ausdrücklich suchen.');
          console.log('Kein automatischer Folgeaufruf.');
        }
      } catch {
        current = undefined;
        console.error(
          'Anfrage oder Antwort fehlgeschlagen. Serverstand unklar; keine automatische Wiederholung. /reset oder /submit TEXT verwenden.',
        );
      }
    }
  } finally {
    terminal.close();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'CLI konnte nicht gestartet werden.');
  process.exitCode = 1;
});
