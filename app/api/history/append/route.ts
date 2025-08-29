import { NextRequest } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getOrCreateSessionId } from '../../../../lib/session';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const sid = getOrCreateSessionId();
  const db = await getDb();

  await db.collection('chats').updateOne(
    { sid },
    { $set: { sid, updatedAt: new Date(), messages } },
    { upsert: true }
  );

  return new Response('ok');
}
