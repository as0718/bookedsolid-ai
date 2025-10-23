import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@bookedsolid.ai" },
    select: { id: true, email: true, name: true, role: true, password: true },
  });

  if (admin) {
    console.log("✓ Admin user found:");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Password hash: ${admin.password?.substring(0, 20)}...`);
  } else {
    console.log("❌ No admin user found");
  }

  await prisma.$disconnect();
}

checkAdmin();
