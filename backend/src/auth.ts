import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import type { Request } from "express";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "./db.js";
import type { User, UserPublic } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable. Copy .env.example to .env and fill it in.");
}

// Accept multiple client IDs (web / iOS / Android all get separate OAuth client IDs
// from Google Cloud Console, but they can all sign in to the same backend).
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const APPLE_CLIENT_IDS = (process.env.APPLE_CLIENT_IDS || process.env.APPLE_CLIENT_ID || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const googleClient = new OAuth2Client();

const TOKEN_TTL = "30d";

export function toUserPublic(user: User & { _id: ObjectId }): UserPublic {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
  };
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET!, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Resolves the authenticated user id for a request:
 * - `Authorization: Bearer <jwt>` — for a signed-in account (works across devices/reinstalls).
 * - `x-user-id: <uuid>` — legacy/guest mode, a random id generated and stored on-device.
 * Returns null (and does not respond) if neither is present/valid, so callers can decide
 * how to react (most document/chat routes still require *some* id, guest or authenticated).
 */
export function resolveUserId(req: Request): string | null {
  const authHeader = req.header("authorization") || req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const decoded = verifyToken(token);
    if (decoded) return decoded.userId;
  }
  const legacy = (req.header("x-user-id") || req.query.userId || req.body?.userId) as string | undefined;
  return legacy && typeof legacy === "string" ? legacy : null;
}

export interface GoogleProfile {
  providerId: string;
  email: string | null;
  name?: string;
  avatarUrl?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (GOOGLE_CLIENT_IDS.length === 0) {
    throw new Error(
      "Google sign-in is not configured on the server. Set GOOGLE_CLIENT_IDS in the backend .env."
    );
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new Error("Invalid Google token.");
  }
  return {
    providerId: payload.sub,
    email: payload.email ?? null,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}

export interface AppleProfile {
  providerId: string;
  email: string | null;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleProfile> {
  if (APPLE_CLIENT_IDS.length === 0) {
    throw new Error(
      "Apple sign-in is not configured on the server. Set APPLE_CLIENT_IDS in the backend .env."
    );
  }
  const payload = await appleSignin.verifyIdToken(identityToken, {
    audience: APPLE_CLIENT_IDS,
    ignoreExpiration: false,
  });
  return {
    providerId: payload.sub,
    email: payload.email ?? null,
  };
}

/** Finds a user by provider identity, or creates one if this is their first sign-in. */
export async function findOrCreateOAuthUser(params: {
  provider: "google" | "apple";
  providerId: string;
  email: string | null;
  name?: string;
  avatarUrl?: string;
}): Promise<User & { _id: ObjectId }> {
  const users = await getUsersCollection();
  const existing = await users.findOne({ provider: params.provider, providerId: params.providerId });
  if (existing) return existing as User & { _id: ObjectId };

  const now = new Date();
  const doc: User = {
    email: params.email,
    name: params.name,
    avatarUrl: params.avatarUrl,
    provider: params.provider,
    providerId: params.providerId,
    createdAt: now,
  };
  const result = await users.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}
