import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import { seedIfMissing } from "./seed.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();

// Parse JSON bodies
app.use(express.json());

// ✅ CORS: allow React dev + deployed frontend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL, // for deployed frontend later
      "http://localhost:3000",
      "http://localhost:3001", // your current React dev server
    ].filter(Boolean),
    credentials: true,
  })
);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth routes (login)
app.use("/api", authRoutes);

// ✅ Protected test route (JWT required)
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const PORT = process.env.PORT || 5000;

// Connect DB → seed users → start server
connectDB()
  .then(async () => {
    await seedIfMissing();

    app.listen(PORT, () => {
      console.log(`🚀 Node API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
