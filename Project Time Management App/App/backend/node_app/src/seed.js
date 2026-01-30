// src/seed.js
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Sprint from "./models/Sprint.js";
import { getDefaultProjectId } from "./defaultProject.js";

async function upsertUser({ email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return { email, existed: true };

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, role });
  return { email, existed: false };
}

async function upsertSprint({ projectId, name }) {
  // Creates sprint only if it doesn't exist (no duplicates)
  const sprint = await Sprint.findOneAndUpdate(
    { projectId, name },
    {
      $setOnInsert: {
        projectId,
        name,
        startDate: "",
        endDate: "",
        progress: "Not Started",
      },
    },
    { upsert: true, new: true }
  );

  return sprint;
}

export async function seedIfMissing() {
  /* ======================
     1) Seed USERS
     ====================== */
  const usersToSeed = [
    { email: "scrummaster@gmail.com", password: "1234", role: "scrum-master" },
    { email: "team@gmail.com", password: "4321", role: "team-member" },
  ];

  for (const u of usersToSeed) {
    const res = await upsertUser(u);
    console.log(
      res.existed
        ? `ℹ️ User exists: ${u.email}`
        : `✅ Seeded user: ${u.email} (${u.role})`
    );
  }

  /* ======================
     2) Seed SPRINTS
     ====================== */
  const projectId = await getDefaultProjectId();

  const sprintNames = ["Sprint 1", "Sprint 2", "Sprint 3"];

  for (const name of sprintNames) {
    const sprint = await upsertSprint({ projectId, name });
    console.log(`🏁 Sprint ready: ${sprint.name}`);
  }
}