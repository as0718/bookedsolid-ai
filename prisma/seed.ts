import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.warn("⚠️  Running in PRODUCTION mode");
    console.warn("⚠️  Only essential data will be seeded");
  }

  // Clear existing data (only in development)
  if (!isProduction) {
    console.log("Clearing existing data...");
    await prisma.callRecord.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    await prisma.client.deleteMany();
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@bookedsolid.ai" },
  });

  if (existingAdmin) {
    console.log("✓ Admin user already exists, skipping seed");
    return;
  }

  // Create admin user with hashed password
  console.log("Creating admin user...");
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe2025!";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: "admin@bookedsolid.ai",
      name: "Admin User",
      password: hashedAdminPassword,
      role: "admin",
      emailVerified: new Date(),
    },
  });

  console.log("✓ Created admin user: admin@bookedsolid.ai");

  if (!isProduction) {
    console.log(`  Password: ${adminPassword}`);
    console.log("  ⚠️  Please change this password immediately!");
  }

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
