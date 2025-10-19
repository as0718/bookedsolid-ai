import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/appointments/today - Get today's appointments for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, crmPreference: true, crmAccessEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Allow appointment access if CRM is enabled
    if (!user.crmAccessEnabled) {
      return NextResponse.json({
        error: 'Appointment scheduling is not enabled. Please contact your administrator.'
      }, { status: 403 });
    }

    // Get start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Fetch today's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s appointments' },
      { status: 500 }
    );
  }
}
