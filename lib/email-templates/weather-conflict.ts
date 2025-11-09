import { Student, Booking, WeatherReport } from '@prisma/client';

export interface WeatherConflictTemplateData {
  student: Student;
  booking: Booking;
  weatherReport: WeatherReport;
  instructorName?: string;
  trainingLevelMinimums: string[];
}

export function generateWeatherConflictEmail(data: WeatherConflictTemplateData) {
  const { student, booking, weatherReport, instructorName, trainingLevelMinimums } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weather Conflict Alert - Crosswind</title>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .alert-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .alert-title {
          color: #dc2626;
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
        .weather-info {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .violation-item {
          color: #dc2626;
          font-weight: 500;
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Weather Conflict Alert</h1>
        <p>Your scheduled flight has been affected by weather conditions</p>
      </div>

      <div class="content">
        <div class="alert-box">
          <div class="alert-title">Flight Status: CONFLICT DETECTED</div>
          <p>Dear ${student.name},</p>
          <p>We've detected unsafe weather conditions for your upcoming flight. Your flight has been automatically flagged and requires rescheduling.</p>
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
            <span class="detail-label">Scheduled Date:</span>
            <span class="detail-value">${booking.scheduledDate.toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Scheduled Time:</span>
            <span class="detail-value">${booking.scheduledDate.toLocaleTimeString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Training Level:</span>
            <span class="detail-value">${student.trainingLevel}</span>
          </div>
        </div>

        <div class="weather-info">
          <h3>🌤️ Weather Conditions</h3>
          <div class="detail-row">
            <span class="detail-label">Wind Speed:</span>
            <span class="detail-value">${weatherReport.windKts} knots ${weatherReport.windGustKts ? `(gusts to ${weatherReport.windGustKts} knots)` : ''}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Visibility:</span>
            <span class="detail-value">${weatherReport.visibility} miles</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ceiling:</span>
            <span class="detail-value">${weatherReport.ceilingFt} feet</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Condition:</span>
            <span class="detail-value">${weatherReport.condition}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Temperature:</span>
            <span class="detail-value">${weatherReport.temperature}°F</span>
          </div>
        </div>

        ${trainingLevelMinimums.length > 0 ? `
        <div class="alert-box">
          <div class="alert-title">Safety Minimums Violated</div>
          <ul>
            ${trainingLevelMinimums.map(minimum => `<li class="violation-item">${minimum}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
            View Reschedule Options
          </a>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Log in to your Crosswind dashboard</li>
          <li>Review AI-generated reschedule suggestions</li>
          <li>Select a new time that works for you</li>
          <li>Confirm the reschedule with your instructor</li>
        </ol>

        <p>If you have any questions, please contact your instructor or our support team.</p>
      </div>

      <div class="footer">
        <p>This is an automated message from Crosswind - AI-Powered Flight Scheduling</p>
        <p>Please do not reply to this email. For support, contact support@crosswind.app</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
WEATHER CONFLICT ALERT - Crosswind

Dear ${student.name},

We've detected unsafe weather conditions for your upcoming flight. Your flight has been automatically flagged and requires rescheduling.

FLIGHT DETAILS:
- Student: ${student.name}
- Instructor: ${instructorName || 'To be assigned'}
- Scheduled Date: ${booking.scheduledDate.toLocaleDateString()}
- Scheduled Time: ${booking.scheduledDate.toLocaleTimeString()}
- Training Level: ${student.trainingLevel}

WEATHER CONDITIONS:
- Wind Speed: ${weatherReport.windKts} knots ${weatherReport.windGustKts ? `(gusts to ${weatherReport.windGustKts} knots)` : ''}
- Visibility: ${weatherReport.visibility} miles
- Ceiling: ${weatherReport.ceilingFt} feet
- Condition: ${weatherReport.condition}
- Temperature: ${weatherReport.temperature}°F

${trainingLevelMinimums.length > 0 ? `SAFETY MINIMUMS VIOLATED:\n${trainingLevelMinimums.map(minimum => `- ${minimum}`).join('\n')}\n` : ''}

NEXT STEPS:
1. Log in to your Crosswind dashboard
2. Review AI-generated reschedule suggestions
3. Select a new time that works for you
4. Confirm the reschedule with your instructor

Dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

If you have any questions, please contact your instructor or our support team.

---
Crosswind - AI-Powered Flight Scheduling
support@crosswind.app
  `;

  return {
    subject: `⚠️ Weather Conflict Alert - Flight on ${booking.scheduledDate.toLocaleDateString()}`,
    htmlContent,
    textContent,
  };
}