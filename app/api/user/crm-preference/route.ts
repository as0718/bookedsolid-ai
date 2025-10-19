import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Save user's CRM preference
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hasExternalCRM, preferredCRM, crmPreference } = body;

    // Update user's CRM preferences
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        hasExternalCRM: hasExternalCRM === true,
        preferredCRM: preferredCRM || null,
        crmPreference: crmPreference || 'BOOKEDSOLID_CRM',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'CRM preference saved successfully',
    });
  } catch (error) {
    console.error('Error saving CRM preference:', error);
    return NextResponse.json(
      { error: 'Failed to save CRM preference' },
      { status: 500 }
    );
  }
}

// GET - Get user's CRM preference
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        hasExternalCRM: true,
        preferredCRM: true,
        crmPreference: true,
        crmAccessEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching CRM preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM preference' },
      { status: 500 }
    );
  }
}
