import bcrypt from "bcryptjs";
import User from "./models/User.js";

async function upsertUser({ email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) return { email, existed: true };

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash, role });
  return { email, existed: false };
}

export async function seedIfMissing() {
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
}
