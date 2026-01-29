import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import { seedIfMissing } from "./seed.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Allow local + GitHub Pages + optional env frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,        // optional (if you set it on Render)
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ssethx24.github.io",    // ✅ GitHub Pages domain
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl/postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Auth routes
app.use("/api", authRoutes);

// Protected route test
app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await seedIfMissing();
    app.listen(PORT, () => console.log(`🚀 Node API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
