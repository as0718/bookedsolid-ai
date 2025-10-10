import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// THIS IS THE FIX FOR VERCEL DEPLOYMENT
const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Demo login credentials you provided
        if (credentials?.email === "demo@bookedsolid.ai" && 
            credentials?.password === "DemoClient2025!") {
          return {
            id: "1",
            email: "demo@bookedsolid.ai",
            name: "Demo User"
          };
        }
        // If login fails
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",      // Your custom login page
    error: "/login",       // Redirect errors to login page
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to the session
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  // ⭐⭐⭐ CRITICAL FIX FOR VERCEL ⭐⭐⭐
  trustHost: true,
  // Optional: For additional security
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// This handles all auth routes: /api/auth/* 
export const { GET, POST } = handlers;

	
