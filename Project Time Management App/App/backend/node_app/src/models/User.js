import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "scrum-master", "team-member"],
      default: "team-member",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
