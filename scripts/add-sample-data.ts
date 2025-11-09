import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addSampleDataForExistingUsers() {
  console.log('🔧 Adding sample data for existing users...');

  try {
    // Get existing users and students
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: 'yibinlong'
        }
      },
      include: {
        student: true
      }
    });

    console.log(`Found ${users.length} users to update`);

    // Get available instructors and aircraft
    const instructors = await prisma.instructor.findMany();
    const aircraft = await prisma.aircraft.findMany();

    if (instructors.length === 0 || aircraft.length === 0) {
      console.log('Creating instructors and aircraft first...');

      // Create instructors if none exist
      if (instructors.length === 0) {
        await prisma.instructor.createMany({
          data: [
            { name: 'Captain Dave', email: 'dave@flightSchool.com' },
            { name: 'Instructor Lisa', email: 'lisa@flightSchool.com' },
          ]
        });
      }

      // Create aircraft if none exist
      if (aircraft.length === 0) {
        await prisma.aircraft.createMany({
          data: [
            { tailNumber: 'N12345', model: 'Cessna 172', status: 'available' },
            { tailNumber: 'N67890', model: 'Piper PA-28', status: 'available' },
            { tailNumber: 'N24680', model: 'Beechcraft G36', status: 'available' },
          ]
        });
      }

      // Refresh the lists
      const freshInstructors = await prisma.instructor.findMany();
      const freshAircraft = await prisma.aircraft.findMany();
      instructors.splice(0, instructors.length, ...freshInstructors);
      aircraft.splice(0, aircraft.length, ...freshAircraft);
    }

    // Create student profiles for users that don't have them
    for (const user of users) {
      if (!user.student && user.role === 'STUDENT') {
        console.log(`Creating student profile for ${user.email}`);
        await prisma.student.create({
          data: {
            name: user.name,
            email: user.email,
            trainingLevel: 'PRIVATE',
            userId: user.id,
          }
        });
      }
    }

    // Refresh users with student data
    const updatedUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'yibinlong'
        }
      },
      include: {
        student: true
      }
    });

    // Create bookings for each student
    for (const user of updatedUsers) {
      if (!user.student) continue;

      const student = user.student;
      console.log(`Creating 4 flights for ${student.name} (${student.email})`);

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Create 4 flights with different statuses
      const bookings = await Promise.all([
        // Flight 1: Conflict with weather (tomorrow morning)
        prisma.booking.create({
          data: {
            studentId: student.id,
            instructorId: instructors[0].id,
            aircraftId: aircraft[0].id,
            scheduledDate: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000), // 9 AM tomorrow
            departureLat: 37.7749, // San Francisco
            departureLon: -122.4194,
            arrivalLat: 37.6213, // San Jose
            arrivalLon: -122.3790,
            status: 'conflict',
          },
        }),
        // Flight 2: Confirmed flight (tomorrow afternoon)
        prisma.booking.create({
          data: {
            studentId: student.id,
            instructorId: instructors[1].id,
            aircraftId: aircraft[1].id,
            scheduledDate: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // 2 PM tomorrow
            departureLat: 37.7749, // San Francisco
            departureLon: -122.4194,
            arrivalLat: 38.5816, // Sacramento
            arrivalLon: -121.4944,
            status: 'confirmed',
          },
        }),
        // Flight 3: Scheduled flight (day after tomorrow)
        prisma.booking.create({
          data: {
            studentId: student.id,
            instructorId: instructors[0].id,
            aircraftId: aircraft[2].id,
            scheduledDate: new Date(dayAfter.getTime() + 10 * 60 * 60 * 1000), // 10 AM day after
            departureLat: 37.7749, // San Francisco
            departureLon: -122.4194,
            arrivalLat: 36.7783, // Fresno
            arrivalLon: -119.4179,
            status: 'scheduled',
          },
        }),
        // Flight 4: Another conflict (next week)
        prisma.booking.create({
          data: {
            studentId: student.id,
            instructorId: instructors[1].id,
            aircraftId: aircraft[0].id,
            scheduledDate: new Date(nextWeek.getTime() + 15 * 60 * 60 * 1000), // 3 PM next week
            departureLat: 37.7749, // San Francisco
            departureLon: -122.4194,
            arrivalLat: 37.3382, // San Jose again
            arrivalLon: -121.8863,
            status: 'conflict',
          },
        }),
      ]);

      console.log(`Created ${bookings.length} bookings for ${student.name}`);

      // Create weather reports for conflict bookings (3 alerts)
      const conflictBookings = bookings.filter(b => b.status === 'conflict');

      for (const conflictBooking of conflictBookings) {
        console.log(`Creating weather alert for booking ${conflictBooking.id}`);

        // Create weather report
        await prisma.weatherReport.create({
          data: {
            bookingId: conflictBooking.id,
            location: 'departure',
            windKts: 28 + Math.random() * 10, // 28-38 kts
            windGustKts: 35 + Math.random() * 15, // 35-50 kts
            visibility: 1.5 + Math.random() * 2, // 1.5-3.5 miles
            ceilingFt: 600 + Math.floor(Math.random() * 400), // 600-1000 ft
            condition: Math.random() > 0.5 ? 'Thunderstorm' : 'Heavy Rain',
            temperature: 12 + Math.random() * 8, // 12-20°C
            isSafe: false,
            violatedMinimums: ['wind_speed', 'visibility', 'ceiling'],
          },
        });

        // Create reschedule suggestions
        const rescheduleDate = new Date(conflictBooking.scheduledDate.getTime() + 24 * 60 * 60 * 1000); // Next day

        await Promise.all([
          prisma.rescheduleSuggestion.create({
            data: {
              bookingId: conflictBooking.id,
              proposedDate: new Date(rescheduleDate.getTime() + 10 * 60 * 60 * 1000), // 10 AM
              proposedTime: '10:00 AM',
              weatherSummary: 'Clear skies, light winds 8-12 kts, visibility 10+ miles',
              confidence: 0.95,
              reason: 'Excellent weather conditions forecast with VFR conditions throughout the day',
            },
          }),
          prisma.rescheduleSuggestion.create({
            data: {
              bookingId: conflictBooking.id,
              proposedDate: new Date(rescheduleDate.getTime() + 14 * 60 * 60 * 1000), // 2 PM
              proposedTime: '2:00 PM',
              weatherSummary: 'Partly cloudy, moderate winds 12-18 kts, visibility 8 miles',
              confidence: 0.85,
              reason: 'Good conditions with some cloud cover but well within minimums',
            },
          }),
          prisma.rescheduleSuggestion.create({
            data: {
              bookingId: conflictBooking.id,
              proposedDate: new Date(rescheduleDate.getTime() + 17 * 60 * 60 * 1000), // 5 PM
              proposedTime: '5:00 PM',
              weatherSummary: 'Mostly sunny, light winds 6-10 kts, visibility 10+ miles',
              confidence: 0.90,
              reason: 'Late afternoon with stable conditions and good visibility',
            },
          }),
        ]);

        console.log(`Created weather report and reschedule suggestions for booking ${conflictBooking.id}`);
      }
    }

    console.log('\n✅ Sample data creation completed successfully!');

    // Show summary
    const totalBookings = await prisma.booking.count({
      where: {
        student: {
          email: {
            contains: 'yibinlong'
          }
        }
      }
    });

    const totalConflicts = await prisma.booking.count({
      where: {
        status: 'conflict',
        student: {
          email: {
            contains: 'yibinlong'
          }
        }
      }
    });

    console.log(`📊 Summary for users with 'yibinlong' email:`);
    console.log(`  Total Bookings: ${totalBookings}`);
    console.log(`  Conflict Alerts: ${totalConflicts}`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    throw error;
  }
}

addSampleDataForExistingUsers()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });