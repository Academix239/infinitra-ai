import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error('MONGODB_URI missing');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const g = global as any;

if (process.env.NODE_ENV === 'development') {
  if (!g._mongoClientPromise) {
    client = new MongoClient(uri);
    g._mongoClientPromise = client.connect();
  }
  clientPromise = g._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const c = await clientPromise;
  return c.db(); // db name from your URI (ai_fiesta)
}
