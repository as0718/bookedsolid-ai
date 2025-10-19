import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Update user's CRM access (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    // Check if user is admin
    if (!session || !user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { crmAccessEnabled } = body;

    // Update user's CRM access
    await prisma.user.update({
      where: { id },
      data: {
        crmAccessEnabled: crmAccessEnabled === true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'CRM access updated successfully',
    });
  } catch (error) {
    console.error('Error updating CRM access:', error);
    return NextResponse.json(
      { error: 'Failed to update CRM access' },
      { status: 500 }
    );
  }
}
