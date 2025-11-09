// Test script for email service
const { developmentEmailService } = require('./lib/services/email.ts');

async function testEmailService() {
  console.log('🧪 Testing Email Service (Development)');

  // Test connection first
  console.log('\n1. Testing email connection...');
  const isConnected = await developmentEmailService.verifyConnection();
  console.log(`Connection status: ${isConnected ? '✅ Connected' : '❌ Failed'}`);

  if (!isConnected) {
    console.log('❌ Email service not connected. Check your .env configuration:');
    console.log('- EMAIL_USER: your@gmail.com');
    console.log('- EMAIL_PASS: your_gmail_app_password (16 chars)');
    return;
  }

  // Test sending an email
  console.log('\n2. Sending test email...');
  const result = await developmentEmailService.sendEmail({
    to: process.env.EMAIL_USER, // Send to yourself
    subject: '🧪 Crosswind Email Test - Phase 5.1.1',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">✅ Email Service Test Successful!</h2>
        <p>This is a test email from Crosswind's Phase 5 notification system.</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Test Details:</h3>
          <ul>
            <li><strong>Service:</strong> Development Email Service (Gmail SMTP)</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            <li><strong>Status:</strong> Working correctly</li>
          </ul>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          This confirms that your email configuration is working for weather alerts and notifications.
        </p>
      </div>
    `,
    text: 'Crosswind Email Test - Phase 5.1.1\n\nThis is a test email to confirm the email service is working correctly.'
  });

  if (result.success) {
    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Check your inbox at ${process.env.EMAIL_USER}`);
  } else {
    console.log(`❌ Email failed to send: ${result.error}`);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have 2-Step Verification enabled on your Google account');
    console.log('2. Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.log('3. Use the 16-character app password (not your regular password)');
  }
}

testEmailService().catch(console.error);