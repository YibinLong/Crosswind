import { PrismaClient } from '@prisma/client'
import { generateSampleDataForStudent } from '../lib/sampleDataGenerator'

const prisma = new PrismaClient()

async function regenerateFlightData() {
  console.log('🧹 Clearing existing flight data (bookings, weather reports, reschedule suggestions)...')

  await prisma.rescheduleSuggestion.deleteMany()
  await prisma.weatherReport.deleteMany()
  await prisma.booking.deleteMany()

  console.log('✅ Existing flight data cleared.')

  const students = await prisma.student.findMany()
  if (students.length === 0) {
    console.log('ℹ️ No students found. Skipping flight regeneration.')
    return
  }

  let totalFlights = 0
  let totalConflicts = 0

  for (const student of students) {
    const info = await generateSampleDataForStudent(
      student.id,
      student.email,
      student.name
    )

    console.log(`👤 Generated flights for ${student.name}: ${info.totalFlights} total / ${info.conflictAlerts} conflicts`)
    totalFlights += info.totalFlights
    totalConflicts += info.conflictAlerts
  }

  console.log('📊 Regeneration summary:')
  console.log(`   Students processed: ${students.length}`)
  console.log(`   Total flights created: ${totalFlights}`)
  console.log(`   Conflict alerts created: ${totalConflicts}`)
}

regenerateFlightData()
  .catch((error) => {
    console.error('❌ Failed to regenerate flight data:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
