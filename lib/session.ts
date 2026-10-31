import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "folio_session";
const sessionDuration = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${sessionDuration}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDuration,
  });
}

export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}
