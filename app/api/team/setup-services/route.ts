import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { services, customServices } = body;

    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: "Services must be an array" },
        { status: 400 }
      );
    }

    // Combine standard services with custom services
    const allServices = [
      ...services,
      ...(customServices || []).map((name: string) => ({
        id: `custom-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name,
        custom: true,
      })),
    ];

    // Update user's services and mark setup as completed
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        servicesOffered: allServices,
        setupCompleted: true,
        setupCompletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Services saved successfully",
      services: updatedUser.servicesOffered,
    });
  } catch (error) {
    console.error("[Team Setup Services Error]", error);
    return NextResponse.json(
      { error: "Failed to save services" },
      { status: 500 }
    );
  }
}
