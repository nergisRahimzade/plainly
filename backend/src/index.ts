import "dotenv/config";
import express from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "15mb" }));

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head><title>Plainly backend</title></head>
      <body style="font-family: system-ui; padding: 2rem; color: #1e293b;">
        <h1 style="color: #7c3aed;">✅ Plainly backend is running</h1>
        <p>This is the API server, not the app itself. Open the web app at
          <a href="http://localhost:5173">localhost:5173</a> (or whichever port Vite printed).</p>
        <p>Health check: <a href="/api/health">/api/health</a></p>
      </body>
    </html>
  `);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

const server = app.listen(PORT, () => {
  console.log(`Plainly backend listening on http://localhost:${PORT}`);
});

// On Windows in particular, tsx watch's restart-on-save can race with the OS
// releasing the previous process's port, causing spurious EADDRINUSE crashes.
// Closing the server explicitly on shutdown signals releases the port promptly.
function shutdown() {
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
