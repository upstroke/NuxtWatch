import assert from 'node:assert/strict';

const title = 'The Matrix';
const cases = [
  ['Ich meine den Film von 1999', { status: 'refined', criteria: { title, mediaType: 'movie', year: 1999 } }],
  ['Ich meine den von 1999', { status: 'unchanged' }],
];

for (const [userText, expected] of cases) {
  try {
    const response = await fetch('http://localhost:3000/api/search/title/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentFilters: { title, mediaType: 'all' }, userText }),
      signal: AbortSignal.timeout(35000),
    });
    assert.ok(response.ok, `HTTP ${response.status}`);
    const actual = await response.json();
    assert.deepEqual(actual, expected);
    console.log(`OK: ${userText} → ${JSON.stringify(actual)}`);
  } catch (error) {
    console.error(`FAIL: ${userText} → ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
