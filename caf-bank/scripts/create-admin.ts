import bcrypt from "bcryptjs";
import { connectMongo } from "../src/lib/mongodb";
import { User } from "../src/lib/models";

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters.");
  await connectMongo();
  if (await User.exists({ email })) throw new Error("Email address is already registered.");
  await User.create({ surname: "Administrator", firstName: "CAF", email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN", emailVerified: true, identityVerified: true, verificationStatus: "APPROVED" });
  console.log("Admin account created.");
  process.exit(0);
}
main().catch(error => { console.error(error.message); process.exit(1); });
