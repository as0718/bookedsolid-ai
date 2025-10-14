import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; clientId?: string } | undefined;

    if (!session || !user || !user.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch call records for this client
    const callRecords = await prisma.callRecord.findMany({
      where: {
        clientId: user.clientId,
      },
      orderBy: { timestamp: "desc" },
    });

    // Also fetch client data for the navbar
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: { businessName: true, email: true },
    });

    // Convert to JSON-serializable format
    const calls = callRecords.map((call) => ({
      id: call.id,
      clientId: call.clientId,
      timestamp: call.timestamp.toISOString(),
      callerName: call.callerName,
      callerPhone: call.callerPhone,
      duration: call.duration,
      outcome: call.outcome,
      notes: call.notes,
      recordingUrl: call.recordingUrl,
      transcriptUrl: call.transcriptUrl,
      appointmentDetails: call.appointmentDetails,
    }));

    return NextResponse.json({ calls, client });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
