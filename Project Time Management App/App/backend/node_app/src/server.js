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
app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ssethx24.github.io",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: false, // JWT Authorization header (not cookies)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ CORS before routes
app.use(cors(corsOptions));

// ✅ Express 5-safe preflight
app.options(/.*/, cors(corsOptions));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api", authRoutes);
app.use("/api", backlogRoutes);

app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedIfMissing();
    app.listen(PORT, () => console.log(`🚀 Node API running on ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });