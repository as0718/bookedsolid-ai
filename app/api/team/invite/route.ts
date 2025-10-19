import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendTeamInvitationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, role, permissions } = body;

    // Validate input
    if (!email || !role || !permissions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["barber", "stylist", "manager", "assistant"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = ["view_only", "full_access"];
    if (!validPermissions.includes(permissions)) {
      return NextResponse.json(
        { error: "Invalid permissions" },
        { status: 400 }
      );
    }

    // Get the user's client/business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { client: true },
    });

    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: "No business associated with this account" },
        { status: 400 }
      );
    }

    // Check if invitation already exists for this email and business
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        email,
        businessId: user.clientId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Check if user already exists as a team member
    const existingTeamMember = await prisma.user.findFirst({
      where: {
        email,
        isTeamMember: true,
        businessOwnerId: session.user.id,
      },
    });

    if (existingTeamMember) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 400 }
      );
    }

    // Generate unique invitation token
    const token = randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        token,
        role,
        permissions,
        expiresAt,
        invitedById: session.user.id,
        businessId: user.clientId,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/join/${token}`;

    // Send invitation email
    try {
      await sendTeamInvitationEmail({
        to: email,
        inviterName: invitation.invitedBy.name || 'Your team',
        businessName: invitation.business.businessName || 'the team',
        invitationUrl,
        role,
      });

      console.log(`[Team Invite] Email sent successfully to ${email}`);
    } catch (emailError) {
      // Log email error but don't fail the invitation creation
      console.error('[Team Invite] Failed to send email:', emailError);

      // You might want to track this failure in the database
      // For now, we'll continue since the invitation was created successfully
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        permissions: invitation.permissions,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        invitationUrl,
      },
    });
  } catch (error) {
    console.error("[Team Invite Error]", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
