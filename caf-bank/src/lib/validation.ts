import { z } from "zod";

export const registrationSchema = z.object({
  surname: z.string().trim().min(1), firstName: z.string().trim().min(1), lastName: z.string().trim().optional(),
  email: z.email().toLowerCase(), password: z.string().min(10), country: z.string().trim().min(1),
  homeAddress: z.string().trim().min(5), phoneNumber: z.string().trim().min(6),
});
export const transferSchema = z.object({ accountId: z.string(), beneficiaryId: z.string(), amount: z.string(), description: z.string().trim().min(1).max(140) });
export const pinSchema = z.string().regex(/^\d{6}$/, "PIN must contain six digits.");
