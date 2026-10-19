import { compare } from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { createSession } from "@/lib/session";

type UserRecord = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const users = (await getDatabase()).collection<UserRecord>("users");
    const user = await users.findOne({ email });
    if (!user || !(await compare(password, user.passwordHash))) {
      return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await createSession(user._id.toString(), user.email);
    return Response.json({ user: { email: user.email } });
  } catch (error) {
    console.error("Sign in failed", error);
    const message =
      error instanceof Error && error.message === "Set MONGODB_URI in your environment."
        ? "MongoDB is not configured. Add MONGODB_URI to .env.local and restart the app."
        : "Could not connect to MongoDB. Check the connection string and network access.";
    return Response.json({ error: message }, { status: 503 });
  }
}
