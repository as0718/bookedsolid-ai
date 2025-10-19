import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single client details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
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
        clientId: id,
        timestamp: { gte: today },
      },
    });

    const monthCalls = await prisma.callRecord.count({
      where: {
        clientId: id,
        timestamp: { gte: thisMonth },
      },
    });

    const monthBooked = await prisma.callRecord.count({
      where: {
        clientId: id,
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
      billingInterval: client.billingInterval,
      contactName: client.contactName,
      pointOfContact: client.pointOfContact,
      pocPhone: client.pocPhone,
      pocEmail: client.pocEmail,
      location: client.location,
      stripeSubscriptionStatus: client.stripeSubscriptionStatus,
      stripeSubscriptionId: client.stripeSubscriptionId,
      stripeCustomerId: client.stripeCustomerId,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      contactName,
      pointOfContact,
      pocPhone,
      pocEmail,
      location,
    } = body;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
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
      where: { id },
      data: {
        ...(businessName && { businessName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(plan && { plan }),
        ...(status && { status }),
        ...(timezone && { timezone }),
        ...(billing && { billing }),
        ...(settings && { settings }),
        ...(contactName !== undefined && { contactName }),
        ...(pointOfContact !== undefined && { pointOfContact }),
        ...(pocPhone !== undefined && { pocPhone }),
        ...(pocEmail !== undefined && { pocEmail }),
        ...(location !== undefined && { location }),
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
        contactName: client.contactName,
        pointOfContact: client.pointOfContact,
        pocPhone: client.pocPhone,
        pocEmail: client.pocEmail,
        location: client.location,
        billing: client.billing,
        settings: client.settings,
      },
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete client account while preserving CRM customer data (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get client with all related data
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            voiceClients: true,
            appointments: true,
          },
        },
        callRecords: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get or create a system user to hold orphaned CRM records
    // This preserves VoiceClient records even after the business account is deleted
    let systemUser = await prisma.user.findFirst({
      where: {
        email: "system-orphaned-crm@bookedsolid.internal",
        role: "admin",
      },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: "system-orphaned-crm@bookedsolid.internal",
          name: "System - Orphaned CRM Records",
          role: "admin",
          setupCompleted: true,
        },
      });
    }

    // Calculate what will be deleted
    const totalVoiceClients = existingClient.users.reduce(
      (sum, u) => sum + u.voiceClients.length,
      0
    );
    const totalAppointments = existingClient.users.reduce(
      (sum, u) => sum + u.appointments.length,
      0
    );
    const totalCalls = existingClient.callRecords.length;

    // Step 1: Transfer all VoiceClient records to system user to preserve them
    for (const clientUser of existingClient.users) {
      if (clientUser.voiceClients.length > 0) {
        // First, transfer ownership to system user
        await prisma.voiceClient.updateMany({
          where: { userId: clientUser.id },
          data: {
            userId: systemUser.id,
          },
        });

        // Then, add preservation note to each voice client individually
        for (const vc of clientUser.voiceClients) {
          const currentNotes = vc.notes || "";
          const preservationNote = `\n\n[PRESERVED FROM DELETED ACCOUNT: ${existingClient.businessName} (${clientUser.email || clientUser.name}) - ${new Date().toISOString()}]`;

          await prisma.voiceClient.update({
            where: { id: vc.id },
            data: {
              notes: currentNotes + preservationNote,
            },
          });
        }
      }
    }

    // Step 2: Delete appointments (will cascade delete)
    for (const clientUser of existingClient.users) {
      await prisma.appointment.deleteMany({
        where: { userId: clientUser.id },
      });
    }

    // Step 3: Delete call records for this client
    await prisma.callRecord.deleteMany({
      where: { clientId: id },
    });

    // Step 4: Delete all users associated with this client
    await prisma.user.deleteMany({
      where: { clientId: id },
    });

    // Step 5: Finally delete the client business account
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        businessAccount: existingClient.businessName,
        users: existingClient.users.length,
        appointments: totalAppointments,
        callRecords: totalCalls,
      },
      preserved: {
        voiceClients: totalVoiceClients,
        message: `${totalVoiceClients} CRM customer records have been preserved and can be accessed by admins`,
      },
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
