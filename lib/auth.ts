import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export function getAuthUser(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded as { userId: string; email: string } | null;
}
