import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { logSystemAction } from "@/lib/audit-logger";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * POST /api/admin/users/passwords/bulk-reset
 * Bulk password reset for multiple users
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
    const { userIds, businessId, forceChange, sendEmail } = body;

    // Validate that we have either userIds or businessId
    if (!userIds && !businessId) {
      return NextResponse.json(
        { error: "Either userIds or businessId is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    if (userIds) {
      where.id = { in: userIds };
    } else if (businessId) {
      where.clientId = businessId;
    }

    // Get users to reset
    const usersToReset = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (usersToReset.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Generate temporary passwords for each user
    const resetResults = [];

    for (const user of usersToReset) {
      try {
        // Generate temporary password
        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update user password
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            forcePasswordChange: forceChange !== false,
            passwordChangedAt: new Date(),
            failedLoginAttempts: 0,
            accountLockedUntil: null,
          },
        });

        // Create password reset history
        await prisma.passwordResetHistory.create({
          data: {
            userId: user.id,
            resetBy: admin.id,
            resetType: "admin_bulk",
            wasForced: true,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          },
        });

        resetResults.push({
          userId: user.id,
          email: user.email,
          name: user.name,
          tempPassword,
          success: true,
        });

        // TODO: Send email if requested
        // if (sendEmail && user.email) {
        //   await sendPasswordResetEmail(user.email, tempPassword);
        // }
      } catch (error) {
        console.error(`Error resetting password for user ${user.id}:`, error);
        resetResults.push({
          userId: user.id,
          email: user.email,
          name: user.name,
          success: false,
          error: "Failed to reset password",
        });
      }
    }

    // Log audit trail
    await logSystemAction({
      action: "BULK_ACTION_PERFORMED",
      performedBy: admin.id,
      metadata: {
        actionType: "bulk_password_reset",
        userCount: usersToReset.length,
        successCount: resetResults.filter(r => r.success).length,
        businessId,
      },
      req,
    });

    const successCount = resetResults.filter(r => r.success).length;
    const failureCount = resetResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Password reset completed. ${successCount} successful, ${failureCount} failed.`,
      results: resetResults,
      summary: {
        total: usersToReset.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("Error performing bulk password reset:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk password reset" },
      { status: 500 }
    );
  }
}
