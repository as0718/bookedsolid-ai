import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/time-off/[id] - Approve or reject a time-off request
export async function PATCH(
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

    // Only business owners can approve/reject time-off requests
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only business owners can approve or reject time-off requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Find the time-off request
    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id },
    });

    if (!timeOffRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      );
    }

    // Verify this business owner owns this request
    if (timeOffRequest.businessOwnerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this request' },
        { status: 403 }
      );
    }

    // Cannot modify already reviewed requests
    if (timeOffRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been reviewed' },
        { status: 400 }
      );
    }

    // Update the request
    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id: params.id },
      data: {
        status,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: {
        teamMember: {
          select: {
            id: true,
            name: true,
            email: true,
            teamRole: true,
          },
        },
        businessOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create notification for team member
    await prisma.notification.create({
      data: {
        userId: timeOffRequest.teamMemberId,
        type: status === 'APPROVED' ? 'TIME_OFF_APPROVED' : 'TIME_OFF_REJECTED',
        title: status === 'APPROVED' ? 'Time-Off Approved' : 'Time-Off Rejected',
        message: `Your time-off request from ${new Date(timeOffRequest.startDate).toLocaleDateString()} to ${new Date(timeOffRequest.endDate).toLocaleDateString()} has been ${status.toLowerCase()}`,
        link: '/dashboard/time-off',
        metadata: {
          timeOffRequestId: timeOffRequest.id,
        },
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to update time-off request' },
      { status: 500 }
    );
  }
}

// DELETE /api/time-off/[id] - Cancel a time-off request
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

    // Find the time-off request
    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id },
    });

    if (!timeOffRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      );
    }

    // Only the team member who created it can cancel it
    if (timeOffRequest.teamMemberId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this request' },
        { status: 403 }
      );
    }

    // Cannot cancel already approved/rejected requests
    if (timeOffRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot cancel a request that has already been reviewed' },
        { status: 400 }
      );
    }

    // Delete the request
    await prisma.timeOffRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Time-off request cancelled successfully' });
  } catch (error) {
    console.error('Error deleting time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel time-off request' },
      { status: 500 }
    );
  }
}
