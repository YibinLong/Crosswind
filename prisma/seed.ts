import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.rescheduleSuggestion.deleteMany();
  await prisma.weatherReport.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@crosswind.app',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@crosswind.app',
      password: hashedPassword,
      name: 'John Student',
      role: 'student',
    },
  });

  console.log('👥 Created users');

  // Create students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'John Student',
        email: 'john@flightSchool.com',
                trainingLevel: 'private',
        userId: studentUser.id,
      },
    }),
    prisma.student.create({
      data: {
        name: 'Sarah Pilot',
        email: 'sarah@flightSchool.com',
                trainingLevel: 'instrument',
      },
    }),
    prisma.student.create({
      data: {
        name: 'Mike Aviator',
        email: 'mike@flightSchool.com',
                trainingLevel: 'commercial',
      },
    }),
  ]);

  console.log('✈️ Created students');

  // Create instructors
  const instructors = await Promise.all([
    prisma.instructor.create({
      data: {
        name: 'Captain Dave',
        email: 'dave@flightSchool.com',
              },
    }),
    prisma.instructor.create({
      data: {
        name: 'Instructor Lisa',
        email: 'lisa@flightSchool.com',
              },
    }),
  ]);

  console.log('👨‍✈️ Created instructors');

  // Create aircraft
  const aircraft = await Promise.all([
    prisma.aircraft.create({
      data: {
        tailNumber: 'N12345',
        model: 'Cessna 172',
        status: 'available',
      },
    }),
    prisma.aircraft.create({
      data: {
        tailNumber: 'N67890',
        model: 'Piper PA-28',
        status: 'available',
      },
    }),
    prisma.aircraft.create({
      data: {
        tailNumber: 'N24680',
        model: 'Beechcraft G36',
        status: 'maintenance',
      },
    }),
  ]);

  console.log('✈️ Created aircraft');

  // Create bookings
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const bookings = await Promise.all([
    // Confirmed booking for tomorrow
    prisma.booking.create({
      data: {
        studentId: students[0].id,
        instructorId: instructors[0].id,
        aircraftId: aircraft[0].id,
        scheduledDate: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM tomorrow
        departureLat: 37.7749, // San Francisco
        departureLon: -122.4194,
        arrivalLat: 37.6213, // San Jose
        arrivalLon: -122.3790,
        status: 'confirmed',
      },
    }),
    // Scheduled booking for next week
    prisma.booking.create({
      data: {
        studentId: students[1].id,
        instructorId: instructors[1].id,
        aircraftId: aircraft[1].id,
        scheduledDate: new Date(nextWeek.getTime() + 14 * 60 * 60 * 1000), // 2 PM next week
        departureLat: 37.7749, // San Francisco
        departureLon: -122.4194,
        arrivalLat: 38.5816, // Sacramento
        arrivalLon: -121.4944,
        status: 'scheduled',
      },
    }),
    // Conflict booking (simulated weather issue)
    prisma.booking.create({
      data: {
        studentId: students[2].id,
        instructorId: instructors[0].id,
        aircraftId: aircraft[0].id,
        scheduledDate: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000), // 3 PM tomorrow
        departureLat: 37.7749, // San Francisco
        departureLon: -122.4194,
        arrivalLat: 36.7783, // Fresno
        arrivalLon: -119.4179,
        status: 'conflict',
      },
    }),
  ]);

  console.log('📅 Created bookings');

  // Create weather reports for the conflict booking
  await Promise.all([
    prisma.weatherReport.create({
      data: {
        bookingId: bookings[2].id,
        location: 'departure',
        windKts: 25,
        windGustKts: 35,
        visibility: 2.5,
        ceilingFt: 800,
        condition: 'Rain',
        temperature: 15,
        isSafe: false,
        violatedMinimums: ['wind_speed', 'visibility', 'ceiling'],
      },
    }),
    prisma.weatherReport.create({
      data: {
        bookingId: bookings[2].id,
        location: 'arrival',
        windKts: 30,
        windGustKts: 40,
        visibility: 1.8,
        ceilingFt: 600,
        condition: 'Thunderstorm',
        temperature: 14,
        isSafe: false,
        violatedMinimums: ['wind_speed', 'visibility', 'ceiling'],
      },
    }),
  ]);

  console.log('🌤️ Created weather reports');

  // Create reschedule suggestions for the conflict booking
  const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.rescheduleSuggestion.create({
      data: {
        bookingId: bookings[2].id,
        proposedDate: new Date(dayAfterTomorrow.getTime() + 10 * 60 * 60 * 1000),
        proposedTime: '10:00 AM',
        weatherSummary: 'Clear skies, light winds 8-12 kts, visibility 10+ miles',
        confidence: 0.95,
        reason: 'Excellent weather conditions forecast with VFR conditions throughout the day',
      },
    }),
    prisma.rescheduleSuggestion.create({
      data: {
        bookingId: bookings[2].id,
        proposedDate: new Date(dayAfterTomorrow.getTime() + 14 * 60 * 60 * 1000),
        proposedTime: '2:00 PM',
        weatherSummary: 'Partly cloudy, moderate winds 12-18 kts, visibility 8 miles',
        confidence: 0.85,
        reason: 'Good conditions with some cloud cover but well within minimums',
      },
    }),
    prisma.rescheduleSuggestion.create({
      data: {
        bookingId: bookings[2].id,
        proposedDate: new Date(dayAfterTomorrow.getTime() + 17 * 60 * 60 * 1000),
        proposedTime: '5:00 PM',
        weatherSummary: 'Mostly sunny, light winds 6-10 kts, visibility 10+ miles',
        confidence: 0.90,
        reason: 'Late afternoon with stable conditions and good visibility',
      },
    }),
  ]);

  console.log('💡 Created reschedule suggestions');

  // Create audit logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        bookingId: bookings[0].id,
        action: 'booking_created',
        performedBy: 'john@flightSchool.com',
        details: JSON.stringify({
          student: 'John Student',
          instructor: 'Captain Dave',
          aircraft: 'N12345',
        }),
      },
    }),
    prisma.auditLog.create({
      data: {
        bookingId: bookings[2].id,
        action: 'conflict_detected',
        performedBy: 'system',
        details: JSON.stringify({
          reason: 'Weather minimums violated',
          violatedMinimums: ['wind_speed', 'visibility', 'ceiling'],
        }),
      },
    }),
    prisma.auditLog.create({
      data: {
        bookingId: bookings[2].id,
        action: 'reschedule_suggested',
        performedBy: 'system',
        details: JSON.stringify({
          suggestionsCount: 3,
          averageConfidence: 0.90,
        }),
      },
    }),
  ]);

  console.log('📋 Created audit logs');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  Users: 2`);
  console.log(`  Students: ${students.length}`);
  console.log(`  Instructors: ${instructors.length}`);
  console.log(`  Aircraft: ${aircraft.length}`);
  console.log(`  Bookings: ${bookings.length}`);
  console.log(`  Weather Reports: 2`);
  console.log(`  Reschedule Suggestions: 3`);
  console.log(`  Audit Logs: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });