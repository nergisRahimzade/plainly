import "dotenv/config";
import {
  getDb,
  getDocumentsCollection,
  closeDb,
  EMBEDDING_DIMENSIONS,
  VECTOR_INDEX_NAME,
} from "../db.js";

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  const db = await getDb();
  const collection = await getDocumentsCollection();

  // Make sure the collection exists (Atlas Search indexes require an existing collection).
  const collections = await db.listCollections({ name: collection.collectionName }).toArray();
  if (collections.length === 0) {
    console.log(`Creating collection "${collection.collectionName}"...`);
    await db.createCollection(collection.collectionName);
  }

  console.log(`Creating Atlas Vector Search index "${VECTOR_INDEX_NAME}"...`);
  try {
    await collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: EMBEDDING_DIMENSIONS,
            similarity: "cosine",
          },
          {
            type: "filter",
            path: "userId",
          },
        ],
      },
    });
    console.log(
      "Vector index creation requested. It can take a minute or two to finish building in Atlas."
    );
  } catch (err) {
    const message = (err as Error).message || "";
    if (message.includes("Duplicate Index")) {
      console.log(`Index "${VECTOR_INDEX_NAME}" already exists. Nothing to do.`);
    } else {
      console.error(
        "Could not create the index automatically (this requires an Atlas cluster, not a local MongoDB). " +
          "Create it manually instead:\n" +
          "1. Go to your cluster in Atlas -> Search -> Create Search Index\n" +
          '2. Choose "JSON Editor" and the "plainly" database / "documents" collection\n' +
          `3. Name it "${VECTOR_INDEX_NAME}" and use this definition:\n` +
          JSON.stringify(
            {
              fields: [
                {
                  type: "vector",
                  path: "embedding",
                  numDimensions: EMBEDDING_DIMENSIONS,
                  similarity: "cosine",
                },
                { type: "filter", path: "userId" },
              ],
            },
            null,
            2
          )
      );
      console.error("\nOriginal error:", message);
    }
  }

  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
