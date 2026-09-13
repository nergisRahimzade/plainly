import { Router, type Request, type Response } from "express";
import { ObjectId, type Collection } from "mongodb";
import { getDocumentsCollection, VECTOR_INDEX_NAME } from "./db.js";
import { analyzeScreenshot, embedText, findConnections } from "./gemini.js";
import type { PlainlyDocument, PlainlyDocumentPublic, RelatedDocRef } from "./types.js";

export const documentsRouter = Router();

// gemini-embedding-001 cosine scores: unrelated docs still land ~0.70–0.76
// (shared "this is a document" signal); true matches are 0.85+. Thresholds sit in the gap.
const RELATED_SCORE_THRESHOLD = 0.82;
const MAX_RELATED = 3;
// $vectorSearch always returns nearest neighbors, so drop weak scores or search
// for something irrelevant would still show random history items.
const SEARCH_SCORE_THRESHOLD = 0.8;

function requireUserId(req: Request, res: Response): string | null {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(400).json({ error: "Missing x-user-id header." });
    return null;
  }
  return userId;
}

function toPublic(
  doc: PlainlyDocument & { _id: ObjectId; score?: number },
  relatedDocs: RelatedDocRef[] = []
): PlainlyDocumentPublic {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    docType: doc.docType,
    title: doc.title,
    summary: doc.summary,
    explanation: doc.explanation,
    actionItems: doc.actionItems,
    redFlags: doc.redFlags,
    connections: doc.connections,
    relatedTo: relatedDocs,
    createdAt: doc.createdAt.toISOString(),
    score: doc.score,
  };
}

type ScoredDoc = PlainlyDocument & { _id: ObjectId; score: number };

async function vectorSearch(
  collection: Collection<PlainlyDocument>,
  userId: string,
  queryVector: number[],
  limit: number,
  numCandidates: number
): Promise<ScoredDoc[]> {
  return (await collection
    .aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: "embedding",
          queryVector,
          numCandidates,
          limit,
          filter: { userId },
        },
      },
      { $set: { score: { $meta: "vectorSearchScore" } } },
    ])
    .toArray()) as ScoredDoc[];
}

// POST /api/documents — analyze a screenshot. Image is sent to Gemini, then discarded.
documentsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { imageBase64, mimeType } = req.body as {
      imageBase64?: string;
      mimeType?: string;
    };
    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: "imageBase64 and mimeType are required." });
      return;
    }

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",").pop()!
      : imageBase64;

    const analysis = await analyzeScreenshot({ base64Image: cleanBase64, mimeType });
    const embedding = await embedText(
      [analysis.title, analysis.summary, analysis.docType, ...analysis.keyEntities].join(". ")
    );

    const collection = await getDocumentsCollection();

    let related: ScoredDoc[] = [];
    try {
      related = await vectorSearch(collection, userId, embedding, MAX_RELATED, 100);
    } catch (err) {
      console.warn(
        "Vector search unavailable (create the Atlas index with npm run setup-index):",
        (err as Error).message
      );
    }

    const relevantRelated = related.filter((r) => r.score >= RELATED_SCORE_THRESHOLD);
    const connections = await findConnections({
      newDoc: { title: analysis.title, summary: analysis.summary, docType: analysis.docType },
      relatedSummaries: relevantRelated.map(
        (r) => `${r.title} (${r.docType}, ${r.createdAt.toISOString().slice(0, 10)}): ${r.summary}`
      ),
    });

    const doc: PlainlyDocument = {
      userId,
      docType: analysis.docType,
      title: analysis.title,
      summary: analysis.summary,
      explanation: analysis.explanation,
      actionItems: analysis.actionItems,
      redFlags: analysis.redFlags,
      keyEntities: analysis.keyEntities,
      connections,
      relatedTo: relevantRelated.map((r) => r._id.toString()),
      embedding,
      createdAt: new Date(),
    };

    const insertResult = await collection.insertOne(doc);
    const relatedRefs: RelatedDocRef[] = relevantRelated.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      docType: r.docType,
      createdAt: r.createdAt.toISOString(),
    }));

    res.status(201).json(toPublic({ ...doc, _id: insertResult.insertedId }, relatedRefs));
  } catch (err) {
    console.error("Error analyzing document:", err);
    res.status(500).json({ error: "Failed to analyze the screenshot. Please try again." });
  }
});

documentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const docs = await (await getDocumentsCollection())
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json(docs.map((d) => toPublic(d as PlainlyDocument & { _id: ObjectId })));
  } catch (err) {
    console.error("Error listing documents:", err);
    res.status(500).json({ error: "Failed to load history." });
  }
});

documentsRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q) {
      res.status(400).json({ error: "Missing search query ?q=" });
      return;
    }

    const results = await vectorSearch(
      await getDocumentsCollection(),
      userId,
      await embedText(q),
      20,
      200
    );

    res.json(results.filter((r) => r.score >= SEARCH_SCORE_THRESHOLD).map((d) => toPublic(d)));
  } catch (err) {
    console.error("Error searching documents:", err);
    res.status(500).json({
      error: "Semantic search failed. Create the Atlas Vector Search index (see README).",
    });
  }
});

documentsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getDocumentsCollection();
    const doc = await collection.findOne({ _id: new ObjectId(req.params.id), userId });
    if (!doc) {
      res.status(404).json({ error: "Document not found." });
      return;
    }

    let relatedRefs: RelatedDocRef[] = [];
    if (doc.relatedTo.length > 0) {
      const relatedDocs = await collection
        .find({ _id: { $in: doc.relatedTo.map((id) => new ObjectId(id)) } })
        .toArray();
      relatedRefs = relatedDocs.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        docType: r.docType,
        createdAt: r.createdAt.toISOString(),
      }));
    }

    res.json(toPublic(doc as PlainlyDocument & { _id: ObjectId }, relatedRefs));
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Failed to load document." });
  }
});

documentsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const result = await (await getDocumentsCollection()).deleteOne({
      _id: new ObjectId(req.params.id),
      userId,
    });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Document not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Failed to delete document." });
  }
});
