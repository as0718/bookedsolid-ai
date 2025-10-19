import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/voice-clients - List all voice clients for the current user
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search } },
        { clientName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Special handling for "BOOKED" filter - show clients with upcoming appointments
    if (status === 'BOOKED') {
      where.appointments = {
        some: {
          date: { gte: new Date() },
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      };
    } else if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch voice clients with call history count and appointments
    const voiceClients = await prisma.voiceClient.findMany({
      where,
      include: {
        callHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Get the most recent call
        },
        appointments: {
          where: {
            date: { gte: new Date() },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          orderBy: { date: 'asc' },
          take: 3, // Get next 3 upcoming appointments
        },
        _count: {
          select: { callHistory: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(voiceClients);
  } catch (error) {
    console.error('Error fetching voice clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice clients' },
      { status: 500 }
    );
  }
}

// POST /api/voice-clients - Create a new voice client
export async function POST(request: Request) {
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

    const body = await request.json();
    const { phoneNumber, clientName, email, serviceType, notes, status } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if voice client with this phone number already exists
    const existingClient = await prisma.voiceClient.findFirst({
      where: {
        userId: user.id,
        phoneNumber,
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Voice client with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create new voice client
    const voiceClient = await prisma.voiceClient.create({
      data: {
        phoneNumber,
        clientName,
        email,
        serviceType,
        notes,
        status: status || 'LEAD',
        userId: user.id,
      },
      include: {
        callHistory: true,
        _count: {
          select: { callHistory: true },
        },
      },
    });

    return NextResponse.json(voiceClient, { status: 201 });
  } catch (error) {
    console.error('Error creating voice client:', error);
    return NextResponse.json(
      { error: 'Failed to create voice client' },
      { status: 500 }
    );
  }
}
