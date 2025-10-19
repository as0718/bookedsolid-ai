import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/settings - Get user/client settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { clientId?: string } | undefined;

    if (!session || !user || !user.clientId) {
      return NextResponse.json(
        { error: "Unauthorized - Client access required" },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// PUT /api/user/settings - Update user/client settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { clientId?: string } | undefined;

    if (!session || !user || !user.clientId) {
      return NextResponse.json(
        { error: "Unauthorized - Client access required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Extract different types of updates
    const {
      // Account updates
      businessName,
      email,
      phone,
      timezone,
      // Settings updates (AI voice, integrations)
      voiceType,
      speakingSpeed,
      customGreeting,
      bookingSystem,
      calendarSync,
      // Direct settings object
      settings,
      ...otherFields
    } = body;

    // Build the update object
    const updateData: any = {
      ...otherFields,
    };

    // Update direct fields if provided
    if (businessName !== undefined) updateData.businessName = businessName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (timezone !== undefined) updateData.timezone = timezone;

    // Get current client to merge settings
    const currentClient = await prisma.client.findUnique({
      where: { id: user.clientId },
    });

    if (!currentClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Merge settings if any voice/integration settings provided
    if (voiceType || speakingSpeed || customGreeting || bookingSystem || calendarSync !== undefined || settings) {
      const currentSettings = currentClient.settings as any || {};

      updateData.settings = {
        ...currentSettings,
        ...(settings || {}),
        ...(voiceType && { voiceType }),
        ...(speakingSpeed && { speakingSpeed }),
        ...(customGreeting !== undefined && { customGreeting }),
        ...(bookingSystem && { bookingSystem }),
        ...(calendarSync !== undefined && { calendarSync: calendarSync === "google" || calendarSync === "outlook" || calendarSync === "apple" }),
      };
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: user.clientId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
