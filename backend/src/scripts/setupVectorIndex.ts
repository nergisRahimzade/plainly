import "dotenv/config";
import type { Collection, Db } from "mongodb";
import {
  getDb,
  getDocumentsCollection,
  getMemoriesCollection,
  closeDb,
  EMBEDDING_DIMENSIONS,
  VECTOR_INDEX_NAME,
  MEMORIES_VECTOR_INDEX_NAME,
} from "../db.js";

async function ensureVectorIndex(db: Db, collection: Collection<any>, indexName: string) {
  const collections = await db.listCollections({ name: collection.collectionName }).toArray();
  if (collections.length === 0) {
    console.log(`Creating collection "${collection.collectionName}"...`);
    await db.createCollection(collection.collectionName);
  }

  console.log(`Creating Atlas Vector Search index "${indexName}" on "${collection.collectionName}"...`);
  const definition = {
    fields: [
      { type: "vector", path: "embedding", numDimensions: EMBEDDING_DIMENSIONS, similarity: "cosine" },
      { type: "filter", path: "userId" },
    ],
  };
  try {
    await collection.createSearchIndex({ name: indexName, type: "vectorSearch", definition });
    console.log(
      "Vector index creation requested. It can take a minute or two to finish building in Atlas."
    );
  } catch (err) {
    const message = (err as Error).message || "";
    if (message.includes("Duplicate Index")) {
      console.log(`Index "${indexName}" already exists. Nothing to do.`);
    } else {
      console.error(
        "Could not create the index automatically (this requires an Atlas cluster, not a local MongoDB). " +
          "Create it manually instead:\n" +
          "1. Go to your cluster in Atlas -> Search -> Create Search Index\n" +
          `2. Choose "JSON Editor" and the "plainly" database / "${collection.collectionName}" collection\n` +
          `3. Name it "${indexName}" and use this definition:\n` +
          JSON.stringify(definition, null, 2)
      );
      console.error("\nOriginal error:", message);
    }
  }
}

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  const db = await getDb();

  await ensureVectorIndex(db, await getDocumentsCollection(), VECTOR_INDEX_NAME);
  await ensureVectorIndex(db, await getMemoriesCollection(), MEMORIES_VECTOR_INDEX_NAME);

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
