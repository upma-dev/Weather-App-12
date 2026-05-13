import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export default function Home() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) redirect("/dashboard");
  }

  redirect("/login");
}
