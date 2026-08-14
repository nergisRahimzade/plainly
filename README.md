# Plainly

**Upload a confusing screenshot — a bill, an error message, a legal document, an insurance
letter, a form, a website — and Plainly explains it in plain English**, with clear action
items, urgent red flags called out, and a searchable history that remembers how your
uploads connect to each other.

```
backend/    Express + TypeScript API — MongoDB Atlas + Gemini integration
frontend/   React + TypeScript + Vite web app (Tailwind CSS v4)   ← primary client
mobile/     Expo (React Native + TypeScript) app, same backend API
```

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [How it works — the two core flows](#how-it-works--the-two-core-flows)
3. [Backend layer](#backend-layer)
4. [Frontend layer](#frontend-layer)
5. [AI layer (Gemini)](#ai-layer-gemini)
6. [MongoDB layer — and why MongoDB specifically](#mongodb-layer--and-why-mongodb-specifically)
7. [Privacy](#privacy)
8. [What makes Plainly different](#what-makes-plainly-different)
9. [Setup](#setup)

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Web frontend | React 19 + TypeScript + Vite, Tailwind CSS v4 | Fast dev loop, no server needed, small bundle |
| Mobile | Expo (React Native) + TypeScript | Single codebase for iOS/Android, shares API contract with web |
| Backend | Node.js + Express + TypeScript | Thin, well-understood REST layer; keeps API keys off the client |
| Database | MongoDB Atlas (incl. **Atlas Vector Search**) | One store for both structured document data *and* vector similarity search — see the dedicated section below |
| AI | Google Gemini API (`gemini-3.6-flash` vision, `gemini-3.5-flash-lite` text, `gemini-embedding-001` embeddings) | Multimodal (reads the screenshot directly), structured JSON output, fast + cheap tiers available for the lighter text-only calls |
| Markdown rendering | `react-markdown` / `react-native-markdown-display` | Gemini's explanation text uses light markdown (bullets, bold) which needs real rendering, not raw text |

---

## How it works — the two core flows

### Flow 1 — Uploading a new screenshot

```
User selects/pastes an image (web) or takes/picks a photo (mobile)
        │
        ▼
POST /api/documents  { imageBase64, mimeType }   (backend/src/routes/documents.ts)
        │
        ├─► 1. analyzeScreenshot() — sends the image to Gemini vision (gemini-3.6-flash)
        │      with a strict prompt: classify doc type, write a title/summary/plain-English
        │      explanation, extract action items + red flags, and NEVER copy sensitive
        │      numbers (account/policy/SSN/card numbers etc.)
        │
        ├─► 2. embedText() — embeds "title + summary + docType + keyEntities" into a
        │      768-dim vector via gemini-embedding-001
        │
        ├─► 3. $vectorSearch against this user's past documents (MongoDB Atlas), scoped by
        │      userId, to find the most similar previous uploads (score ≥ 0.82 threshold)
        │
        ├─► 4. If related docs were found: findConnections() makes a second, lightweight
        │      Gemini call (gemini-3.5-flash-lite, text-only — cheaper/faster than vision)
        │      to write 1-3 plain-English notes like "this is your 3rd bill from this
        │      provider — the amount went up $12"
        │
        └─► 5. The full document (analysis + embedding + connections + relatedTo ids) is
               inserted into MongoDB. The response (without the embedding) is sent back and
               rendered immediately as a DocumentCard.
```

The raw image is **never written to the database** — only Gemini's derived text output and
its embedding vector are persisted. See [Privacy](#privacy).

### Flow 2 — Searching past uploads

```
User types in the sidebar search box, pauses for 1 second (debounced)
        │
        ▼
GET /api/documents/search?q=...   (backend/src/routes/documents.ts)
        │
        ├─► embedText(q) — embeds the search query itself into the same 768-dim vector space
        │
        ├─► $vectorSearch against this user's documents (top 20 candidates), scoped by userId
        │
        └─► Results below a similarity threshold (0.80) are dropped — $vectorSearch always
               returns its nearest neighbors even when none are truly relevant, so this
               threshold is what makes "search for something irrelevant" correctly show
               "no matches" instead of random history items.
```

Because this is **semantic** (embedding-based) search rather than keyword matching, a query
like *"that error from my bank app"* can match a document whose title never contained those
exact words — it matches on meaning, not text overlap.

---

## Backend layer

`backend/src/index.ts` sets up Express: CORS (configurable allow-list via `CORS_ORIGIN`),
JSON body parsing (15 MB limit, to fit base64-encoded screenshots), a friendly root page and
health check, and the documents router. It also handles `SIGINT`/`SIGTERM` to close the
server's port promptly (this matters on Windows, where `tsx watch` restarts can otherwise
race the OS and throw spurious `EADDRINUSE` errors).

All document logic lives in `backend/src/routes/documents.ts`, mounted at `/api/documents`.
Every route (except the two below) requires an `x-user-id` header — there's no login system,
so the frontend/mobile app generates a random id on first launch and sends it on every
request to scope a user's history to just their own uploads.

| Method & path | Purpose | Why it exists |
|---|---|---|
| `GET /` | Human-friendly landing page confirming the API is up | So opening `localhost:8080` directly in a browser doesn't look like an error |
| `GET /api/health` | Trivial `{ status: "ok" }` | Manual sanity check / future uptime monitoring |
| `POST /api/documents` | Upload + analyze a screenshot (Flow 1 above) | The core feature — one endpoint owns the whole vision→embed→search→save pipeline server-side so the Gemini API key never has to reach the browser or phone |
| `GET /api/documents` | List a user's history, newest first (max 100) | Powers the sidebar; deliberately lightweight (no related-doc resolution) since it can return many rows |
| `GET /api/documents/search?q=` | Semantic search over history (Flow 2 above) | Needs its own endpoint because it runs a *query-time* embedding + vector search, a different operation from a plain list |
| `GET /api/documents/:id` | Fetch one full document, with `relatedTo` ids resolved into titles/types/dates | The sidebar list only carries summary fields — opening a document needs the richer, resolved view |
| `DELETE /api/documents/:id` | Delete a document | Direct requirement from the privacy goals: since Plainly retains derived data indefinitely, users need a way to remove any of it |

All five document endpoints have been manually verified end-to-end against a live Atlas
cluster and Gemini key (upload → list → fetch → semantic search → delete) and are working.

### Accounts (`/api/auth`)

Login is optional — every route above still accepts the legacy anonymous `x-user-id` header,
so guest mode keeps working with zero changes. Signing in just gives a user a stable id
(their Mongo `_id`) instead of a random per-install one, so their history follows them across
devices/reinstalls. See `backend/src/auth.ts` and `backend/src/routes/auth.ts`.

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` | Create an email/password account |
| `POST /api/auth/login` | Email/password sign in |
| `POST /api/auth/google` | Verify a Google ID token, sign in or create an account |
| `POST /api/auth/apple` | Verify an Apple identity token, sign in or create an account |
| `GET /api/auth/me` | Fetch the signed-in user from a bearer token |
| `POST /api/auth/logout` | Stateless (the client just discards its token) |

Every other route resolves the caller's id via `resolveUserId()`: an `Authorization: Bearer
<jwt>` takes priority when present, falling back to `x-user-id` for guests.

### Chat (`/api/chat`)

A follow-up chat, separate from the one-shot upload analysis, so users can ask questions like
*"why did I need to email the school's financial aid office?"* and get an answer grounded in
their own document history. See `backend/src/routes/chat.ts` and `chatReply()` in `gemini.ts`.

| Method & path | Purpose |
|---|---|
| `GET /api/chat` | List the user's conversations (title, last message, updated time) |
| `GET /api/chat/:id` | Fetch one conversation's full message history |
| `POST /api/chat` | Send a message (creates a new conversation if no `conversationId` is given) |
| `DELETE /api/chat/:id` | Delete a conversation |

Each `POST /api/chat` embeds the incoming message and runs the same `$vectorSearch` used for
document search, scoped to that user, to pull in relevant past documents as grounding context
before asking Gemini to reply — so answers can reference specifics from something the user
uploaded weeks ago instead of only the current conversation.

### Long-term memory (`/api/memories`)

A regular chat's "memory" is just whatever messages are in that one thread — ask a brand new
conversation *"why did I need to email the school's financial aid office?"* and it has nothing
to go on. Plainly adds a second, cross-conversation memory: after every document upload and
every chat reply, `extractMemories()` (in `gemini.ts`) reads what just happened and pulls out
any short, standalone facts worth remembering long-term — especially the *reason* behind an
action ("the user's FAFSA was flagged for verification, which is why they needed to email
financial aid"). Each fact is embedded and stored in its own `memories` collection, scoped to
the user, with its own Atlas Vector Search index (`memories_vector_index`, created by the same
`npm run setup-index` script as the documents index).

When answering a new chat message, `POST /api/chat` vector-searches *both* `documents` and
`memories` for that user and folds whatever's relevant into the prompt as "Relevant context
from your history" — so the assistant can answer using something extracted from a document
uploaded weeks ago, or a completely different conversation, without either one being loaded
into the current thread. Extraction runs **after** the response is already sent (see
`memory.ts`), so it never adds latency to an upload or a chat reply.

`GET /api/memories` / `DELETE /api/memories/:id` exist so users can see — and delete — exactly
what's been remembered about them, in keeping with the app's privacy-first stance. In the
mobile app this is the "What Plainly remembers" screen, linked from the sidebar.

---

## Frontend layer

The web app (`frontend/`) is a single-page React app with no router — it's simple enough
that `App.tsx` just toggles between two views: the upload screen and the selected document.

- **`lib/userId.ts`** — generates a random id on first visit and persists it in
  `localStorage`, so the same browser always sees its own history without any account system.
- **`lib/api.ts`** — thin fetch wrapper that attaches the `x-user-id` header to every request
  and normalizes error messages from the backend's `{ error: string }` responses.
- **`lib/docTypeMeta.ts`** — maps each `docType` (`bill`, `legal`, `error`, `form`,
  `insurance`, `website`, `other`) to a label, icon, and color, so all the doc-type-specific
  styling lives in one place instead of scattered `if` statements.
- **`components/UploadZone.tsx`** — drag-and-drop, click-to-browse, and clipboard-paste image
  upload, with a loading state while the backend is analyzing.
- **`components/DocumentCard.tsx`** — renders the analyzed result: markdown explanation, a
  bold red-flags callout, a checkable action-item list (checked items get struck through),
  a bold "connected to your history" callout, and buttons to jump to related documents.
- **`components/HistorySidebar.tsx`** — branding, "new screenshot" button, and the debounced
  search box (fires 1 second after you stop typing, or instantly on Enter) plus the scrollable
  history list, which shows "no matches" for irrelevant searches instead of the full history.
- **`App.tsx`** — owns all state (document list, selected document, search mode, errors,
  mobile sidebar open/closed) and wires the components to `lib/api.ts`.

The mobile app (`mobile/`) mirrors this structure (`types.ts`, `lib/userId.ts` using
`AsyncStorage` instead of `localStorage`, `lib/api.ts`, `lib/docTypeMeta.ts`) against the
exact same backend API, so both clients stay in sync with zero backend changes. It now also
shares the web app's design system (`mobile/src/theme.ts`) and adds screens the web app
doesn't have yet: `SignInScreen`/`SignUpScreen` (email/password + Google/Apple), and
`ChatScreen` — a dedicated chat page (reachable from Home's header) with its own
conversation-history sidebar (`ChatSidebar.tsx`) and message bubbles (`ChatBubble.tsx`) that
surface which past documents were used as context for a given reply.

---

## AI layer (Gemini)

All Gemini calls live in `backend/src/gemini.ts`, so the API key and prompt engineering never
leave the server.

- **`analyzeScreenshot()`** — the vision call (`gemini-3.6-flash`). Takes the base64 image
  inline, forces structured JSON output via `responseSchema` (so the backend never has to
  parse free-form text), and sets `thinkingConfig.thinkingLevel = MINIMAL` — this is a
  straightforward classify-and-summarize task that doesn't benefit from extended reasoning,
  and skipping it cuts response time noticeably.
- **`embedText()`** — turns text into a 768-dimension vector (`gemini-embedding-001`,
  `SEMANTIC_SIMILARITY` task type) used both when storing a new document and when running a
  search query. Using the *same* embedding model/dimensionality for both is what makes
  `$vectorSearch` comparisons meaningful.
- **`findConnections()`** — a second, separate call using `gemini-3.5-flash-lite` (a smaller,
  faster, text-only model) rather than the vision model, since by this point the image itself
  is irrelevant — only the already-extracted summaries of the new and related documents are
  needed. Using the lighter model here was a deliberate speed optimization.
- **The privacy rule** is a shared prompt fragment (`PRIVACY_RULE`) injected into *both* the
  vision and connections prompts, explicitly forbidding the model from copying account
  numbers, policy numbers, SSNs, card numbers, or similar identifiers into any output field.

---

## MongoDB layer — and why MongoDB specifically

### What MongoDB stores

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

A vector index (`documents_vector_index`, cosine similarity, 768 dimensions, filterable by
`userId`) sits on the `embedding` field — created once via `npm run setup-index`
(`backend/src/scripts/setupVectorIndex.ts`).

### Why MongoDB is used

Plainly needs two very different kinds of queries against the *same* collection of
documents:

1. **Regular document reads** — "give me this user's history sorted by date," "give me this
   one document by id." Simple, structured, exactly what any document/NoSQL database is
   built for. Each Plainly document is naturally a flexible, self-contained JSON-like object
   (varying array lengths for action items/red flags/connections, optional fields) — a good
   fit for a schemaless document model rather than a rigid relational schema.
2. **Semantic similarity search** — "find the 3 previous uploads most similar in *meaning* to
   this new one," and "find past uploads most similar in meaning to this search query." This
   requires a vector index and nearest-neighbor search over embeddings, not `WHERE` clauses.

### Why it's crucial to the project

This second capability is not a nice-to-have — it's the mechanism behind two of Plainly's
headline features:

- **"Connected to your history"** (e.g. spotting that this is your third bill from the same
  provider and the amount went up) is only possible because the backend can efficiently find
  semantically related past documents *at upload time*, scoped to just that user, out of
  potentially thousands of stored documents.
- **Semantic search** ("that error from my bank app") only works because the search query and
  every stored document live in the same vector space and can be compared directly with
  `$vectorSearch` — plain text/regex search would miss anything that doesn't share exact
  keywords.

Doing both of those *and* normal CRUD in one database, one connection pool, and one query
language is what MongoDB Atlas Vector Search specifically enables.

### Why not something else

- **A relational database (Postgres, MySQL, etc.)** would handle the CRUD half fine, but
  vector similarity search would need a bolt-on extension (e.g. `pgvector`) or a second,
  separate system — meaning two databases to run, two connections to manage, and manual
  joining of "structured record" results with "vector match" results in application code.
- **A dedicated vector database (Pinecone, Weaviate, Qdrant, etc.)** would handle the
  embedding search well, but then the actual document content (title, explanation, action
  items, etc.) would need to live somewhere else entirely — every read of a document would
  require a lookup in the vector store *and* a lookup in a second database, and keeping them
  in sync on every insert/delete is an entirely avoidable class of bugs.
- **MongoDB Atlas Vector Search** stores the document and its embedding as the same object
  and lets a single `$vectorSearch` aggregation stage filter by a regular field (`userId`)
  and return regular document fields in the same query — no second database, no manual
  syncing, no join logic. For a project of this scope, that reduction in moving parts
  outweighs anything a specialized vector database would offer.

Note: `$vectorSearch` specifically requires an **Atlas-hosted** cluster (not a local/
self-hosted `mongod`) — this is called out in [Setup](#setup) since it affects how you
provision your database.

---

## Privacy

- The prompt sent to Gemini explicitly forbids extracting or repeating account numbers,
  policy numbers, SSNs, card numbers, or similar identifiers — the model is told to refer
  to them generically instead.
- The raw uploaded image is never written to the database, only the derived explanation
  text and its embedding.
- There's no login: a random id is generated on-device and used to scope your history, so
  anyone can use the app immediately.
- Any stored document can be permanently deleted at any time via the trash icon in history.

---

## What makes Plainly different

Most "explain this screenshot/document" tools are stateless — you upload one image, get one
explanation, and that's the end of the interaction. Plainly is built around the idea that
confusing documents rarely arrive in isolation (bills recur monthly, legal notices follow up
on earlier ones, forms reference previous submissions), so a single-shot explainer is missing
half the picture. Specifically, Plainly adds three things that a plain "vision model + prompt"
wrapper doesn't:

1. **Memory that's actually used, not just stored.** Every upload is compared against your
   *own* history via vector search at upload time, and if something relevant is found, the AI
   is asked a second, targeted question — "how does this relate?" — producing insights like
   "this is your 3rd bill from this provider and the amount increased" that a one-off analysis
   could never produce.
2. **Semantic history search**, not a keyword filter. You can search for what a document
   *meant*, not what words it literally contained — useful for exactly the kind of documents
   Plainly targets, where you often remember the gist ("that scary letter from the insurance
   company") but not the exact wording.
3. **Privacy as a first-class design constraint, not an afterthought.** The extraction prompt
   itself is written to refuse sensitive identifiers, the raw image is discarded after
   analysis, there's no account system tying uploads to a real identity, and every document
   is user-deletable — rather than bolting privacy controls onto a system that stores
   everything by default.

The result is closer to a lightweight, persistent "personal document assistant" than a
one-off OCR/summarization demo.

---

## Setup

### Prerequisites

- Node.js 20+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (a free M0 cluster
  works, but Atlas Vector Search requires an Atlas-hosted cluster — a local MongoDB will
  not support `$vectorSearch`)
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# then edit .env and fill in MONGODB_URI and GEMINI_API_KEY
```

Accounts (email/password, Google, Apple) need a couple more variables in that same
`.env`:

- `JWT_SECRET` — any long random string, used to sign session tokens.
- `GOOGLE_CLIENT_IDS` — comma-separated OAuth client ID(s) from
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials), one per
  platform (Web/iOS/Android) you want "Continue with Google" to work on.
- `APPLE_CLIENT_IDS` — your app's bundle id / Services ID(s) from the
  [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list/serviceId),
  comma-separated.

Leaving `GOOGLE_CLIENT_IDS`/`APPLE_CLIENT_IDS` blank simply disables those sign-in
options server-side (email/password accounts and guest/anonymous mode work regardless).

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

### 2. Web frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8080, adjust if needed
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

### 3. Mobile app setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` so `EXPO_PUBLIC_API_BASE_URL` points at a host your phone/emulator can reach:

- iOS simulator: `http://localhost:8080` works
- Android emulator: `http://10.0.2.2:8080`
- Physical device with Expo Go: your computer's LAN IP, e.g. `http://192.168.1.23:8080`

To enable "Continue with Google" in the mobile app, also set
`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` /
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (see `.env.example`) — note this requires a custom
dev/standalone build and will not complete inside plain Expo Go. "Continue with Apple"
works out of the box on iOS devices/simulators once the app is built with the
`expo-apple-authentication` plugin (already configured in `app.json`). Email/password
sign-in and guest mode work everywhere with no extra setup.

Then start Expo:

```bash
npm run start
```

Scan the QR code with Expo Go, or press `a`/`i` for an emulator.
