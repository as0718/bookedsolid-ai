import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
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

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Update an appointment
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

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { date, duration, serviceType, status, notes, specialistId } = body;

    // If date or duration is being changed, check for conflicts
    if (date || duration) {
      const appointmentDate = new Date(date || existingAppointment.date);
      const appointmentDuration = duration || existingAppointment.duration;
      const appointmentEnd = new Date(appointmentDate.getTime() + appointmentDuration * 60000);

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          userId: user.id,
          id: {
            not: params.id, // Exclude current appointment
          },
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
    }

    // Update appointment
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (duration) updateData.duration = duration;
    if (serviceType) updateData.serviceType = serviceType;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (specialistId !== undefined) updateData.specialistId = specialistId || null;

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
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

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete appointment
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
