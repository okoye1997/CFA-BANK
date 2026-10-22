import { AppError } from "./http";

export const applicationName = process.env.APP_NAME?.trim() || "CAF Bank";

export function applicationUrl() {
  const configured = process.env.APP_URL || process.env.AUTH_URL;
  if (!configured) throw new AppError("Application URL is not configured.", 503);
  const url = new URL(configured);
  if (!(["https:", "http:"].includes(url.protocol))) throw new AppError("Application URL is invalid.", 503);
  return url;
}
