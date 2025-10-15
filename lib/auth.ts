import { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Disabled for local testing
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// import { prisma } from "./prisma"; // Disabled for local testing
import { demoUsers } from "./mock-data";

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Disabled for local testing - using JWT instead
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Email/Password Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo authentication - hardcoded credentials
        const validCredentials: { [key: string]: string } = {
          "demo@bookedsolid.ai": "DemoClient2025!",
          "admin@bookedsolid.ai": "AdminAccess2025!",
        };

        if (validCredentials[credentials.email] === credentials.password) {
          const user = demoUsers.find((u) => u.email === credentials.email);
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - add user data to JWT token
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.clientId = (user as { clientId?: string }).clientId;
      }

      // Handle Google OAuth - match with demo users for role assignment
      if (account?.provider === "google" && token.email) {
        const demoUser = demoUsers.find((u) => u.email === token.email);
        if (demoUser) {
          token.role = demoUser.role;
          token.clientId = demoUser.clientId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user data from JWT token to session
      if (session.user && token) {
        (session.user as { id?: string; role?: string; clientId?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string; clientId?: string }).role = token.role as string;
        (session.user as { id?: string; role?: string; clientId?: string }).clientId = token.clientId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    // Use JWT sessions for local testing (no database required)
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // ⭐ CRITICAL FIX FOR VERCEL ⭐
  // The secret is required for production deployments
  secret: process.env.NEXTAUTH_SECRET,
};
