/** Interactive client for the current submit-only HTTP slice. */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';

// Validate the envelope only; domain decisions and result mapping belong to the server.
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
]);

async function main() {
  const baseUrl = new URL(process.argv[2] ?? 'http://localhost:3000');
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new Error('Expected an HTTP(S) server URL without embedded credentials.');
  }
  const endpoint = new URL('/api/search', baseUrl);
  const terminal = createInterface({ input: stdin, output: stdout });
  let criteria;

  terminal.on('SIGINT', () => terminal.close());
  console.log(`Suche über ${endpoint.href}`);
  console.log('Befehle: /reset für neue Kriterien, /exit zum Beenden.');
  console.log('Dieser Client unterstützt zunächst submit, noch nicht clarify oder execute.');

  try {
    while (!terminal.closed) {
      const text = (await terminal.question('Suche> ')).trim();
      if (!text) continue;
      if (text === '/exit') break;
      if (text === '/reset') {
        criteria = undefined;
        console.log('Lokaler Kriterienstand zurückgesetzt.');
        continue;
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ action: 'submit', userText: text, currentFilters: criteria }),
          redirect: 'error',
          signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
          console.error(`HTTP ${response.status}: Anfrage fehlgeschlagen. Kriterien bleiben unverändert.`);
          continue;
        }
        const result = responseSchema.safeParse(await response.json());
        if (!result.success) {
          console.error('Unerwartete Serverantwort. Kriterien bleiben unverändert.');
          continue;
        }
        criteria = result.data.criteria;
        console.log('Kriterien:');
        console.log(JSON.stringify(criteria, null, 2));
        if (result.data.status === 'completed') {
          console.log(`Treffer (${result.data.results.length} in dieser Antwort):`);
          console.log(JSON.stringify(result.data.results, null, 2));
        } else {
          console.log('Nicht ausgeführt. Serverentscheidung:');
          console.log(JSON.stringify(result.data.decision, null, 2));
          console.log('Kein automatischer Folgeaufruf. Neue Eingabe ist ein neuer submit; für eine neue Suche /reset verwenden.');
        }
      } catch {
        console.error('Anfrage abgebrochen, Server nicht erreichbar oder Antwort ungültig. Kriterien bleiben unverändert.');
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
