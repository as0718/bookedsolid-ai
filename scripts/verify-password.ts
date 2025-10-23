import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function verifyPassword() {
  const testPassword = process.env.ADMIN_PASSWORD || "ChangeMe2025!";

  console.log("🔐 Verifying admin password...");
  console.log(`   Testing with password: ${testPassword}`);

  const admin = await prisma.user.findUnique({
    where: { email: "admin@bookedsolid.ai" },
    select: { id: true, email: true, password: true },
  });

  if (!admin) {
    console.log("❌ No admin user found");
    await prisma.$disconnect();
    return;
  }

  if (!admin.password) {
    console.log("❌ Admin user has no password set");
    await prisma.$disconnect();
    return;
  }

  const isValid = await bcrypt.compare(testPassword, admin.password);

  if (isValid) {
    console.log("✅ Password is CORRECT!");
    console.log("");
    console.log("You can now login with:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${testPassword}`);
  } else {
    console.log("❌ Password is INCORRECT");
    console.log("");
    console.log("The password in .env does not match the database.");
    console.log("Try these solutions:");
    console.log("1. Check your .env file for ADMIN_PASSWORD");
    console.log("2. Update the admin password in the database");
    console.log("3. Reset the database with: FORCE_CLEAR_DATA=true npm run db:seed");
  }

  await prisma.$disconnect();
}

verifyPassword();
