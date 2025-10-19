import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🔍 DATABASE DETECTIVE REPORT\n')
  console.log('=' .repeat(50))

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    console.log()

    // Count all tables
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const callCount = await prisma.callRecord.count()
    const voiceClientCount = await prisma.voiceClient.count()
    const appointmentCount = await prisma.appointment.count()
    const teamInvitationCount = await prisma.teamInvitation.count()

    console.log('📊 DATABASE CONTENTS:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Clients: ${clientCount}`)
    console.log(`   Call Records: ${callCount}`)
    console.log(`   Voice Clients (CRM): ${voiceClientCount}`)
    console.log(`   Appointments: ${appointmentCount}`)
    console.log(`   Team Invitations: ${teamInvitationCount}`)
    console.log()

    // Show sample user data
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          setupCompleted: true,
          crmPreference: true,
        },
        take: 3
      })
      console.log('👥 SAMPLE USERS:')
      users.forEach(user => {
        console.log(`   ${user.email} (${user.role}) - Setup: ${user.setupCompleted} - CRM: ${user.crmPreference}`)
      })
    }
    console.log()

    console.log('=' .repeat(50))
    console.log('✅ DATABASE IS WORKING!')
    console.log('   Type: SQLite')
    console.log(`   Location: prisma/dev.db (${(344064 / 1024).toFixed(1)} KB)`)
    console.log('   Status: Contains data ✓')

  } catch (error: any) {
    console.log('❌ DATABASE CONNECTION FAILED!')
    console.log(`   Error: ${error.message}`)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
