import { Student, Booking, RescheduleSuggestion } from '@prisma/client';

export interface RescheduleConfirmationTemplateData {
  student: Student;
  booking: Booking;
  instructorName?: string;
  selectedSuggestion: RescheduleSuggestion;
  originalDate: Date;
  weatherForecast?: string;
}

export function generateRescheduleConfirmationEmail(data: RescheduleConfirmationTemplateData) {
  const { student, booking, instructorName, selectedSuggestion, originalDate, weatherForecast } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flight Rescheduled - Crosswind</title>
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .success-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .success-title {
          color: #059669;
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
        .change-highlight {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .change-title {
          color: #d97706;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .weather-info {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
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
        .calendar-icon {
          font-size: 24px;
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Flight Successfully Rescheduled</h1>
        <p>Your flight has been rescheduled to a better weather window</p>
      </div>

      <div class="content">
        <div class="success-box">
          <div class="success-title">Flight Status: CONFIRMED</div>
          <p>Dear ${student.name},</p>
          <p>Great news! Your flight has been successfully rescheduled. The new time has been selected based on optimal weather conditions and availability.</p>
        </div>

        <div class="change-highlight">
          <div class="change-title"><span class="calendar-icon">📅</span> Schedule Change</div>
          <div class="detail-row">
            <span class="detail-label">Previous Date:</span>
            <span class="detail-value">${originalDate.toLocaleDateString()} at ${originalDate.toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">New Date:</span>
            <span class="detail-value" style="color: #059669; font-weight: 600;">
              ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledDate.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div class="flight-details">
          <h3>Updated Flight Details</h3>
          <div class="detail-row">
            <span class="detail-label">Student:</span>
            <span class="detail-value">${student.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Instructor:</span>
            <span class="detail-value">${instructorName || 'To be assigned'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Training Level:</span>
            <span class="detail-value">${student.trainingLevel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="color: #059669; font-weight: 600;">CONFIRMED</span>
          </div>
        </div>

        ${weatherForecast ? `
        <div class="weather-info">
          <h3>🌤️ Weather Forecast</h3>
          <p>${weatherForecast}</p>
          <p><strong>This new time has been selected to ensure safe flying conditions for your training level.</strong></p>
        </div>
        ` : ''}

        <div class="flight-details">
          <h3>🤖 AI Selection Reasoning</h3>
          <p>${selectedSuggestion.reason}</p>
          <p><em>Confidence: ${Math.round(selectedSuggestion.confidence * 100)}%</em></p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
            View in Dashboard
          </a>
        </div>

        <p><strong>Important Reminders:</strong></p>
        <ul>
          <li>Please arrive 15 minutes before your scheduled flight time</li>
          <li>Bring your pilot certificate and medical certificate</li>
          <li>Check weather conditions before departure</li>
          <li>Confirm with your instructor 24 hours before the flight</li>
        </ul>

        <p>If you need to make any additional changes or have questions, please contact your instructor.</p>
      </div>

      <div class="footer">
        <p>This is an automated message from Crosswind - AI-Powered Flight Scheduling</p>
        <p>Please do not reply to this email. For support, contact support@crosswind.app</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
FLIGHT SUCCESSFULLY RESCHEDULED - Crosswind

Dear ${student.name},

Great news! Your flight has been successfully rescheduled. The new time has been selected based on optimal weather conditions and availability.

SCHEDULE CHANGE:
- Previous Date: ${originalDate.toLocaleDateString()} at ${originalDate.toLocaleTimeString()}
- New Date: ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledDate.toLocaleTimeString()}

UPDATED FLIGHT DETAILS:
- Student: ${student.name}
- Instructor: ${instructorName || 'To be assigned'}
- Training Level: ${student.trainingLevel}
- Status: CONFIRMED

${weatherForecast ? `WEATHER FORECAST:\n${weatherForecast}\nThis new time has been selected to ensure safe flying conditions for your training level.\n` : ''}

AI SELECTION REASONING:
${selectedSuggestion.reason}
Confidence: ${Math.round(selectedSuggestion.confidence * 100)}%

IMPORTANT REMINDERS:
- Please arrive 15 minutes before your scheduled flight time
- Bring your pilot certificate and medical certificate
- Check weather conditions before departure
- Confirm with your instructor 24 hours before the flight

Dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

If you need to make any additional changes or have questions, please contact your instructor.

---
Crosswind - AI-Powered Flight Scheduling
support@crosswind.app
  `;

  return {
    subject: `✅ Flight Rescheduled - ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledDate.toLocaleTimeString()}`,
    htmlContent,
    textContent,
  };
}