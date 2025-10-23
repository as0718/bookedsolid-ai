import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminPermission } from "@/lib/admin-permissions";
import { logAdminAction } from "@/lib/audit-logger";
import { AdminRole, InvitationStatus } from "@prisma/client";
import crypto from "crypto";

/**
 * GET /api/admin/invitations
 * List all admin invitations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin with permission
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user || !hasAdminPermission(user, "view_admins")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as InvitationStatus | null;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Fetch invitations
    const invitations = await prisma.adminInvitation.findMany({
      where,
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            adminRole: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching admin invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invitations
 * Create a new admin invitation
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin with permission
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!user || !hasAdminPermission(user, "invite_admins")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, adminRole, permissions } = body;

    // Validate required fields
    if (!email || !adminRole) {
      return NextResponse.json(
        { error: "Email and admin role are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Pending invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.adminInvitation.create({
      data: {
        email: normalizedEmail,
        token,
        adminRole: adminRole as AdminRole,
        permissions: permissions || null,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedById: user.id,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit trail
    await logAdminAction({
      action: "ADMIN_INVITED",
      performedBy: user.id,
      adminId: invitation.id,
      metadata: {
        invitedEmail: normalizedEmail,
        adminRole,
      },
      req,
    });

    // TODO: Send invitation email
    // await sendAdminInvitationEmail(normalizedEmail, token, adminRole);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        adminRole: invitation.adminRole,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
      },
      invitationLink: `${process.env.NEXTAUTH_URL}/admin/accept-invitation?token=${token}`,
    });
  } catch (error) {
    console.error("Error creating admin invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
