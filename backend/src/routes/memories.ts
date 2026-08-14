import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getMemoriesCollection } from "../db.js";
import { resolveUserId } from "../auth.js";
import { toMemoryPublic } from "../memory.js";
import type { Memory } from "../types.js";

export const memoriesRouter = Router();

function requireUserId(req: Request, res: Response): string | null {
  const userId = resolveUserId(req);
  if (!userId) {
    res.status(400).json({ error: "Missing x-user-id header or Authorization bearer token." });
    return null;
  }
  return userId;
}

// GET /api/memories - lists what Plainly remembers about this user, newest first.
// Exists mainly for transparency: users can see (and delete) anything Plainly has
// inferred and stored about them, matching the app's privacy-first stance.
memoriesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getMemoriesCollection();
    const memories = await collection.find({ userId }).sort({ createdAt: -1 }).limit(200).toArray();
    res.json(memories.map((m) => toMemoryPublic(m as Memory & { _id: ObjectId })));
  } catch (err) {
    console.error("Error listing memories:", err);
    res.status(500).json({ error: "Failed to load memories." });
  }
});

// DELETE /api/memories/:id
memoriesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const collection = await getMemoriesCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id), userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Memory not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting memory:", err);
    res.status(500).json({ error: "Failed to delete that memory." });
  }
});
