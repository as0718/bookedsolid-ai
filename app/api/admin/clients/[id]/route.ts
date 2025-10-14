import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single client details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        callRecords: {
          orderBy: { timestamp: "desc" },
          take: 50, // Last 50 calls
        },
        _count: {
          select: {
            callRecords: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate call metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayCalls = await prisma.callRecord.count({
      where: {
        clientId: params.id,
        timestamp: { gte: today },
      },
    });

    const monthCalls = await prisma.callRecord.count({
      where: {
        clientId: params.id,
        timestamp: { gte: thisMonth },
      },
    });

    const monthBooked = await prisma.callRecord.count({
      where: {
        clientId: params.id,
        timestamp: { gte: thisMonth },
        outcome: "booked",
      },
    });

    // Convert to JSON-serializable format
    const clientData = {
      id: client.id,
      businessName: client.businessName,
      email: client.email,
      phone: client.phone,
      plan: client.plan,
      status: client.status,
      timezone: client.timezone,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      billing: client.billing,
      settings: client.settings,
      users: client.users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      callRecords: client.callRecords.map((call) => ({
        id: call.id,
        timestamp: call.timestamp.toISOString(),
        callerName: call.callerName,
        callerPhone: call.callerPhone,
        duration: call.duration,
        outcome: call.outcome,
        notes: call.notes,
        recordingUrl: call.recordingUrl,
        appointmentDetails: call.appointmentDetails,
      })),
      metrics: {
        totalCalls: client._count.callRecords,
        todayCalls,
        monthCalls,
        monthBooked,
        conversionRate: monthCalls > 0 ? (monthBooked / monthCalls) * 100 : 0,
      },
    };

    return NextResponse.json({ client: clientData });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update client (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      email,
      phone,
      plan,
      status,
      timezone,
      billing,
      settings,
    } = body;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // If email is being changed, check it's not already in use
    if (email && email !== existingClient.email) {
      const emailInUse = await prisma.client.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(businessName && { businessName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(timezone && { timezone }),
        ...(billing && { billing }),
        ...(settings && { settings }),
      },
    });

    return NextResponse.json({
      client: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        phone: client.phone,
        plan: client.plan,
        status: client.status,
        timezone: client.timezone,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        billing: client.billing,
        settings: client.settings,
      },
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete client (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Delete client (cascade will delete related records)
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
