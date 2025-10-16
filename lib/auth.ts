import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter is removed because it's incompatible with CredentialsProvider
  // CredentialsProvider only works with JWT sessions, not database sessions
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

        try {
          // Look up user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              client: true,
            },
          });

          if (!user || !user.password) {
            console.log("[Auth] User not found or no password set:", credentials.email);
            return null;
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.log("[Auth] Invalid password for user:", credentials.email);
            return null;
          }

          // Determine role and clientId
          const role = user.role || "client";
          const clientId = user.client?.id || null;

          console.log("[Auth] User authenticated successfully:", user.email, "Role:", role);

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role,
            clientId,
          };
        } catch (error) {
          console.error("[Auth] Error during authentication:", error);
          return null;
        }
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

      // Handle Google OAuth - look up user in database for role assignment
      if (account?.provider === "google" && token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: { client: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "client";
            token.clientId = dbUser.client?.id || null;
          }
        } catch (error) {
          console.error("[Auth] Error looking up Google OAuth user:", error);
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
    // Use JWT sessions (required for CredentialsProvider)
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // ⭐ CRITICAL FIX FOR VERCEL ⭐
  // The secret is required for production deployments
  secret: process.env.NEXTAUTH_SECRET,
};
