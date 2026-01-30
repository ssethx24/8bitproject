import express from "express";
import Sprint from "../models/Sprint.js";
import { requireAuth } from "../middleware/auth.js";
import { getDefaultProjectId } from "../defaultProject.js";

const router = express.Router();

const allowedNames = ["Sprint 1", "Sprint 2", "Sprint 3"];

// ✅ GET all sprints
router.get("/sprints", requireAuth, async (_req, res) => {
  const projectId = await getDefaultProjectId();
  const sprints = await Sprint.find({ projectId }).sort({ name: 1 });
  res.json(sprints);
});

// ✅ GET one sprint by name
router.get("/sprints/:name", requireAuth, async (req, res) => {
  const projectId = await getDefaultProjectId();
  const sprint = await Sprint.findOne({ projectId, name: req.params.name });
  if (!sprint) return res.status(404).json({ message: "Sprint not found" });
  res.json(sprint);
});

// ✅ UPSERT sprint (create if missing, else update)
router.put("/sprints/:name", requireAuth, async (req, res) => {
  const projectId = await getDefaultProjectId();
  const name = req.params.name;

  if (!allowedNames.includes(name)) {
    return res.status(400).json({ message: "Invalid sprint name" });
  }

  const allowed = ["startDate", "endDate", "progress"];
  const update = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

  // validate dates if both provided
  if (update.startDate && update.endDate) {
    if (new Date(update.startDate) > new Date(update.endDate)) {
      return res.status(400).json({ message: "startDate cannot be after endDate" });
    }
  }

  const sprint = await Sprint.findOneAndUpdate(
    { projectId, name },
    { $set: update, $setOnInsert: { projectId, name } },
    { new: true, upsert: true }
  );

  res.json(sprint);
});

// ✅ DELETE sprint (optional — you can disable this if you want)
router.delete("/sprints/:name", requireAuth, async (req, res) => {
  const projectId = await getDefaultProjectId();
  const deleted = await Sprint.findOneAndDelete({ projectId, name: req.params.name });
  if (!deleted) return res.status(404).json({ message: "Sprint not found" });
  res.json({ message: "Deleted" });
});

export default router;