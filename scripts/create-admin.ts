import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@bookedsolid.ai';
  const adminPassword = 'AdminAccess2025!';

  console.log('Creating admin user...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists!');

    // Update password if needed
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        role: 'admin',
      },
    });

    console.log('Admin user updated successfully!');
  } else {
    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        setupCompleted: true,
        setupDismissed: true,
      },
    });

    console.log('Admin user created successfully!');
  }

  console.log(`
Admin Credentials:
------------------
Email: ${adminEmail}
Password: ${adminPassword}
Login URL: http://localhost:3000/admin/login
  `);
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
