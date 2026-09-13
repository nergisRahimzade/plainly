import "dotenv/config";
import {
  getDb,
  getDocumentsCollection,
  closeDb,
  EMBEDDING_DIMENSIONS,
  VECTOR_INDEX_NAME,
} from "./db.js";

const INDEX_DEFINITION = {
  fields: [
    {
      type: "vector",
      path: "embedding",
      numDimensions: EMBEDDING_DIMENSIONS,
      similarity: "cosine",
    },
    { type: "filter", path: "userId" },
  ],
};

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  const db = await getDb();
  const collection = await getDocumentsCollection();

  const existing = await db.listCollections({ name: collection.collectionName }).toArray();
  if (existing.length === 0) {
    console.log(`Creating collection "${collection.collectionName}"...`);
    await db.createCollection(collection.collectionName);
  }

  console.log(`Creating Atlas Vector Search index "${VECTOR_INDEX_NAME}"...`);
  try {
    await collection.createSearchIndex({
      name: VECTOR_INDEX_NAME,
      type: "vectorSearch",
      definition: INDEX_DEFINITION,
    });
    console.log("Index requested. Atlas may take a minute or two to finish building it.");
  } catch (err) {
    const message = (err as Error).message || "";
    if (message.includes("Duplicate Index")) {
      console.log(`Index "${VECTOR_INDEX_NAME}" already exists.`);
    } else {
      console.error(
        "Could not create the index automatically (needs an Atlas cluster, not local MongoDB).\n" +
          "Atlas → Search → Create Search Index → JSON Editor, name it " +
          `"${VECTOR_INDEX_NAME}", database plainly / collection documents:\n` +
          JSON.stringify(INDEX_DEFINITION, null, 2)
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
