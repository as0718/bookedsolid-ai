"use server";

import { redirect } from "next/navigation";
import {
  verifyCredentials,
  createSession,
  setSessionCookie,
  deleteSessionCookie,
  getSessionCookie,
  deleteSession,
} from "./auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = verifyCredentials(email, password);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  // Create session and set cookie
  const sessionId = createSession(user);
  await setSessionCookie(sessionId);

  // Redirect based on role
  if (user.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/dashboard");
  }
}

export async function logout() {
  const sessionId = await getSessionCookie();

  if (sessionId) {
    deleteSession(sessionId);
  }

  await deleteSessionCookie();
  redirect("/login");
}
