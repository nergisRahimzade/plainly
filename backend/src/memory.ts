import { ObjectId } from "mongodb";
import { getMemoriesCollection, MEMORIES_VECTOR_INDEX_NAME } from "./db.js";
import { embedText, extractMemories } from "./gemini.js";
import type { Memory, MemoryPublic, MemorySourceType } from "./types.js";

// Memories are supplementary context, not part of the primary request/response
// flow (uploading a document or getting a chat reply) — so callers should not
// `await` this; it's meant to run in the background after a response is sent.
export async function saveMemoriesFromText(params: {
  userId: string;
  sourceText: string;
  sourceType: MemorySourceType;
  sourceId?: string;
}): Promise<void> {
  try {
    const facts = await extractMemories(params.sourceText);
    if (facts.length === 0) return;

    const collection = await getMemoriesCollection();
    const now = new Date();
    const docs: Memory[] = await Promise.all(
      facts.map(async (content) => ({
        userId: params.userId,
        content,
        embedding: await embedText(content),
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        createdAt: now,
      }))
    );
    if (docs.length > 0) {
      await collection.insertMany(docs);
    }
  } catch (err) {
    console.warn("Memory extraction failed (non-fatal):", (err as Error).message);
  }
}

export interface RetrievedMemory {
  id: string;
  content: string;
  score: number;
}

const MEMORY_SCORE_THRESHOLD = 0.72;

/** Vector-searches the user's long-term memories for ones relevant to `queryEmbedding`. */
export async function retrieveRelevantMemories(params: {
  userId: string;
  queryEmbedding: number[];
  limit: number;
}): Promise<RetrievedMemory[]> {
  try {
    const collection = await getMemoriesCollection();
    const results = (await collection
      .aggregate([
        {
          $vectorSearch: {
            index: MEMORIES_VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: params.queryEmbedding,
            numCandidates: 150,
            limit: params.limit,
            filter: { userId: params.userId },
          },
        },
        { $set: { score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray()) as (Memory & { _id: ObjectId; score: number })[];

    return results
      .filter((m) => m.score >= MEMORY_SCORE_THRESHOLD)
      .map((m) => ({ id: m._id.toString(), content: m.content, score: m.score }));
  } catch (err) {
    console.warn("Memory retrieval unavailable (has the vector index been created yet?):", (err as Error).message);
    return [];
  }
}

export function toMemoryPublic(memory: Memory & { _id: ObjectId }): MemoryPublic {
  return {
    id: memory._id.toString(),
    content: memory.content,
    sourceType: memory.sourceType,
    sourceId: memory.sourceId,
    createdAt: memory.createdAt.toISOString(),
  };
}
