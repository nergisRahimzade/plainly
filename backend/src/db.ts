import { MongoClient, Collection } from "mongodb";
import type { PlainlyDocument } from "./types.js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "plainly";

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable. Copy .env.example to .env and fill it in.");
}

export const EMBEDDING_DIMENSIONS = 768;
export const DOCUMENTS_COLLECTION = "documents";
export const VECTOR_INDEX_NAME = "documents_vector_index";

const client = new MongoClient(MONGODB_URI);
let connected = false;

export async function getDb() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client.db(MONGODB_DB_NAME);
}

export async function getDocumentsCollection(): Promise<Collection<PlainlyDocument>> {
  const db = await getDb();
  return db.collection<PlainlyDocument>(DOCUMENTS_COLLECTION);
}

export async function closeDb() {
  if (connected) {
    await client.close();
    connected = false;
  }
}
