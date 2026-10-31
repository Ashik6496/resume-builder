import { hash } from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const users = (await getDatabase()).collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    const result = await users.insertOne({
      email,
      passwordHash: await hash(password, 12),
      createdAt: new Date(),
    });
    await createSession(result.insertedId.toString(), email);
    return Response.json({ user: { email } }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Account registration failed", error);
    const message =
      error instanceof Error && error.message === "Set MONGODB_URI in your environment."
        ? "MongoDB is not configured. Add MONGODB_URI to .env.local and restart the app."
        : "Could not connect to MongoDB. Check the connection string and network access.";
    return Response.json({ error: message }, { status: 503 });
  }
}
