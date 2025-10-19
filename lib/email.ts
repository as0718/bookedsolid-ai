import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

interface TeamInvitationEmailParams {
  to: string;
  inviterName: string;
  businessName: string;
  invitationUrl: string;
  role: string;
}

/**
 * Send team invitation email using Resend
 */
export async function sendTeamInvitationEmail({
  to,
  inviterName,
  businessName,
  invitationUrl,
  role,
}: TeamInvitationEmailParams) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email] Resend API key not configured');
      throw new Error('Email service not configured');
    }

    console.log('[Email] Attempting to send invitation to:', to);
    console.log('[Email] From address:', FROM_EMAIL);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `You've been invited to join ${businessName}`,
      html: getTeamInvitationEmailTemplate({
        inviterName,
        businessName,
        invitationUrl,
        role,
      }),
    });

    if (error) {
      console.error('[Email] ❌ Failed to send invitation to:', to);
      console.error('[Email] Error details:', JSON.stringify(error, null, 2));

      // Check for common Resend errors
      if (FROM_EMAIL.includes('resend.dev')) {
        console.warn('[Email] ⚠️  WARNING: Using onboarding@resend.dev which only works with verified test emails!');
        console.warn('[Email] 📝 Solution: Either verify your domain or add recipient to verified test emails in Resend dashboard');
        console.warn('[Email] 🔗 Dashboard: https://resend.com/emails');
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('[Email] ✅ Team invitation sent successfully to:', to);
    console.log('[Email] Message ID:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] ❌ Error sending team invitation:', error);
    throw error;
  }
}

/**
 * HTML email template for team invitations
 */
function getTeamInvitationEmailTemplate({
  inviterName,
  businessName,
  invitationUrl,
  role,
}: Omit<TeamInvitationEmailParams, 'to'>) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">
                You've Been Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                Hi there,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #374151;">
                <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 24px; color: #374151;">
                Click the button below to accept this invitation and create your account:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; font-size: 14px; line-height: 20px; color: #2563eb; word-break: break-all;">
                ${invitationUrl}
              </p>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center;">
                &copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Test email configuration by sending a test email
 */
export async function testEmailConfiguration(testEmail: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'RESEND_API_KEY not configured in environment variables',
      };
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return {
        success: false,
        error: 'RESEND_FROM_EMAIL not configured in environment variables',
      };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [testEmail],
      subject: 'Email Configuration Test',
      html: `
        <h1>Email Configuration Test</h1>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
