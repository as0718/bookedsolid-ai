import { PrismaClient } from "@prisma/client";
import { allClients, demoUsers, demoCallHistory } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.callRecord.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  // Seed Clients
  console.log("Seeding clients...");
  for (const client of allClients) {
    await prisma.client.create({
      data: {
        id: client.id,
        businessName: client.businessName,
        email: client.email,
        phone: client.phone,
        plan: client.plan,
        status: client.status,
        timezone: client.timezone,
        createdAt: new Date(client.createdDate),
        billing: client.billing,
        settings: client.settings,
      },
    });
  }
  console.log(`✓ Created ${allClients.length} clients`);

  // Seed Users
  console.log("Seeding users...");
  for (const user of demoUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        emailVerified: new Date(), // Mark as verified for demo
      },
    });
  }
  console.log(`✓ Created ${demoUsers.length} users`);

  // Seed Call Records
  console.log("Seeding call records...");
  let callCount = 0;
  for (const call of demoCallHistory) {
    await prisma.callRecord.create({
      data: {
        id: call.id,
        clientId: call.clientId,
        timestamp: new Date(call.timestamp),
        callerName: call.callerName,
        callerPhone: call.callerPhone,
        duration: call.duration,
        outcome: call.outcome,
        notes: call.notes,
        recordingUrl: call.recordingUrl,
        transcriptUrl: call.transcriptUrl,
        appointmentDetails: call.appointmentDetails || null,
      },
    });
    callCount++;
  }
  console.log(`✓ Created ${callCount} call records`);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
