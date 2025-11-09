import { Student, Booking, Aircraft } from '@prisma/client';

export interface FlightReminderTemplateData {
  student: Student;
  booking: Booking;
  aircraft: Aircraft;
  instructorName?: string;
  weatherForecast?: string;
  hoursUntilFlight: number;
}

export function generateFlightReminderEmail(data: FlightReminderTemplateData) {
  const { student, booking, aircraft, instructorName, weatherForecast, hoursUntilFlight } = data;

  const urgencyLevel = hoursUntilFlight <= 24 ? 'high' : hoursUntilFlight <= 72 ? 'medium' : 'low';
  const urgencyColor = urgencyLevel === 'high' ? '#dc2626' : urgencyLevel === 'medium' ? '#d97706' : '#059669';
  const urgencyIcon = urgencyLevel === 'high' ? '⏰' : urgencyLevel === 'medium' ? '📅' : '✈️';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flight Reminder - Crosswind</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .reminder-box {
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .reminder-title {
          color: #1d4ed8;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 10px;
        }
        .flight-details {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        .detail-value {
          color: #111827;
        }
        .countdown-box {
          background: ${urgencyColor};
          color: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .countdown-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .countdown-subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        .weather-info {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .checklist {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .checklist-title {
          color: #d97706;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .checklist-item {
          margin: 8px 0;
          display: flex;
          align-items: center;
        }
        .checklist-item::before {
          content: "✓";
          color: #059669;
          font-weight: bold;
          margin-right: 10px;
        }
        .cta-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .cta-button:hover {
          background: #2563eb;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          color: #6b7280;
          font-size: 14px;
        }
        .urgency-high {
          color: #dc2626;
          font-weight: 600;
        }
        .urgency-medium {
          color: #d97706;
          font-weight: 600;
        }
        .urgency-low {
          color: #059669;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${urgencyIcon} Flight Reminder</h1>
        <p>Your upcoming flight is scheduled soon</p>
      </div>

      <div class="content">
        <div class="countdown-box">
          <div class="countdown-title">${hoursUntilFlight} hours</div>
          <div class="countdown-subtitle">until your scheduled flight</div>
        </div>

        <div class="reminder-box">
          <div class="reminder-title">Flight Status: SCHEDULED</div>
          <p>Dear ${student.name},</p>
          <p>This is a friendly reminder about your upcoming flight. Please review the details below and ensure you're prepared for your lesson.</p>
        </div>

        <div class="flight-details">
          <h3>Flight Details</h3>
          <div class="detail-row">
            <span class="detail-label">Student:</span>
            <span class="detail-value">${student.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Instructor:</span>
            <span class="detail-value">${instructorName || 'To be assigned'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value urgency-${urgencyLevel}">${booking.scheduledDate.toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value urgency-${urgencyLevel}">${booking.scheduledDate.toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Aircraft:</span>
            <span class="detail-value">${aircraft.tailNumber} (${aircraft.model})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Training Level:</span>
            <span class="detail-value">${student.trainingLevel}</span>
          </div>
        </div>

        ${weatherForecast ? `
        <div class="weather-info">
          <h3>🌤️ Weather Forecast</h3>
          <p>${weatherForecast}</p>
        </div>
        ` : ''}

        <div class="checklist">
          <div class="checklist-title">📋 Pre-Flight Checklist</div>
          <div class="checklist-item">Bring your pilot certificate and medical certificate</div>
          <div class="checklist-item">Review your flight plan and maneuvers</div>
          <div class="checklist-item">Check weather conditions before departure</div>
          <div class="checklist-item">Arrive 15 minutes before scheduled time</div>
          <div class="checklist-item">Confirm with your instructor if you haven't already</div>
          ${hoursUntilFlight <= 24 ? '<div class="checklist-item">Bring adequate water and snacks</div>' : ''}
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
            View Flight Details
          </a>
        </div>

        ${hoursUntilFlight <= 24 ? `
        <div class="reminder-box" style="border-color: #fca5a5; background: #fef2f2;">
          <div class="reminder-title" style="color: #dc2626;">⚠️ Important - Flight Tomorrow</div>
          <p>Your flight is scheduled for tomorrow! Please make sure to:</p>
          <ul>
            <li>Confirm with your instructor today</li>
            <li>Check the weather forecast tonight</li>
            <li>Get a good night's sleep</li>
            <li>Plan your route to the airport</li>
          </ul>
        </div>
        ` : ''}

        <p><strong>Contact Information:</strong></p>
        <ul>
          <li>Instructor: ${instructorName || 'To be assigned'}</li>
          <li>Your Email: ${student.email}</li>
          <li>Support: support@crosswind.app</li>
        </ul>

        <p>If you need to reschedule or have any questions, please contact your instructor as soon as possible.</p>
      </div>

      <div class="footer">
        <p>This is an automated message from Crosswind - AI-Powered Flight Scheduling</p>
        <p>Please do not reply to this email. For support, contact support@crosswind.app</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
FLIGHT REMINDER - Crosswind

Dear ${student.name},

This is a friendly reminder about your upcoming flight. Please review the details below and ensure you're prepared for your lesson.

TIME REMAINING: ${hoursUntilFlight} hours

FLIGHT DETAILS:
- Student: ${student.name}
- Instructor: ${instructorName || 'To be assigned'}
- Date: ${booking.scheduledDate.toLocaleDateString()}
- Time: ${booking.scheduledDate.toLocaleTimeString()}
- Aircraft: ${aircraft.tailNumber} (${aircraft.model})
- Training Level: ${student.trainingLevel}

${weatherForecast ? `WEATHER FORECAST:\n${weatherForecast}\n` : ''}

PRE-FLIGHT CHECKLIST:
✓ Bring your pilot certificate and medical certificate
✓ Review your flight plan and maneuvers
✓ Check weather conditions before departure
✓ Arrive 15 minutes before scheduled time
✓ Confirm with your instructor if you haven't already
${hoursUntilFlight <= 24 ? '✓ Bring adequate water and snacks' : ''}

${hoursUntilFlight <= 24 ? `IMPORTANT - FLIGHT TOMORROW:
Your flight is scheduled for tomorrow! Please make sure to:
- Confirm with your instructor today
- Check the weather forecast tonight
- Get a good night's sleep
- Plan your route to the airport

` : ''}CONTACT INFORMATION:
- Instructor: ${instructorName || 'To be assigned'}
- Your Email: ${student.email}
- Support: support@crosswind.app

Dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

If you need to reschedule or have any questions, please contact your instructor as soon as possible.

---
Crosswind - AI-Powered Flight Scheduling
support@crosswind.app
  `;

  return {
    subject: `${urgencyIcon} Flight Reminder - ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledDate.toLocaleTimeString()}`,
    htmlContent,
    textContent,
  };
}