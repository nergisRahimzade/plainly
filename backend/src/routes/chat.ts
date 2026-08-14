import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getConversationsCollection, getDocumentsCollection, VECTOR_INDEX_NAME } from "../db.js";
import { chatReply, embedText } from "../gemini.js";
import { resolveUserId } from "../auth.js";
import { retrieveRelevantMemories, saveMemoriesFromText } from "../memory.js";
import type {
  ChatMessage,
  ChatMessagePublic,
  Conversation,
  ConversationPublic,
  ConversationSummaryPublic,
  PlainlyDocument,
  RelatedDocRef,
} from "../types.js";

export const chatRouter = Router();

// Same reasoning as the documents route's thresholds: below this, retrieved
// documents share only surface-level "this is a structured document" signal
// rather than being genuinely relevant to the question being asked.
const CONTEXT_SCORE_THRESHOLD = 0.75;
const MAX_CONTEXT_DOCS = 4;
const MAX_CONTEXT_MEMORIES = 5;
const MAX_HISTORY_MESSAGES = 20;

function requireUserId(req: Request, res: Response): string | null {
  const userId = resolveUserId(req);
  if (!userId) {
    res.status(400).json({ error: "Missing x-user-id header or Authorization bearer token." });
    return null;
  }
  return userId;
}

async function resolveContextDocs(ids: string[] | undefined): Promise<RelatedDocRef[]> {
  if (!ids || ids.length === 0) return [];
  const collection = await getDocumentsCollection();
  const docs = await collection.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  return ids
    .map((id) => byId.get(id))
    .filter((d): d is PlainlyDocument & { _id: ObjectId } => !!d)
    .map((d) => ({ id: d._id.toString(), title: d.title, docType: d.docType, createdAt: d.createdAt.toISOString() }));
}

async function toPublic(convo: Conversation & { _id: ObjectId }): Promise<ConversationPublic> {
  const messages: ChatMessagePublic[] = await Promise.all(
    convo.messages.map(async (m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      contextDocs: await resolveContextDocs(m.contextDocumentIds),
    }))
  );
  return {
    id: convo._id.toString(),
    title: convo.title,
    messages,
    createdAt: convo.createdAt.toISOString(),
    updatedAt: convo.updatedAt.toISOString(),
  };
}

// GET /api/chat - list the user's conversations, newest first
chatRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getConversationsCollection();
    const convos = await collection.find({ userId }).sort({ updatedAt: -1 }).limit(50).toArray();

    const summaries: ConversationSummaryPublic[] = convos.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      lastMessage: c.messages[c.messages.length - 1]?.content ?? "",
      updatedAt: c.updatedAt.toISOString(),
    }));
    res.json(summaries);
  } catch (err) {
    console.error("Error listing conversations:", err);
    res.status(500).json({ error: "Failed to load your conversations." });
  }
});

// POST /api/chat - send a message; creates a new conversation if no conversationId is given
chatRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { conversationId, message } = req.body as { conversationId?: string; message?: string };
    const trimmedMessage = message?.trim();
    if (!trimmedMessage) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const collection = await getConversationsCollection();
    let convo: (Conversation & { _id: ObjectId }) | null = null;
    if (conversationId) {
      convo = (await collection.findOne({ _id: new ObjectId(conversationId), userId })) as
        | (Conversation & { _id: ObjectId })
        | null;
      if (!convo) {
        res.status(404).json({ error: "Conversation not found." });
        return;
      }
    }

    // Retrieve documents *and* long-term memories relevant to this message via
    // vector search, so the assistant can ground its answer in the user's actual
    // history — including reasons/context extracted from much earlier documents
    // or conversations that aren't part of this thread's own message history.
    let contextDocIds: string[] = [];
    let contextSnippets: string[] = [];
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embedText(trimmedMessage);
      const docsCollection = await getDocumentsCollection();
      const candidates = (await docsCollection
        .aggregate([
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: 150,
              limit: MAX_CONTEXT_DOCS,
              filter: { userId },
            },
          },
          { $set: { score: { $meta: "vectorSearchScore" } } },
        ])
        .toArray()) as (PlainlyDocument & { _id: ObjectId; score: number })[];

      const relevant = candidates.filter((d) => d.score >= CONTEXT_SCORE_THRESHOLD);
      contextDocIds = relevant.map((d) => d._id.toString());
      contextSnippets = relevant.map(
        (d) =>
          `[Document] "${d.title}" (${d.docType}, uploaded ${d.createdAt.toISOString().slice(0, 10)}): ${d.summary} ${d.explanation}`
      );
    } catch (err) {
      console.warn("Chat document context retrieval unavailable:", (err as Error).message);
    }

    let memorySnippets: string[] = [];
    if (queryEmbedding) {
      const memories = await retrieveRelevantMemories({ userId, queryEmbedding, limit: MAX_CONTEXT_MEMORIES });
      memorySnippets = memories.map((m) => `[Remembered] ${m.content}`);
    }
    const contextForModel = [...contextSnippets, ...memorySnippets];

    const history = (convo?.messages ?? [])
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    const replyText = await chatReply({ history, message: trimmedMessage, context: contextForModel });

    const now = new Date();
    const userMsg: ChatMessage = { role: "user", content: trimmedMessage, createdAt: now };
    const modelMsg: ChatMessage = {
      role: "model",
      content: replyText,
      createdAt: new Date(),
      contextDocumentIds: contextDocIds.length > 0 ? contextDocIds : undefined,
    };

    if (convo) {
      await collection.updateOne(
        { _id: convo._id },
        { $push: { messages: { $each: [userMsg, modelMsg] } }, $set: { updatedAt: now } }
      );
      convo.messages.push(userMsg, modelMsg);
      convo.updatedAt = now;
    } else {
      const title = trimmedMessage.length > 60 ? `${trimmedMessage.slice(0, 57)}...` : trimmedMessage;
      const doc: Conversation = {
        userId,
        title,
        messages: [userMsg, modelMsg],
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(doc);
      convo = { ...doc, _id: result.insertedId };
    }

    res.status(201).json(await toPublic(convo));

    // Fire-and-forget: distill any long-term "why" facts from this exchange so
    // a future conversation (possibly a brand new one) can recall them even
    // without this thread's history loaded.
    void saveMemoriesFromText({
      userId,
      sourceText: `User asked: ${trimmedMessage}\nAssistant replied: ${replyText}`,
      sourceType: "chat",
      sourceId: convo._id.toString(),
    });
  } catch (err) {
    console.error("Error sending chat message:", err);
    res.status(500).json({ error: "Failed to get a reply. Please try again." });
  }
});

// GET /api/chat/:id - fetch a single conversation with full message history
chatRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getConversationsCollection();
    const convo = await collection.findOne({ _id: new ObjectId(req.params.id), userId });
    if (!convo) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.json(await toPublic(convo as Conversation & { _id: ObjectId }));
  } catch (err) {
    console.error("Error fetching conversation:", err);
    res.status(500).json({ error: "Failed to load that conversation." });
  }
});

// DELETE /api/chat/:id
chatRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getConversationsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id), userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ error: "Failed to delete that conversation." });
  }
});
