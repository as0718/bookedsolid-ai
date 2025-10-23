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

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        teamRole: true,
        isTeamMember: true,
        businessOwnerId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Determine the business owner ID
    const businessOwnerId = currentUser.isTeamMember && currentUser.businessOwnerId
      ? currentUser.businessOwnerId
      : currentUser.id;

    // Get all team members for this business (excluding current user)
    const teamMembers = await prisma.user.findMany({
      where: {
        businessOwnerId: businessOwnerId,
        id: { not: currentUser.id }, // Exclude current user from team members list
      },
      select: {
        id: true,
        name: true,
        email: true,
        teamRole: true,
        teamPermissions: true,
        teamJoinedAt: true,
        createdAt: true,
      },
      orderBy: {
        teamJoinedAt: "desc",
      },
    });

    // If current user is business owner, also fetch the owner for the "Me" option
    const businessOwner = currentUser.isTeamMember
      ? await prisma.user.findUnique({
          where: { id: businessOwnerId },
          select: {
            id: true,
            name: true,
            email: true,
            teamRole: true,
          },
        })
      : null;

    return NextResponse.json({
      currentUser: {
        id: currentUser.id,
        name: currentUser.name || currentUser.email,
        email: currentUser.email,
        teamRole: currentUser.teamRole,
        isTeamMember: currentUser.isTeamMember,
      },
      businessOwner: businessOwner ? {
        id: businessOwner.id,
        name: businessOwner.name || businessOwner.email,
        email: businessOwner.email,
        teamRole: businessOwner.teamRole,
      } : null,
      teamMembers: teamMembers.map((member) => ({
        id: member.id,
        name: member.name || member.email,
        email: member.email,
        teamRole: member.teamRole,
        teamPermissions: member.teamPermissions,
        teamJoinedAt: member.teamJoinedAt?.toISOString(),
        status: "active", // Can be extended to support inactive status
      })),
    });
  } catch (error) {
    console.error("[Team Members Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
