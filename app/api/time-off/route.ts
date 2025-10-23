import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/time-off - List time-off requests
export async function GET(request: Request) {
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
        businessOwnerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const teamMemberId = searchParams.get('teamMemberId');

    // Build where clause based on user role
    const where: any = {};

    if (user.isTeamMember) {
      // Team members see only their own requests
      where.teamMemberId = user.id;
    } else {
      // Business owners see requests for their team
      where.businessOwnerId = user.id;

      // Filter by specific team member if requested
      if (teamMemberId) {
        where.teamMemberId = teamMemberId;
      }
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Fetch time-off requests
    const requests = await prisma.timeOffRequest.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off requests' },
      { status: 500 }
    );
  }
}

// POST /api/time-off - Create a new time-off request
export async function POST(request: Request) {
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
        businessOwnerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only team members can request time off
    if (!user.isTeamMember || !user.businessOwnerId) {
      return NextResponse.json(
        { error: 'Only team members can request time off' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, reason, reasonDetails } = body;

    // Validate required fields
    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate, reason' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping time-off requests
    const overlapping = await prisma.timeOffRequest.findFirst({
      where: {
        teamMemberId: user.id,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            startDate: {
              lte: end,
            },
            endDate: {
              gte: start,
            },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a time-off request for these dates' },
        { status: 409 }
      );
    }

    // Create time-off request
    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        teamMemberId: user.id,
        businessOwnerId: user.businessOwnerId,
        startDate: start,
        endDate: end,
        reason,
        reasonDetails,
        status: 'PENDING',
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
      },
    });

    // Create notification for business owner
    await prisma.notification.create({
      data: {
        userId: user.businessOwnerId,
        type: 'TIME_OFF_REQUEST',
        title: 'New Time-Off Request',
        message: `${timeOffRequest.teamMember.name || timeOffRequest.teamMember.email} has requested time off from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
        link: '/dashboard/team-schedules',
        metadata: {
          timeOffRequestId: timeOffRequest.id,
          teamMemberId: user.id,
        },
      },
    });

    return NextResponse.json(timeOffRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to create time-off request' },
      { status: 500 }
    );
  }
}
