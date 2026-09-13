# Plainly

Upload a screenshot. Gemini explains it in plain English. MongoDB Atlas remembers how your uploads connect.

```
backend/    Express API — Gemini + Atlas $vectorSearch
frontend/   React + Vite web client
mobile/     Expo client, same API
```

## Read the code in this order

1. `backend/src/types.ts` — the document shape
2. `backend/src/db.ts` — Atlas connection
3. `backend/src/gemini.ts` — vision, embeddings, "how does this relate?"
4. `backend/src/documents.ts` — upload → embed → `$vectorSearch` → save
5. `backend/src/index.ts` — Express
6. `frontend/src/api.ts` then `frontend/src/App.tsx` — web client
7. `mobile/` mirrors the web screens against the same API

The image is sent to Gemini and discarded. Only derived text + a 768-dim embedding are stored. History is scoped by an anonymous `x-user-id` header (no login).

## Setup

Needs Node 20+, a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (`$vectorSearch` is Atlas-only), and a [Gemini API key](https://aistudio.google.com/apikey).

```bash
cd backend && npm install && cp .env.example .env
# fill in MONGODB_URI and GEMINI_API_KEY
npm run setup-index   # once — creates the vector index (or prints JSON to paste into Atlas)
npm run dev           # http://localhost:8080

cd ../frontend && npm install && cp .env.example .env && npm run dev
cd ../mobile && npm install && cp .env.example .env && npm run start
```

Mobile `.env`: iOS simulator can use `http://localhost:8080`; Android emulator `http://10.0.2.2:8080`; a physical device needs your LAN IP.
