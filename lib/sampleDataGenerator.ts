import { prisma } from './prisma'

export async function generateSampleDataForStudent(studentId: number, studentEmail: string, studentName: string) {
  try {
    console.log(`🔧 Generating sample data for new student: ${studentName} (${studentEmail})`);

    // Get available instructors and aircraft
    const instructors = await prisma.instructor.findMany();
    const aircraft = await prisma.aircraft.findMany();

    if (instructors.length === 0) {
      // Create instructors if none exist
      await prisma.instructor.createMany({
        data: [
          { name: 'Captain Dave', email: 'dave@flightSchool.com' },
          { name: 'Instructor Lisa', email: 'lisa@flightSchool.com' },
        ]
      });
    }

    if (aircraft.length === 0) {
      // Create aircraft if none exist
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

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Generate 25 flights for the new student with 10 conflicts
    const bookings: any[] = [];

    // Conflict flights (10 total)
    const conflictDates = [
      new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000), // 9 AM tomorrow
      new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000), // 3 PM tomorrow
      new Date(dayAfter.getTime() + 10 * 60 * 60 * 1000), // 10 AM day after
      new Date(dayAfter.getTime() + 16 * 60 * 60 * 1000), // 4 PM day after
      new Date(nextWeek.getTime() + 11 * 60 * 60 * 1000), // 11 AM next week
      new Date(nextWeek.getTime() + 14 * 60 * 60 * 1000), // 2 PM next week
      new Date(nextWeek.getTime() + 17 * 60 * 60 * 1000), // 5 PM next week
      new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM in 10 days
      new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 1 PM in 12 days
      new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // 4 PM in 14 days
    ];

    // Conflict bookings
    for (let i = 0; i < 10; i++) {
      const instructor = freshInstructors[i % freshInstructors.length];
      const aircraft = freshAircraft[i % freshAircraft.length];

      const booking = await prisma.booking.create({
        data: {
          studentId,
          instructorId: instructor.id,
          aircraftId: aircraft.id,
          scheduledDate: conflictDates[i],
          departureLat: 37.7749 + (Math.random() - 0.5) * 0.5, // San Francisco area
          departureLon: -122.4194 + (Math.random() - 0.5) * 0.5,
          arrivalLat: 37.6213 + (Math.random() - 0.5) * 0.5, // Bay area destinations
          arrivalLon: -122.3790 + (Math.random() - 0.5) * 0.5,
          status: 'conflict',
        },
      });
      bookings.push(booking);
    }

    // Non-conflict flights (15 total)
    const confirmedDates = [
      new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12 PM tomorrow
      new Date(dayAfter.getTime() + 14 * 60 * 60 * 1000), // 2 PM day after
      new Date(nextWeek.getTime() + 9 * 60 * 60 * 1000), // 9 AM next week
      new Date(nextWeek.getTime() + 16 * 60 * 60 * 1000), // 4 PM next week
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM in 3 days
      new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM in 3 days
      new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11 AM in 5 days
      new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 2 PM in 5 days
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM in 7 days
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 1 PM in 7 days
      new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 AM in 9 days
      new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3 PM in 11 days
      new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 12 PM in 13 days
      new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9 AM in 15 days
      new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 2 PM in 16 days
    ];

    // Non-conflict bookings (mix of confirmed and scheduled)
    for (let i = 0; i < 15; i++) {
      const instructor = freshInstructors[(i + 2) % freshInstructors.length];
      const aircraft = freshAircraft[(i + 2) % freshAircraft.length];
      const status = i < 8 ? 'confirmed' : 'scheduled';

      const booking = await prisma.booking.create({
        data: {
          studentId,
          instructorId: instructor.id,
          aircraftId: aircraft.id,
          scheduledDate: confirmedDates[i],
          departureLat: 37.7749 + (Math.random() - 0.5) * 0.5, // San Francisco area
          departureLon: -122.4194 + (Math.random() - 0.5) * 0.5,
          arrivalLat: 37.6213 + (Math.random() - 0.5) * 0.5, // Bay area destinations
          arrivalLon: -122.3790 + (Math.random() - 0.5) * 0.5,
          status: status,
        },
      });
      bookings.push(booking);
    }

    console.log(`✅ Created ${bookings.length} flights for ${studentName}`);

    // Create weather reports and reschedule suggestions for conflict bookings (10 alerts)
    const conflictBookings = bookings.filter(b => b.status === 'conflict');

    for (const conflictBooking of conflictBookings) {
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
    }

    console.log(`✅ Created ${conflictBookings.length} weather alerts for ${studentName}`);

    return {
      totalFlights: bookings.length,
      conflictAlerts: conflictBookings.length
    };

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    throw error;
  }
}