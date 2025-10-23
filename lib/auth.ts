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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Normalize email to lowercase
          const normalizedEmail = credentials.email.toLowerCase().trim();

          // Look up user in database
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              client: true,
            },
          });

          if (!user || !user.password) {
            console.log("[Auth] User not found or no password set:", normalizedEmail);
            return null;
          }

          // Check if account is locked
          if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
            const minutesRemaining = Math.ceil((new Date(user.accountLockedUntil).getTime() - Date.now()) / 1000 / 60);
            console.log(`[Auth] Account locked for user ${normalizedEmail}, ${minutesRemaining} minutes remaining`);
            return null;
          }

          // Check if account lockout has expired
          if (user.accountLockedUntil && new Date(user.accountLockedUntil) <= new Date()) {
            // Reset failed login attempts since lockout has expired
            await prisma.user.update({
              where: { id: user.id },
              data: {
                accountLockedUntil: null,
                failedLoginAttempts: 0,
              },
            });
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.log("[Auth] Invalid password for user:", normalizedEmail);

            // Increment failed login attempts
            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            const now = new Date();

            // Lock account after 5 failed attempts for 15 minutes
            const shouldLockAccount = failedAttempts >= 5;
            const lockUntil = shouldLockAccount ? new Date(now.getTime() + 15 * 60 * 1000) : null;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                lastFailedLoginAt: now,
                lastFailedLoginIp: req?.headers?.get?.('x-forwarded-for') || req?.headers?.get?.('x-real-ip') || 'unknown',
                accountLockedUntil: lockUntil,
              },
            });

            if (shouldLockAccount) {
              console.log(`[Auth] Account locked for user ${normalizedEmail} after ${failedAttempts} failed attempts`);
            }

            return null;
          }

          // Check if password change is forced
          if (user.forcePasswordChange) {
            console.log("[Auth] User must change password:", normalizedEmail);
            // Allow login but flag for password change
          }

          // Successful login - reset failed attempts and update last login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              accountLockedUntil: null,
              lastLoginAt: new Date(),
              lastLoginIp: req?.headers?.get?.('x-forwarded-for') || req?.headers?.get?.('x-real-ip') || 'unknown',
            },
          });

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
            isTeamMember: user.isTeamMember || false,
            teamPermissions: user.teamPermissions || null,
            forcePasswordChange: user.forcePasswordChange || false,
          };
        } catch (error) {
          console.error("[Auth] Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user.email) {
        try {
          // Normalize email to lowercase
          const normalizedEmail = user.email.toLowerCase().trim();
          console.log("[Auth] Google OAuth sign-in attempt for:", normalizedEmail);

          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { client: true },
          });

          // If user doesn't exist, create them with a client
          if (!existingUser) {
            console.log("[Auth] Creating new user from Google OAuth:", normalizedEmail);

            // Extract full name from Google profile
            const fullName = user.name || normalizedEmail.split('@')[0];

            // Create client first
            const newClient = await prisma.client.create({
              data: {
                businessName: fullName,
                contactName: fullName, // Store contact name for display in admin dashboard
                email: normalizedEmail,
                phone: "",
                plan: "missed",
                status: "active",
                billing: {
                  minutesIncluded: 60,
                  minutesUsed: 0,
                  overageRate: 0.50,
                  currentMonthCost: 0,
                },
                settings: {
                  voiceType: "female",
                  speakingSpeed: 1.0,
                  customGreeting: "",
                  bookingSystem: "none",
                  calendarSync: false,
                },
              },
            });

            // Create user linked to client with full name
            await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: fullName,
                fullName: fullName, // Store in fullName field for consistency
                image: user.image,
                role: "client",
                clientId: newClient.id,
              },
            });

            console.log("[Auth] Successfully created user and client for:", normalizedEmail);
          } else if (!existingUser.clientId) {
            // User exists but has no client - create one
            console.log("[Auth] User exists without client, creating client for:", normalizedEmail);

            // Extract full name from Google profile
            const fullName = user.name || normalizedEmail.split('@')[0];

            const newClient = await prisma.client.create({
              data: {
                businessName: fullName,
                contactName: fullName, // Store contact name for display in admin dashboard
                email: normalizedEmail,
                phone: "",
                plan: "missed",
                status: "active",
                billing: {
                  minutesIncluded: 60,
                  minutesUsed: 0,
                  overageRate: 0.50,
                  currentMonthCost: 0,
                },
                settings: {
                  voiceType: "female",
                  speakingSpeed: 1.0,
                  customGreeting: "",
                  bookingSystem: "none",
                  calendarSync: false,
                },
              },
            });

            // Update user with clientId and full name
            await prisma.user.update({
              where: { email: normalizedEmail },
              data: {
                clientId: newClient.id,
                fullName: fullName, // Update fullName if not already set
              },
            });

            console.log("[Auth] Successfully linked client to existing user:", normalizedEmail);
          } else {
            // User exists with client - update fullName if not already set
            if (!existingUser.fullName && user.name) {
              await prisma.user.update({
                where: { email: normalizedEmail },
                data: { fullName: user.name },
              });
            }
          }

          return true;
        } catch (error) {
          console.error("[Auth] ERROR during Google OAuth sign-in:", error);
          console.error("[Auth] Error details:", {
            name: (error as Error).name,
            message: (error as Error).message,
            stack: (error as Error).stack,
          });
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - add user data to JWT token
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.clientId = (user as { clientId?: string }).clientId;
        token.isTeamMember = (user as { isTeamMember?: boolean }).isTeamMember;
        token.teamPermissions = (user as { teamPermissions?: string }).teamPermissions;
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
            token.isTeamMember = dbUser.isTeamMember || false;
            token.teamPermissions = dbUser.teamPermissions || null;
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
        (session.user as { id?: string; role?: string; clientId?: string; isTeamMember?: boolean; teamPermissions?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string; clientId?: string; isTeamMember?: boolean; teamPermissions?: string }).role = token.role as string;
        (session.user as { id?: string; role?: string; clientId?: string; isTeamMember?: boolean; teamPermissions?: string }).clientId = token.clientId as string;
        (session.user as { id?: string; role?: string; clientId?: string; isTeamMember?: boolean; teamPermissions?: string }).isTeamMember = token.isTeamMember as boolean;
        (session.user as { id?: string; role?: string; clientId?: string; isTeamMember?: boolean; teamPermissions?: string }).teamPermissions = token.teamPermissions as string;
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
