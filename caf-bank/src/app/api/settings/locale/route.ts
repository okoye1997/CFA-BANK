import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { isAppLocale } from "@/i18n/locales";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const locale = (body as { locale?: unknown })?.locale;
  if (!isAppLocale(locale)) return NextResponse.json({ error: "Unsupported language." }, { status: 422 });
  const session = await getServerSession(authOptions);
  if (session?.user) {
    await connectMongo();
    await User.updateOne({ _id: (session.user as typeof session.user & { id: string }).id }, { $set: { preferredLocale: locale } });
  }
  const response = NextResponse.json({ locale });
  response.cookies.set("caf_locale", locale, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
