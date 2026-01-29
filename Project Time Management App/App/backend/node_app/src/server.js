import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import backlogRoutes from "./routes/backlog.js";
import { seedIfMissing } from "./seed.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ Allow local + GitHub Pages + optional env frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,      // e.g. https://ssethx24.github.io
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ssethx24.github.io",
].filter(Boolean);

// ✅ CORS MUST come BEFORE routes
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl/postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    // ✅ You are using Authorization Bearer token, not cookies
    credentials: false,

    // ✅ Important for preflight
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight handler (VERY IMPORTANT)
app.options("*", cors());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ✅ Routes
app.use("/api", authRoutes);
app.use("/api", backlogRoutes);

// Protected route test
app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedIfMissing();
    app.listen(PORT, () =>
      console.log(`🚀 Node API running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });