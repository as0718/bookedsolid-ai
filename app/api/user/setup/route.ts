import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { setupCompleted, setupDismissed } = body;

    // Update user setup status
    const updateData: Record<string, any> = {};

    if (setupCompleted !== undefined) {
      updateData.setupCompleted = setupCompleted;
      if (setupCompleted) {
        updateData.setupCompletedAt = new Date();
      }
    }

    if (setupDismissed !== undefined) {
      updateData.setupDismissed = setupDismissed;
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        setupCompleted: updatedUser.setupCompleted,
        setupDismissed: updatedUser.setupDismissed,
        setupCompletedAt: updatedUser.setupCompletedAt,
      },
    });
  } catch (error) {
    console.error('Error updating setup status:', error);
    return NextResponse.json(
      { error: 'Failed to update setup status' },
      { status: 500 }
    );
  }
}
