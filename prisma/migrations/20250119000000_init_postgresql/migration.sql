-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'BOOKED', 'CUSTOMER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupDismissed" BOOLEAN NOT NULL DEFAULT false,
    "setupCompletedAt" TIMESTAMP(3),
    "crmPreference" TEXT NOT NULL DEFAULT 'BOOKEDSOLID_CRM',
    "fullName" TEXT,
    "hasExternalCRM" BOOLEAN,
    "preferredCRM" TEXT,
    "crmAccessEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isTeamMember" BOOLEAN NOT NULL DEFAULT false,
    "teamRole" TEXT,
    "teamPermissions" TEXT NOT NULL DEFAULT 'view_only',
    "teamJoinedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "businessOwnerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'missed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactName" TEXT,
    "pointOfContact" TEXT,
    "pocPhone" TEXT,
    "pocEmail" TEXT,
    "location" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "stripePriceId" TEXT,
    "billingInterval" TEXT NOT NULL DEFAULT 'month',
    "subscriptionEndsAt" TIMESTAMP(3),
    "billing" JSONB NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callerName" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "transcriptUrl" TEXT,
    "retellCallId" TEXT,
    "agentId" TEXT,
    "callType" TEXT,
    "toNumber" TEXT,
    "direction" TEXT,
    "callStatus" TEXT,
    "startTimestamp" TEXT,
    "endTimestamp" TEXT,
    "disconnectionReason" TEXT,
    "transcript" TEXT,
    "transcriptObject" JSONB,
    "transcriptWithToolCalls" JSONB,
    "metadata" JSONB,
    "llmDynamicVariables" JSONB,
    "optOutSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDetails" JSONB,
    "voiceClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'BookedSolid AI',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@bookedsolid.ai',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "notifyNewClientSignup" BOOLEAN NOT NULL DEFAULT true,
    "notifyClientNearLimit" BOOLEAN NOT NULL DEFAULT true,
    "notifySystemErrors" BOOLEAN NOT NULL DEFAULT true,
    "notifyWeeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT DEFAULT 'smtp.gmail.com',
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "fromEmail" TEXT DEFAULT 'noreply@bookedsolid.ai',
    "smtpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "apiRateLimit" INTEGER NOT NULL DEFAULT 1000,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "customSettings" JSONB,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceClient" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "clientName" TEXT,
    "email" TEXT,
    "serviceType" TEXT,
    "notes" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VoiceClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specialistId" TEXT,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'view_only',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "User_isTeamMember_idx" ON "User"("isTeamMember");

-- CreateIndex
CREATE INDEX "User_businessOwnerId_idx" ON "User"("businessOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_stripeCustomerId_key" ON "Client"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_stripeSubscriptionId_key" ON "Client"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Client_stripeCustomerId_idx" ON "Client"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Client_stripeSubscriptionId_idx" ON "Client"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Client_location_idx" ON "Client"("location");

-- CreateIndex
CREATE INDEX "Client_stripeSubscriptionStatus_idx" ON "Client"("stripeSubscriptionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CallRecord_retellCallId_key" ON "CallRecord"("retellCallId");

-- CreateIndex
CREATE INDEX "CallRecord_clientId_idx" ON "CallRecord"("clientId");

-- CreateIndex
CREATE INDEX "CallRecord_timestamp_idx" ON "CallRecord"("timestamp");

-- CreateIndex
CREATE INDEX "CallRecord_outcome_idx" ON "CallRecord"("outcome");

-- CreateIndex
CREATE INDEX "CallRecord_retellCallId_idx" ON "CallRecord"("retellCallId");

-- CreateIndex
CREATE INDEX "CallRecord_callStatus_idx" ON "CallRecord"("callStatus");

-- CreateIndex
CREATE INDEX "CallRecord_direction_idx" ON "CallRecord"("direction");

-- CreateIndex
CREATE INDEX "CallRecord_voiceClientId_idx" ON "CallRecord"("voiceClientId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "VoiceClient_userId_idx" ON "VoiceClient"("userId");

-- CreateIndex
CREATE INDEX "VoiceClient_phoneNumber_idx" ON "VoiceClient"("phoneNumber");

-- CreateIndex
CREATE INDEX "VoiceClient_status_idx" ON "VoiceClient"("status");

-- CreateIndex
CREATE INDEX "VoiceClient_createdAt_idx" ON "VoiceClient"("createdAt");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_specialistId_idx" ON "Appointment"("specialistId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_idx" ON "TeamInvitation"("email");

-- CreateIndex
CREATE INDEX "TeamInvitation_token_idx" ON "TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_invitedById_idx" ON "TeamInvitation"("invitedById");

-- CreateIndex
CREATE INDEX "TeamInvitation_businessId_idx" ON "TeamInvitation"("businessId");

-- CreateIndex
CREATE INDEX "TeamInvitation_status_idx" ON "TeamInvitation"("status");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_voiceClientId_fkey" FOREIGN KEY ("voiceClientId") REFERENCES "VoiceClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceClient" ADD CONSTRAINT "VoiceClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "VoiceClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

