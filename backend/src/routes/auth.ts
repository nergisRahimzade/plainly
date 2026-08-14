import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "../db.js";
import {
  comparePassword,
  findOrCreateOAuthUser,
  hashPassword,
  signToken,
  toUserPublic,
  verifyAppleIdentityToken,
  verifyGoogleIdToken,
  verifyToken,
} from "../auth.js";
import type { User } from "../types.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register - create an email/password account
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const users = await getUsersCollection();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ error: "An account with that email already exists." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const doc: User = {
      email: normalizedEmail,
      passwordHash,
      name: name?.trim() || undefined,
      provider: "password",
      createdAt: new Date(),
    };
    const result = await users.insertOne(doc);
    const user = { ...doc, _id: result.insertedId };

    res.status(201).json({ token: signToken(user._id.toString()), user: toUserPublic(user) });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Could not create your account. Please try again." });
  }
});

// POST /api/auth/login - email/password sign in
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email: email.trim().toLowerCase(), provider: "password" });
    if (!user || !user.passwordHash || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Incorrect email or password." });
      return;
    }

    res.json({ token: signToken(user._id.toString()), user: toUserPublic(user as User & { _id: ObjectId }) });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Could not sign you in. Please try again." });
  }
});

// POST /api/auth/google - sign in / sign up with a Google ID token
authRouter.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ error: "Missing idToken." });
      return;
    }
    const profile = await verifyGoogleIdToken(idToken);
    const user = await findOrCreateOAuthUser({ provider: "google", ...profile });
    res.json({ token: signToken(user._id.toString()), user: toUserPublic(user) });
  } catch (err) {
    console.error("Error with Google sign-in:", err);
    res.status(401).json({ error: err instanceof Error ? err.message : "Google sign-in failed." });
  }
});

// POST /api/auth/apple - sign in / sign up with an Apple identity token
authRouter.post("/apple", async (req: Request, res: Response) => {
  try {
    const { identityToken, name } = req.body as { identityToken?: string; name?: string };
    if (!identityToken) {
      res.status(400).json({ error: "Missing identityToken." });
      return;
    }
    const profile = await verifyAppleIdentityToken(identityToken);
    // Apple only sends the user's name on their very first sign-in, from the client.
    const user = await findOrCreateOAuthUser({ provider: "apple", ...profile, name });
    res.json({ token: signToken(user._id.toString()), user: toUserPublic(user) });
  } catch (err) {
    console.error("Error with Apple sign-in:", err);
    res.status(401).json({ error: err instanceof Error ? err.message : "Apple sign-in failed." });
  }
});

// GET /api/auth/me - fetch the current signed-in user from a bearer token
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.header("authorization") || req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      res.status(404).json({ error: "Account not found." });
      return;
    }
    res.json(toUserPublic(user as User & { _id: ObjectId }));
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ error: "Could not load your account." });
  }
});

// POST /api/auth/logout - stateless JWTs; the client just discards its token.
// Kept as a real endpoint (rather than handled purely client-side) so future
// versions can maintain a revocation list without changing the client contract.
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.status(204).send();
});
