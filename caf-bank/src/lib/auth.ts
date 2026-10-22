import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { connectMongo } from "./mongodb";
import { User } from "./models";
import { audit } from "@/services/audit.service";
import { AppError } from "./http";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/auth" },
  providers: [CredentialsProvider({ name: "Email and password", credentials: { email: {}, password: {} }, async authorize(credentials) {
    await connectMongo();
    const email = String(credentials?.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(String(credentials?.password || ""), user.passwordHash)) {
      await audit("FAILED_AUTHENTICATION", user ? String(user._id) : undefined);
      return null;
    }
    await audit("LOGIN", String(user._id));
    return { id: String(user._id), name: user.firstName, email: user.email, role: user.role, emailVerified: user.emailVerified, identityVerified: user.identityVerified } as never;
  } })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      if (token.id) {
        await connectMongo();
        const fresh = await User.findById(token.id).select("role emailVerified identityVerified firstName");
        if (fresh) { token.role = fresh.role; token.emailVerified = fresh.emailVerified; token.identityVerified = fresh.identityVerified; token.name = fresh.firstName; }
      }
      return token;
    },
    async session({ session, token }) {
      Object.assign(session.user, { id: token.id, role: token.role, emailVerified: token.emailVerified, identityVerified: token.identityVerified });
      return session;
    },
  },
};
export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new AppError("Please sign in.", 401);
  await connectMongo();
  const user = await User.findById((session.user as typeof session.user & { id: string }).id);
  if (!user) throw new AppError("Please sign in.", 401);
  return user;
}
export async function requireAdmin() { const user = await currentUser(); if (user.role !== "ADMIN") throw new AppError("Access denied.", 403); return user; }
