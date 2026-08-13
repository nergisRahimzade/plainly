import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  getDocumentsCollection,
  VECTOR_INDEX_NAME,
} from "../db.js";
import { analyzeScreenshot, embedText, findConnections } from "../gemini.js";
import { SEED_DOCUMENTS } from "../seedData.js";
import type { PlainlyDocument, PlainlyDocumentPublic, RelatedDocRef } from "../types.js";

export const documentsRouter = Router();

// Calibrated empirically with gemini-embedding-001: cosine similarity between
// genuinely unrelated documents/queries still lands around 0.70-0.76 (shared
// "this is a structured document" signal), while true matches land at 0.85+.
// These thresholds sit in the gap between those two clusters.
const RELATED_SCORE_THRESHOLD = 0.82;
const MAX_RELATED = 3;
// $vectorSearch always returns its nearest candidates even when none are actually
// relevant, so we drop anything below this similarity score to avoid showing
// unrelated documents as "matches" for a search query.
const SEARCH_SCORE_THRESHOLD = 0.8;

function requireUserId(req: Request, res: Response): string | null {
  const userId = (req.header("x-user-id") || req.query.userId || req.body?.userId) as
    | string
    | undefined;
  if (!userId || typeof userId !== "string") {
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

// POST /api/documents - upload + analyze a screenshot
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

    const embeddingSourceText = [analysis.title, analysis.summary, analysis.docType, ...analysis.keyEntities].join(". ");
    const embedding = await embedText(embeddingSourceText);

    const collection = await getDocumentsCollection();

    let related: (PlainlyDocument & { _id: ObjectId; score: number })[] = [];
    try {
      related = (await collection
        .aggregate([
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: "embedding",
              queryVector: embedding,
              numCandidates: 100,
              limit: MAX_RELATED,
              filter: { userId },
            },
          },
          { $set: { score: { $meta: "vectorSearchScore" } } },
        ])
        .toArray()) as (PlainlyDocument & { _id: ObjectId; score: number })[];
    } catch (err) {
      console.warn(
        "Vector search unavailable (has the Atlas vector index been created yet?):",
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

    const now = new Date();
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
      createdAt: now,
    };

    const insertResult = await collection.insertOne(doc);

    const relatedRefs: RelatedDocRef[] = relevantRelated.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      docType: r.docType,
      createdAt: r.createdAt.toISOString(),
    }));

    res.status(201).json(
      toPublic({ ...doc, _id: insertResult.insertedId }, relatedRefs)
    );
  } catch (err) {
    console.error("Error analyzing document:", err);
    res.status(500).json({ error: "Failed to analyze the screenshot. Please try again." });
  }
});

// POST /api/documents/seed - populate the current user's real history with a
// curated set of example documents (real Mongo records + real embeddings),
// for demoing the working app rather than for the offline fallback demo mode.
documentsRouter.post("/seed", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getDocumentsCollection();
    const insertedByTitle = new Map<
      string,
      { id: ObjectId; title: string; docType: PlainlyDocument["docType"]; createdAt: Date }
    >();
    const created: PlainlyDocumentPublic[] = [];

    for (const seed of SEED_DOCUMENTS) {
      const embeddingSourceText = [seed.title, seed.summary, seed.docType, ...seed.keyEntities].join(". ");
      const embedding = await embedText(embeddingSourceText);

      const relatedRefs: RelatedDocRef[] = [];
      const relatedTo: string[] = [];
      const related = seed.relatedToTitle ? insertedByTitle.get(seed.relatedToTitle) : undefined;
      if (related) {
        relatedTo.push(related.id.toString());
        relatedRefs.push({
          id: related.id.toString(),
          title: related.title,
          docType: related.docType,
          createdAt: related.createdAt.toISOString(),
        });
      }

      const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);
      const doc: PlainlyDocument = {
        userId,
        docType: seed.docType,
        title: seed.title,
        summary: seed.summary,
        explanation: seed.explanation,
        actionItems: seed.actionItems,
        redFlags: seed.redFlags,
        keyEntities: seed.keyEntities,
        connections: seed.connections,
        relatedTo,
        embedding,
        createdAt,
      };

      const insertResult = await collection.insertOne(doc);
      insertedByTitle.set(seed.title, {
        id: insertResult.insertedId,
        title: seed.title,
        docType: seed.docType,
        createdAt,
      });
      created.push(toPublic({ ...doc, _id: insertResult.insertedId }, relatedRefs));
    }

    res.status(201).json(created);
  } catch (err) {
    console.error("Error seeding example documents:", err);
    res.status(500).json({ error: "Failed to add example documents." });
  }
});

// GET /api/documents - list a user's history, newest first
documentsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getDocumentsCollection();
    const docs = await collection
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

// GET /api/documents/search?q=... - semantic search over a user's history
documentsRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const q = req.query.q as string | undefined;
    if (!q || !q.trim()) {
      res.status(400).json({ error: "Missing search query ?q=" });
      return;
    }

    const queryEmbedding = await embedText(q);
    const collection = await getDocumentsCollection();

    const results = (await collection
      .aggregate([
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 200,
            limit: 20,
            filter: { userId },
          },
        },
        { $set: { score: { $meta: "vectorSearchScore" } } },
      ])
      .toArray()) as (PlainlyDocument & { _id: ObjectId; score: number })[];

    const matches = results.filter((r) => r.score >= SEARCH_SCORE_THRESHOLD);

    res.json(matches.map((d) => toPublic(d)));
  } catch (err) {
    console.error("Error searching documents:", err);
    res.status(500).json({
      error:
        "Semantic search failed. Make sure the Atlas Vector Search index has been created (see README).",
    });
  }
});

// GET /api/documents/:id
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

// DELETE /api/documents/:id
documentsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getDocumentsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id), userId });
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
