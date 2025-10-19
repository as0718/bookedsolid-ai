import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/appointments - List appointments for the current user
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

    // Allow appointment access if CRM is enabled (more permissive check)
    // Users can access appointments regardless of CRM preference
    if (!user.crmAccessEnabled) {
      return NextResponse.json({
        error: 'Appointment scheduling is not enabled. Please contact your administrator.'
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            phoneNumber: true,
            email: true,
          },
        },
        specialist: {
          select: {
            id: true,
            name: true,
            teamRole: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: Request) {
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

    // Allow appointment creation if CRM is enabled (more permissive check)
    // Users can create appointments regardless of CRM preference
    if (!user.crmAccessEnabled) {
      return NextResponse.json({
        error: 'Appointment scheduling is not enabled. Please contact your administrator.'
      }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, date, duration, serviceType, status, notes, specialistId } = body;

    // Validate required fields
    if (!clientId || !date || !duration || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if client belongs to this user
    const client = await prisma.voiceClient.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check for conflicting appointments
    const appointmentDate = new Date(date);
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        date: {
          lt: appointmentEnd,
        },
        AND: {
          date: {
            gte: appointmentDate,
          },
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot conflict with existing appointment' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        userId: user.id,
        date: new Date(date),
        duration,
        serviceType,
        status: status || 'CONFIRMED',
        notes,
        specialistId: specialistId || null,
        createdBy: `staff_${user.id}`,
      },
      include: {
        client: {
          select: {
            id: true,
            clientName: true,
            phoneNumber: true,
            email: true,
          },
        },
        specialist: {
          select: {
            id: true,
            name: true,
            teamRole: true,
          },
        },
      },
    });

    // Update client status to BOOKED if they're a LEAD
    if (client.status === 'LEAD') {
      await prisma.voiceClient.update({
        where: { id: clientId },
        data: { status: 'BOOKED' },
      });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
