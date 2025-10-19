import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get the team member and verify ownership
    const teamMember = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    if (teamMember.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only remove members from your own team" },
        { status: 403 }
      );
    }

    if (!teamMember.isTeamMember) {
      return NextResponse.json(
        { error: "This user is not a team member" },
        { status: 400 }
      );
    }

    // Remove the team member (delete the user account)
    await prisma.user.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("[Team Remove Error]", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
