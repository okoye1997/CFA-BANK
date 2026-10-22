export function mergeMessages(base: Record<string, unknown>, translated: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key,
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? mergeMessages(value as Record<string, unknown>, translated[key] && typeof translated[key] === "object" && !Array.isArray(translated[key]) ? translated[key] as Record<string, unknown> : {})
      : typeof translated[key] === "string" && translated[key] ? translated[key] : value
  ]));
}
