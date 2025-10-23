import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getAdminPermissions } from "@/lib/admin-permissions";

// Password validation: minimum 8 characters with at least 1 number
const PASSWORD_REGEX = /^(?=.*\d).{8,}$/;

/**
 * POST /api/admin/invitations/accept
 * Accept an admin invitation and create admin account
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, password } = body;

    // Validate required fields
    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, name, and password are required" },
        { status: 400 }
      );
    }

    // Validate password requirements
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters long and contain at least 1 number",
        },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check invitation status
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { error: "This invitation has already been used or cancelled" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      await prisma.adminInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = invitation.email.toLowerCase().trim();

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default permissions for admin role
    const defaultPermissions = getAdminPermissions(invitation.adminRole);
    const permissionsObj: Record<string, boolean> = {};
    defaultPermissions.forEach(perm => {
      permissionsObj[perm] = true;
    });

    // Merge with custom permissions if provided
    const finalPermissions = {
      ...permissionsObj,
      ...(invitation.permissions as Record<string, boolean> || {}),
    };

    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        name,
        fullName: name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        isAdmin: true,
        adminRole: invitation.adminRole,
        adminPermissions: finalPermissions,
        adminJoinedAt: new Date(),
        adminInvitedById: invitation.invitedById,
        passwordChangedAt: new Date(),
      },
    });

    // Update invitation status
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        adminRole: newAdmin.adminRole,
      },
    });
  } catch (error) {
    console.error("Error accepting admin invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/invitations/accept?token=xxx
 * Validate an admin invitation token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check status
    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        {
          error: "This invitation has already been used or cancelled",
          status: invitation.status,
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        adminRole: invitation.adminRole,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
