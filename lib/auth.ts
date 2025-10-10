import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { demoUsers } from "./mock-data";

export const authOptions: NextAuthOptions = {
  providers: [
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.clientId = (user as { clientId?: string }).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; clientId?: string; id?: string }).role = token.role as string;
        (session.user as { role?: string; clientId?: string; id?: string }).clientId = token.clientId as string;
        (session.user as { role?: string; clientId?: string; id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // ⭐⭐⭐ CRITICAL FIX FOR VERCEL ⭐⭐⭐
  // The secret is required for production deployments
  secret: process.env.NEXTAUTH_SECRET,
};
