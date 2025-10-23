import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/team-schedules - List team schedules (business owner only)
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only business owners can view team schedules
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only business owners can view team schedules' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get('teamMemberId');

    // Build where clause
    const where: any = {
      businessOwnerId: user.id,
    };

    if (teamMemberId) {
      where.teamMemberId = teamMemberId;
    }

    // Fetch team schedules
    const schedules = await prisma.teamSchedule.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching team schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team schedules' },
      { status: 500 }
    );
  }
}

// POST /api/team-schedules - Create or update a team schedule (business owner only)
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only business owners can create team schedules
    if (user.isTeamMember) {
      return NextResponse.json(
        { error: 'Only business owners can create team schedules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      teamMemberId,
      workingDays,
      workingHours,
      recurring,
      effectiveFrom,
      effectiveTo,
      notes,
    } = body;

    // Validate required fields
    if (!teamMemberId || !workingDays || !workingHours) {
      return NextResponse.json(
        { error: 'Missing required fields: teamMemberId, workingDays, workingHours' },
        { status: 400 }
      );
    }

    // Validate workingDays format (should be an array of day names)
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return NextResponse.json(
        { error: 'workingDays must be a non-empty array of day names' },
        { status: 400 }
      );
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const invalidDays = workingDays.filter((day: string) => !validDays.includes(day.toLowerCase()));
    if (invalidDays.length > 0) {
      return NextResponse.json(
        { error: `Invalid day names: ${invalidDays.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate workingHours format (should have start and end times)
    if (!workingHours.start || !workingHours.end) {
      return NextResponse.json(
        { error: 'workingHours must have start and end times' },
        { status: 400 }
      );
    }

    // Verify team member belongs to this business owner
    const teamMember = await prisma.user.findFirst({
      where: {
        id: teamMemberId,
        isTeamMember: true,
        businessOwnerId: user.id,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if schedule already exists for this team member
    const existingSchedule = await prisma.teamSchedule.findUnique({
      where: { teamMemberId },
    });

    let schedule;
    if (existingSchedule) {
      // Update existing schedule
      schedule = await prisma.teamSchedule.update({
        where: { teamMemberId },
        data: {
          workingDays,
          workingHours,
          recurring: recurring !== undefined ? recurring : true,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
          effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
          notes,
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
        },
      });
    } else {
      // Create new schedule
      schedule = await prisma.teamSchedule.create({
        data: {
          teamMemberId,
          businessOwnerId: user.id,
          workingDays,
          workingHours,
          recurring: recurring !== undefined ? recurring : true,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
          notes,
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
        },
      });
    }

    return NextResponse.json(schedule, { status: existingSchedule ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating team schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create/update team schedule' },
      { status: 500 }
    );
  }
}
