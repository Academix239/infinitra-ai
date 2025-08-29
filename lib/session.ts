import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export function getOrCreateSessionId() {
  const c = cookies();
  let id = c.get('sid')?.value;
  if (!id) {
    id = randomUUID();
    c.set('sid', id, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return id;
}
