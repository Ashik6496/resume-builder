import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null });
  return Response.json({ user: { email: session.email } });
}
