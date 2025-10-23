import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/team-schedules/[id] - Delete a team schedule
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        isTeamMember: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only business owners can delete team schedules
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only business owners can delete team schedules' },
        { status: 403 }
      );
    }

    // Find the schedule
    const schedule = await prisma.teamSchedule.findUnique({
      where: { id: params.id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Team schedule not found' },
        { status: 404 }
      );
    }

    // Verify this business owner owns this schedule
    if (schedule.businessOwnerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this schedule' },
        { status: 403 }
      );
    }

    // Delete the schedule
    await prisma.teamSchedule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Team schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting team schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete team schedule' },
      { status: 500 }
    );
  }
}
