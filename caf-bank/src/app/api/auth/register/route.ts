import { NextResponse } from "next/server";
import { register } from "@/services/auth.service";
import { respondError } from "@/lib/http";
import { cookies } from "next/headers";
import { isAppLocale, negotiateLocale } from "@/i18n/locales";
export async function POST(request: Request) { try { const saved = (await cookies()).get("caf_locale")?.value; const locale = isAppLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language")); return NextResponse.json(await register(await request.json(), locale), { status: 201 }); } catch (error) { return respondError(error); } }
