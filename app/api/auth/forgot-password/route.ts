import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // In production, this prevents attackers from discovering valid emails
    const response = {
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
    };

    if (!user) {
      // Still return success, but don't actually send an email
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(response);
    }

    // Only proceed if user has a password (not OAuth-only users)
    if (!user.password) {
      console.log(`Password reset requested for OAuth-only user: ${email}`);
      return NextResponse.json(response);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 3600000);

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: hashedToken,
        expires,
      },
    });

    // Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Send email (implement actual email sending in production)
    await sendPasswordResetEmail(email, resetUrl, user.name || "User");

    console.log("=".repeat(80));
    console.log("PASSWORD RESET EMAIL");
    console.log("=".repeat(80));
    console.log(`To: ${email}`);
    console.log(`Name: ${user.name || "User"}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("=".repeat(80));
    console.log("NOTE: In production, this will be sent via email service (Resend/SendGrid)");
    console.log("=".repeat(80));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}

// Email sending function (to be implemented with real email service)
async function sendPasswordResetEmail(email: string, resetUrl: string, name: string) {
  // In production, implement with Resend, SendGrid, or similar
  // For now, we'll just log it

  const emailTemplate = `
    Hi ${name},

    You requested to reset your password for BookedSolid AI.

    Click the link below to reset your password:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this, please ignore this email.

    Best regards,
    BookedSolid AI Team
  `;

  // TODO: Implement actual email sending
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'noreply@bookedsolid.ai',
  //   to: email,
  //   subject: 'Reset Your Password',
  //   text: emailTemplate,
  // });

  return Promise.resolve();
}
