import { getDb } from '../../../../lib/db';
import { getOrCreateSessionId } from '../../../../lib/session';

export async function GET() {
  const sid = getOrCreateSessionId();
  const db = await getDb();
  const doc = await db.collection('chats').findOne(
    { sid },
    { projection: { _id: 0, messages: 1 } }
  );

  return new Response(JSON.stringify(doc?.messages ?? null), {
    headers: { 'Content-Type': 'application/json' },
  });
}
