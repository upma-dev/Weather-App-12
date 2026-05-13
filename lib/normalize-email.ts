/** Match stored emails (Mongoose `lowercase` applies on save, not on queries). */
export function normalizeEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}
