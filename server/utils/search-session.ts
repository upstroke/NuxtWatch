/** Single-process, bounded session storage. Lost on restart; not a multi-instance store. */
import { randomBytes } from 'node:crypto';
import { createError, getCookie, getRequestURL, setCookie } from 'h3';
import type { H3Event } from 'h3';
import type { ParserInput } from '../services/search/parser';

type SearchSession = {
  criteria: ParserInput['currentFilters'];
  expiresAt: number;
  busy: boolean;
};

// Initial operational limits, not a promise of durable session resumption.
const lifetime = 30 * 60 * 1000;
const capacity = 1000;
const cookieName = 'nuxtwatch-search';
const sessions = new Map<string, SearchSession>();

export function getSearchSession(event: H3Event, reset = false) {
  const now = Date.now();
  for (const [key, value] of sessions) {
    if (value.expiresAt <= now) sessions.delete(key);
  }

  let key = getCookie(event, cookieName);
  let session = key ? sessions.get(key) : undefined;
  if (reset) {
    if (key) sessions.delete(key);
    key = undefined;
    session = undefined;
  } else if (key && !session) {
    throw createError({ statusCode: 410, statusMessage: 'Search session expired; reset required' });
  }

  if (!session) {
    if (sessions.size >= capacity) {
      throw createError({ statusCode: 503, statusMessage: 'Search session capacity reached' });
    }
    key = randomBytes(32).toString('hex');
    session = { criteria: { mediaType: 'all' }, expiresAt: now + lifetime, busy: false };
    sessions.set(key, session);
  }

  const sessionKey = key!;
  const current = session;
  setCookie(event, cookieName, sessionKey, {
    httpOnly: true,
    secure: getRequestURL(event).protocol === 'https:',
    sameSite: 'strict',
    path: '/api/search',
  });

  return {
    session: current,
    isCurrent: () => sessions.get(sessionKey) === current && current.expiresAt > Date.now(),
    touch: () => { current.expiresAt = Date.now() + lifetime; },
  };
}
