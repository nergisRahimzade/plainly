import "dotenv/config";
import express from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`Plainly backend listening on http://localhost:${PORT}`);
});
