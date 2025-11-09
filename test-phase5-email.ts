// Phase 5 Email Notification Test
// Run with: npx tsx test-phase5-email.ts

import { notificationService } from './lib/services/notification';

async function testPhase5EmailNotifications() {
  console.log('🧪 Phase 5 Email Notification Tests');
  console.log('=====================================\n');

  // Test 1: Verify email service connection
  console.log('1. Testing email service connection...');
  try {
    const isConnected = await notificationService.verifyConnection();
    console.log(`   Connection: ${isConnected ? '✅ Connected' : '❌ Failed'}`);

    if (!isConnected) {
      console.log('   ❌ Check your .env configuration:');
      console.log('      - EMAIL_USER: your@gmail.com');
      console.log('      - EMAIL_PASS: 16-char Gmail App Password');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Connection test failed: ${error}`);
    return;
  }

  // Test 2: Send test notification (weather conflict)
  console.log('\n2. Testing weather conflict email...');
  const weatherResult = await notificationService.sendNotification({
    type: 'weather_conflict',
    recipients: [{
      email: process.env.EMAIL_USER!,
      name: 'Test User'
    }],
    subject: '🚨 Test Weather Conflict Alert - Crosswind',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">⚠️ Weather Conflict Detected</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <h3 style="color: #1e293b;">Test Flight Details:</h3>
          <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p><strong>Student:</strong> John Student</p>
            <p><strong>Flight:</strong> Training Flight #001</p>
            <p><strong>Scheduled:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Issue:</strong> Low visibility (1.5 miles) - Below minimums</p>
          </div>
          <p style="color: #64748b;">This is a test email to verify weather conflict notifications are working.</p>
        </div>
      </div>
    `,
    textContent: 'Weather Conflict Test - This is a test email from Crosswind Phase 5 testing.',
    data: { test: true, bookingId: 'test-001' }
  });

  console.log(`   Weather email: ${weatherResult.success ? '✅ Sent' : '❌ Failed'}`);
  if (weatherResult.error) {
    console.log(`   Error: ${weatherResult.error}`);
  }

  // Test 3: Send reschedule confirmation
  console.log('\n3. Testing reschedule confirmation email...');
  const rescheduleResult = await notificationService.sendNotification({
    type: 'reschedule_confirmed',
    recipients: [{
      email: process.env.EMAIL_USER!,
      name: 'Test User'
    }],
    subject: '✅ Flight Rescheduled - Crosswind',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✈️ Flight Successfully Rescheduled</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <h3 style="color: #1e293b;">Updated Flight Details:</h3>
          <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p><strong>Student:</strong> John Student</p>
            <p><strong>New Time:</strong> ${new Date(Date.now() + 86400000).toLocaleString()}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          <p style="color: #64748b;">This is a test email to verify reschedule notifications are working.</p>
        </div>
      </div>
    `,
    textContent: 'Reschedule Confirmation Test - This is a test email from Crosswind Phase 5 testing.',
    data: { test: true, bookingId: 'test-002' }
  });

  console.log(`   Reschedule email: ${rescheduleResult.success ? '✅ Sent' : '❌ Failed'}`);
  if (rescheduleResult.error) {
    console.log(`   Error: ${rescheduleResult.error}`);
  }

  console.log('\n✅ Phase 5 Email Tests Complete!');
  console.log(`Check your inbox at ${process.env.EMAIL_USER} for test emails.`);
}

// Run the test
testPhase5EmailNotifications().catch(console.error);