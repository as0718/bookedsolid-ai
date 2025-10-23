import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PRODUCTION database seed...");

  // Safety check: ONLY run in production
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ This script is PRODUCTION-ONLY");
    console.error("❌ Set NODE_ENV=production to run this script");
    console.error("");
    console.error("For local development, use: npm run db:seed");
    process.exit(1);
  }

  console.warn("⚠️  Running in PRODUCTION mode");
  console.warn("⚠️  This will create an admin user in your PRODUCTION database");

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@bookedsolid.ai" },
  });

  if (existingAdmin) {
    console.log("✓ Admin user already exists in production");
    console.log("  Email: admin@bookedsolid.ai");
    console.log("  No changes made");
    return;
  }

  // Create admin user with hashed password
  console.log("Creating admin user in PRODUCTION database...");
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

  console.log("✓ Created admin user in PRODUCTION: admin@bookedsolid.ai");
  console.log("  ⚠️  IMPORTANT: Change the admin password immediately after first login!");
  console.log("");
  console.log("🎉 Production database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding production database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
