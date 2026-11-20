/** Interactive submit client; authoritative criteria remain on the server. */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';

const responseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('completed'),
    criteria: z.record(z.string(), z.unknown()),
    results: z.array(z.unknown()),
  }),
  z.object({
    status: z.literal('not_executed'),
    criteria: z.record(z.string(), z.unknown()),
    decision: z.record(z.string(), z.unknown()),
  }),
  z.object({
    status: z.literal('reset'),
    criteria: z.record(z.string(), z.unknown()),
  }),
]);

async function main() {
  const baseUrl = new URL(process.argv[2] ?? 'http://localhost:3000');
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new Error('Expected an HTTP(S) server URL without embedded credentials.');
  }
  const endpoint = new URL('/api/search', baseUrl);
  const terminal = createInterface({ input: stdin, output: stdout });
  let cookie;

  terminal.on('SIGINT', () => terminal.close());
  console.log(`Suche über ${endpoint.href}`);
  console.log('Befehle: /reset für einen neuen Server-Suchkontext, /exit zum Beenden.');
  console.log('Dieser Client unterstützt submit und reset, noch nicht clarify oder execute.');

  try {
    while (!terminal.closed) {
      const text = (await terminal.question('Suche> ')).trim();
      if (!text) continue;
      if (text === '/exit') break;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: JSON.stringify(
            text === '/reset' ? { action: 'reset' } : { action: 'submit', userText: text },
          ),
          redirect: 'error',
          signal: AbortSignal.timeout(120000),
        });
        for (const value of response.headers.getSetCookie()) {
          const pair = value.split(';', 1)[0];
          if (pair?.startsWith('nuxtwatch-search=')) cookie = pair;
        }
        if (!response.ok) {
          console.error(`HTTP ${response.status}: Anfrage fehlgeschlagen.`);
          if (response.status === 410)
            console.error('Suchkontext abgelaufen. Bitte /reset verwenden.');
          continue;
        }
        const result = responseSchema.safeParse(await response.json());
        if (!result.success) {
          console.error('Unerwartete Serverantwort. Kein automatischer Folgeaufruf.');
          continue;
        }
        console.log('Server-Kriterien:');
        console.log(JSON.stringify(result.data.criteria, null, 2));
        if (result.data.status === 'reset') {
          console.log('Neuer serverseitiger Suchkontext begonnen.');
        } else if (result.data.status === 'completed') {
          console.log(`Treffer (${result.data.results.length} in dieser Antwort):`);
          console.log(JSON.stringify(result.data.results, null, 2));
        } else {
          console.log('Nicht ausgeführt. Serverentscheidung:');
          console.log(JSON.stringify(result.data.decision, null, 2));
          console.log('Kein automatischer Folgeaufruf. Neue Eingabe ist ein neuer submit.');
        }
      } catch {
        console.error(
          'Anfrage abgebrochen, Server nicht erreichbar oder Antwort ungültig. Serverstand kann bereits geändert sein; keine automatische Wiederholung.',
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
