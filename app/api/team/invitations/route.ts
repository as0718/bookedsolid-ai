import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Get all invitations for this business
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        businessId: user.clientId,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mark expired invitations
    const now = new Date();
    const expiredInvitations = invitations.filter(
      (inv) => inv.status === "PENDING" && inv.expiresAt < now
    );

    // Update expired invitations in database
    if (expiredInvitations.length > 0) {
      await prisma.teamInvitation.updateMany({
        where: {
          id: {
            in: expiredInvitations.map((inv) => inv.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });
    }

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        permissions: inv.permissions,
        status: inv.expiresAt < now && inv.status === "PENDING" ? "EXPIRED" : inv.status,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        invitedBy: inv.invitedBy,
      })),
    });
  } catch (error) {
    console.error("[Team Invitations Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
