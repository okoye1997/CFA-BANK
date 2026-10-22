import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { respondError } from "@/lib/http";
export async function GET() { try { const user = await currentUser(); return NextResponse.json({ id: String(user._id), surname: user.surname, firstName: user.firstName, lastName: user.lastName, email: user.email, country: user.country, homeAddress: user.homeAddress, phoneNumber: user.phoneNumber, role: user.role, preferredLocale: user.preferredLocale, emailVerified: user.emailVerified, identityVerified: user.identityVerified, verificationStatus: user.verificationStatus, hasTransactionPin: Boolean(user.transactionPinHash) }); } catch (error) { return respondError(error); } }
