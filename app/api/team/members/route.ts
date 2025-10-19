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

    // Get all team members for this business owner
    const teamMembers = await prisma.user.findMany({
      where: {
        isTeamMember: true,
        businessOwnerId: session.user.id,
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

    return NextResponse.json({
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
