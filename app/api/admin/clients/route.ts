import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all clients (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string } | undefined;

    if (!session || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const plan = searchParams.get("plan");
    const status = searchParams.get("status");

    // Build where clause
    const where: {
      OR?: Array<{ businessName?: { contains: string; mode: string }; email?: { contains: string; mode: string }; phone?: { contains: string } }>;
      plan?: string;
      status?: string;
    } = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (plan) {
      where.plan = plan;
    }

    if (status) {
      where.status = status;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            callRecords: true,
          },
        },
      },
    });

    // Convert to JSON-serializable format
    const clientsData = clients.map((client) => ({
      id: client.id,
      businessName: client.businessName,
      email: client.email,
      phone: client.phone,
      plan: client.plan,
      status: client.status,
      timezone: client.timezone,
      createdAt: client.createdAt.toISOString(),
      billing: client.billing,
      settings: client.settings,
      users: client.users,
      callCount: client._count.callRecords,
    }));

    return NextResponse.json({ clients: clientsData });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new client (admin only)
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!businessName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 }
      );
    }

    // Set default billing info based on plan
    const defaultBilling = {
      currentPeriodStart: new Date().toISOString().split("T")[0],
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      minutesIncluded: plan === "unlimited" ? 999999 : plan === "complete" ? 1000 : 500,
      minutesUsed: 0,
      overageRate: plan === "unlimited" ? 0 : plan === "complete" ? 0.25 : 0.30,
      monthlyRate: plan === "unlimited" ? 599 : plan === "complete" ? 349 : 149,
    };

    // Set default settings
    const defaultSettings = {
      voiceType: "female-professional",
      speakingSpeed: "normal",
      customGreeting: `Thank you for calling ${businessName}. How may I help you today?`,
      bookingSystem: "square",
      calendarSync: "google",
    };

    // Create client
    const client = await prisma.client.create({
      data: {
        businessName,
        email,
        phone,
        plan: plan || "missed",
        status: status || "active",
        timezone: timezone || "America/New_York",
        billing: billing || defaultBilling,
        settings: settings || defaultSettings,
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
        billing: client.billing,
        settings: client.settings,
      },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
