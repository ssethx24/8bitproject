import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },

    name: { type: String, required: true }, // "Sprint 1", "Sprint 2", "Sprint 3"
    startDate: { type: String, default: "" }, // store YYYY-MM-DD as string
    endDate: { type: String, default: "" },
    progress: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
  },
  { timestamps: true }
);

// prevent duplicates per project
sprintSchema.index({ projectId: 1, name: 1 }, { unique: true });

export default mongoose.model("Sprint", sprintSchema);