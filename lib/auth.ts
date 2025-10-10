import { cookies } from "next/headers";
import { demoUsers } from "./mock-data";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "client" | "admin";
  clientId?: string;
}

const SESSION_COOKIE_NAME = "auth-session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple session store (in production, use a database or Redis)
const sessions = new Map<string, { user: User; expiresAt: number }>();

// Generate a random session ID
function generateSessionId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// Create a session and return the session ID
export function createSession(user: User): string {
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + SESSION_DURATION;

  sessions.set(sessionId, { user, expiresAt });

  return sessionId;
}

// Get session from session ID
export function getSession(sessionId: string): User | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session.user;
}

// Delete a session
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Set session cookie
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  });
}

// Get session cookie
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  return cookie?.value || null;
}

// Delete session cookie
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const sessionId = await getSessionCookie();

  if (!sessionId) {
    return null;
  }

  return getSession(sessionId);
}

// Verify credentials and return user
export function verifyCredentials(email: string, password: string): User | null {
  // Demo authentication - hardcoded credentials
  const validCredentials: { [key: string]: string } = {
    "demo@bookedsolid.ai": "DemoClient2025!",
    "admin@bookedsolid.ai": "AdminAccess2025!",
  };

  if (validCredentials[email] === password) {
    const user = demoUsers.find((u) => u.email === email);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
      };
    }
  }

  return null;
}
