import "next-auth";
declare module "next-auth" { interface Session { user: { id: string; name?: string | null; email?: string | null; role: "CUSTOMER" | "ADMIN"; emailVerified: boolean; identityVerified: boolean } } }
declare module "next-auth/jwt" { interface JWT { id?: string; role?: "CUSTOMER" | "ADMIN"; emailVerified?: boolean; identityVerified?: boolean } }
