import express from "express";
import BacklogItem from "../models/BacklogItem.js";
import { requireAuth } from "../middleware/auth.js";
import { getDefaultProjectId } from "../defaultProject.js";

const router = express.Router();

// ✅ Product Backlog (sprintName = null)
router.get("/backlog", requireAuth, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();
    const items = await BacklogItem.find({ projectId, sprintName: null }).sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    console.error("GET /backlog error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/backlog", requireAuth, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();

    const { clientId, title, priority, developer } = req.body;
    if (!clientId || !title) {
      return res.status(400).json({ message: "clientId and title required" });
    }

    const item = await BacklogItem.create({
      projectId,
      clientId,
      title,
      priority: priority || "Medium",
      developer: developer || "Daksh",
      status: "Awaiting Action",
      completed: false,
      completedInSprint: null,

      // ✅ NEW fields default (safe)
      estimatedTime: "",
      completionTime: "",
      completionDate: "",

      sprintName: null,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("POST /backlog error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/backlog/:clientId", requireAuth, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();

    const item = await BacklogItem.findOne({ projectId, clientId: req.params.clientId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    // ✅ Allow updates to new fields too
    const allowed = [
      "title",
      "priority",
      "developer",
      "status",
      "completed",
      "completedInSprint",
      "sprintName",

      // ✅ NEW
      "estimatedTime",
      "completionTime",
      "completionDate",
    ];

    for (const k of allowed) {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    }

    // ✅ Optional: keep completed flag consistent with status
    if (req.body.status !== undefined) {
      item.completed = req.body.status === "Completed";
      if (req.body.status !== "Completed") {
        // if task becomes not completed, wipe completion metadata
        item.completionTime = "";
        item.completionDate = "";
      }
    }

    await item.save();
    res.json(item);
  } catch (err) {
    console.error("PUT /backlog/:clientId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/backlog/:clientId", requireAuth, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();
    const deleted = await BacklogItem.findOneAndDelete({ projectId, clientId: req.params.clientId });
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /backlog/:clientId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Sprint Backlog (filter by sprintName)
router.get("/sprints/:sprintName/items", requireAuth, async (req, res) => {
  try {
    const projectId = await getDefaultProjectId();

    const items = await BacklogItem.find({
      projectId,
      sprintName: req.params.sprintName,
    }).sort({ createdAt: 1 });

    res.json(items);
  } catch (err) {
    console.error("GET /sprints/:sprintName/items error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;