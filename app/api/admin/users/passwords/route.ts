import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { logUserAction, logSystemAction } from "@/lib/audit-logger";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/admin/users/passwords/reset
 * Admin password reset for a single user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin with permission
    const admin = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!admin || !hasAdminPermission(admin, "reset_passwords")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newPassword, forceChange, sendEmail } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let hashedPassword: string;
    let tempPassword: string | null = null;

    if (newPassword) {
      // Admin provided a new password
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } else {
      // Generate temporary password
      tempPassword = crypto.randomBytes(8).toString("hex");
      hashedPassword = await bcrypt.hash(tempPassword, 10);
    }

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        forcePasswordChange: forceChange !== false, // Default to true
        passwordChangedAt: new Date(),
        // Reset failed login attempts
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // Create password reset history
    await prisma.passwordResetHistory.create({
      data: {
        userId,
        resetBy: admin.id,
        resetType: "admin_forced",
        wasForced: true,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    // Log audit trail
    await logUserAction({
      action: "USER_PASSWORD_RESET",
      performedBy: admin.id,
      userId,
      changes: {
        forcePasswordChange: forceChange !== false,
        resetBy: "admin",
      },
      req,
    });

    // TODO: Send email notification if requested
    // if (sendEmail && targetUser.email) {
    //   await sendPasswordResetEmail(targetUser.email, tempPassword);
    // }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      tempPassword: tempPassword, // Only returned if generated
      forcePasswordChange: forceChange !== false,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
