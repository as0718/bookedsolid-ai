import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        business: true,
        invitedBy: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation is no longer valid" },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the team member user account
    // Team members need to complete services onboarding:
    // - setupCompleted: false (triggers services onboarding modal)
    // - setupDismissed: true (skip pricing/CRM modals)
    // - hasExternalCRM: false (skip CRM preference modal)
    const teamMember = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
        fullName: name,
        password: hashedPassword,
        role: "team_member",
        isTeamMember: true,
        teamRole: invitation.role,
        teamPermissions: invitation.permissions,
        teamJoinedAt: new Date(),
        invitedById: invitation.invitedById,
        businessOwnerId: invitation.invitedById,
        clientId: invitation.businessId, // Link to the business
        setupCompleted: false, // Trigger services onboarding modal
        setupDismissed: true, // Skip pricing modal
        hasExternalCRM: false, // Skip CRM preference modal
      },
    });

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({
      success: true,
      message: "Welcome to the team!",
      user: {
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
      },
    });
  } catch (error) {
    console.error("[Team Accept Error]", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
