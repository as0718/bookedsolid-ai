import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      businessName,
      phone,
      plan = "missed" // Default to missed call plan
    } = body;

    // Validate required fields
    if (!name || !email || !password || !businessName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate billing period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Create client first
    const newClient = await prisma.client.create({
      data: {
        businessName,
        contactName: name, // Store contact name for display in admin dashboard
        email,
        phone,
        plan,
        status: "active",
        billing: {
          currentPeriodStart: currentPeriodStart.toISOString(),
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          minutesIncluded: plan === "missed" ? 60 : plan === "complete" ? 200 : -1,
          minutesUsed: 0,
          overageRate: 0.50,
          monthlyRate: plan === "missed" ? 297 : plan === "complete" ? 597 : 997,
        },
        settings: {
          voiceType: "female",
          speakingSpeed: 1.0,
          customGreeting: "",
          bookingSystem: "none",
          calendarSync: false,
        },
      },
    });

    // Create user linked to client
    const newUser = await prisma.user.create({
      data: {
        name,
        fullName: name, // Store in fullName field for consistency with Google OAuth
        email,
        password: hashedPassword,
        role: "client",
        clientId: newClient.id,
        setupCompleted: false, // Show setup modal on first login
        setupDismissed: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
