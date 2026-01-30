import mongoose from "mongoose";

const backlogItemSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    // Keep your existing fields so frontend stays same
    clientId: { type: String, required: true }, // store your uuidv4() here
    title: { type: String, required: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    developer: { type: String, default: "Daksh" },
    status: {
      type: String,
      enum: ["Awaiting Action", "Under Development", "Completed"],
      default: "Awaiting Action",
    },
    completed: { type: Boolean, default: false },
    completedInSprint: { type: String, default: null },

    // ✅ NEW: time tracking fields (persist sprint table inputs)
    estimatedTime: { type: String, default: "" },
    completionTime: { type: String, default: "" },
    completionDate: { type: String, default: "" },

    // Sprint support
    sprintName: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("BacklogItem", backlogItemSchema);