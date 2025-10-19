import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/voice-clients/[id] - Get a specific voice client with full call history
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const voiceClient = await prisma.voiceClient.findUnique({
      where: {
        id: params.id,
      },
      include: {
        callHistory: {
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: { callHistory: true },
        },
      },
    });

    if (!voiceClient) {
      return NextResponse.json(
        { error: 'Voice client not found' },
        { status: 404 }
      );
    }

    // Ensure the voice client belongs to the current user
    if (voiceClient.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(voiceClient);
  } catch (error) {
    console.error('Error fetching voice client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice client' },
      { status: 500 }
    );
  }
}

// PATCH /api/voice-clients/[id] - Update a voice client
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if voice client exists and belongs to user
    const existingClient = await prisma.voiceClient.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Voice client not found' },
        { status: 404 }
      );
    }

    if (existingClient.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phoneNumber, clientName, email, serviceType, notes, status } = body;

    // If updating phone number, check for duplicates
    if (phoneNumber && phoneNumber !== existingClient.phoneNumber) {
      const duplicate = await prisma.voiceClient.findFirst({
        where: {
          userId: user.id,
          phoneNumber,
          id: { not: params.id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Voice client with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Update voice client
    const updatedClient = await prisma.voiceClient.update({
      where: { id: params.id },
      data: {
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(clientName !== undefined && { clientName }),
        ...(email !== undefined && { email }),
        ...(serviceType !== undefined && { serviceType }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
      include: {
        callHistory: {
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: { callHistory: true },
        },
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating voice client:', error);
    return NextResponse.json(
      { error: 'Failed to update voice client' },
      { status: 500 }
    );
  }
}

// DELETE /api/voice-clients/[id] - Delete or soft-delete a voice client
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if voice client exists and belongs to user
    const existingClient = await prisma.voiceClient.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          select: { id: true },
        },
        callHistory: {
          select: { id: true },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Voice client not found' },
        { status: 404 }
      );
    }

    if (existingClient.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body to determine delete type
    const url = new URL(request.url);
    const softDelete = url.searchParams.get('soft') === 'true';

    if (softDelete) {
      // Soft delete: mark as INACTIVE
      await prisma.voiceClient.update({
        where: { id: params.id },
        data: {
          status: 'INACTIVE',
        },
      });

      return NextResponse.json({
        success: true,
        type: 'soft',
        message: 'Customer marked as inactive',
      });
    } else {
      // Hard delete: permanently remove the client
      // Appointments will cascade delete
      // Call history voiceClientId will be set to null
      await prisma.voiceClient.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        success: true,
        type: 'hard',
        message: 'Customer permanently deleted',
        deletedRecords: {
          appointments: existingClient.appointments.length,
          callHistory: existingClient.callHistory.length,
        },
      });
    }
  } catch (error) {
    console.error('Error deleting voice client:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice client' },
      { status: 500 }
    );
  }
}
