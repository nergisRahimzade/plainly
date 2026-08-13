# Plainly

**Upload a confusing screenshot — a bill, an error message, a legal document, an insurance
letter, a form, a website — and Plainly explains it in plain English**, with clear action
items, urgent red flags called out, and a searchable history that remembers how your
uploads connect to each other.

Built with React + TypeScript (web), Expo + React Native (mobile), Express, MongoDB Atlas
(with Atlas Vector Search), and the Gemini API.

## How it works

1. You upload or paste a screenshot (web) or take/pick a photo (mobile).
2. The backend sends the image to Gemini (`gemini-2.5-flash`) with a prompt asking it to
   classify the document, explain it simply, and pull out action items / red flags — while
   **never extracting or repeating account numbers, IDs, or other sensitive numbers**.
3. The backend embeds a short summary of the document with `gemini-embedding-001` and runs
   a MongoDB Atlas `$vectorSearch` against your previous uploads to find related ones.
4. If related uploads are found, a second lightweight Gemini call writes a couple of
   plain-English "this connects to your history" notes (e.g. "this is your 3rd bill from
   this provider — the amount went up $12").
5. Everything is stored in MongoDB Atlas and shown in a clean, color-coded card. You can
   also semantically search your whole history (e.g. "that error from my bank app").

Only the **derived text** (title, summary, explanation, action items, embeddings) is ever
stored — the uploaded image itself is not persisted, and the AI is explicitly instructed to
generalize rather than repeat any sensitive numbers it sees.

## Project structure

```
backend/    Express + TypeScript API, MongoDB Atlas + Gemini integration
frontend/   React + TypeScript + Vite web app (Tailwind CSS v4)
mobile/     Expo (React Native + TypeScript) app, same backend API
```

## Prerequisites

- Node.js 20+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (a free M0 cluster
  works, but Atlas Vector Search requires an Atlas-hosted cluster — a local MongoDB will
  not support `$vectorSearch`)
- A [Gemini API key](https://aistudio.google.com/apikey)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# then edit .env and fill in MONGODB_URI and GEMINI_API_KEY
```

Create the Atlas Vector Search index (run once):

```bash
npm run setup-index
```

This tries to create the index automatically via the MongoDB driver. If your Atlas tier
doesn't allow programmatic index creation, the script prints the exact JSON definition to
paste into **Atlas → your cluster → Search → Create Search Index → JSON Editor** instead.
Either way, the index needs a minute or two to finish building before semantic
search/"related uploads" will return results (uploads still work fine before that — they
just won't have `connections` yet).

Run the API:

```bash
npm run dev
```

The API listens on `http://localhost:8080` by default (`GET /api/health` to sanity check).

## 2. Web frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8080, adjust if needed
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## 3. Mobile app setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` so `EXPO_PUBLIC_API_BASE_URL` points at a host your phone/emulator can reach:

- iOS simulator: `http://localhost:8080` works
- Android emulator: `http://10.0.2.2:8080`
- Physical device with Expo Go: your computer's LAN IP, e.g. `http://192.168.1.23:8080`

Then start Expo:

```bash
npm run start
```

Scan the QR code with Expo Go, or press `a`/`i` for an emulator.

## MongoDB schema

```js
{
  _id: ObjectId,
  userId: String,          // anonymous device/browser id, no login required
  docType: String,         // "bill" | "legal" | "error" | "form" | "insurance" | "website" | "other"
  title: String,
  summary: String,
  explanation: String,
  actionItems: [String],
  redFlags: [String],
  keyEntities: [String],   // non-sensitive entities used for matching (e.g. company name)
  connections: [String],   // plain-English notes linking this doc to related past uploads
  relatedTo: [ObjectId],
  embedding: [Number],     // 768-dim, gemini-embedding-001
  createdAt: Date
}
```

Vector index (`documents_vector_index`) is on the `embedding` field (cosine similarity,
768 dimensions), filterable by `userId`.

## Privacy

- The prompt sent to Gemini explicitly forbids extracting or repeating account numbers,
  policy numbers, SSNs, card numbers, or similar identifiers — the model is told to refer
  to them generically instead.
- The raw uploaded image is never written to the database, only the derived explanation
  text and its embedding.
- There's no login: a random id is generated on-device and used to scope your history, so
  anyone can use the app immediately.
