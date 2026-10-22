import { NextResponse } from "next/server";
export class AppError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function respondError(error: unknown) {
  if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ error: "This record already exists." }, { status: 409 });
  if (error && typeof error === "object" && "name" in error && error.name === "CastError") return NextResponse.json({ error: "Invalid identifier." }, { status: 422 });
  console.error("Request failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
