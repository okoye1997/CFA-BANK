import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { Verification } from "@/lib/models";
import { respondError, AppError } from "@/lib/http";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const verification = await Verification.findById(id);
    if (!verification) throw new AppError("Document not found.", 404);
    const filePath = path.resolve(verification.documentPath);
    const privateDir = path.resolve(process.cwd(), ".private", "identity") + path.sep;
    if (!filePath.startsWith(privateDir)) throw new AppError("Document not found.", 404);
    const contentType = filePath.endsWith(".pdf") ? "application/pdf" : filePath.endsWith(".png") ? "image/png" : "image/jpeg";
    return new NextResponse(await readFile(filePath), { headers: { "Content-Type": contentType, "Content-Disposition": `inline; filename="document.${filePath.split(".").pop()}"`, "Cache-Control": "private, no-store" } });
  } catch (error) { return respondError(error); }
}
