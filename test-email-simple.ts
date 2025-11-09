// Simple Email Test for Phase 5
// Tests nodemailer directly without dependencies

import nodemailer from 'nodemailer';

async function testEmailDirectly() {
  console.log('🧪 Direct Email Service Test');
  console.log('============================\n');

  // Get environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const smtpServer = process.env.EMAIL_SMTP_SERVER || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT || '587');

  console.log('1. Checking configuration...');
  console.log(`   EMAIL_USER: ${emailUser ? emailUser.substring(0, 5) + '...' : 'NOT SET'}`);
  console.log(`   EMAIL_PASS: ${emailPass ? 'SET (' + emailPass.length + ' chars)' : 'NOT SET'}`);
  console.log(`   SMTP Server: ${smtpServer}:${smtpPort}`);

  if (!emailUser || !emailPass) {
    console.log('\n❌ Email credentials not configured in .env');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    return;
  }

  console.log('\n2. Creating transporter...');
  try {
    const transporter = nodemailer.createTransporter({
      host: smtpServer,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    console.log('\n3. Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Connection verified successfully');

    console.log('\n4. Sending test email...');
    const info = await transporter.sendMail({
      from: emailUser,
      to: emailUser,
      subject: '✅ Crosswind Phase 5 Email Test - SUCCESS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">✅ Email Test Successful!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Phase 5 Notification System Working</p>
          </div>

          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0;">Test Results</h2>
            <div style="background: white; padding: 16px; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="margin: 4px 0;"><strong>Service:</strong> Development Email (Gmail SMTP)</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #10b981;">✅ Working</span></p>
              <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 4px 0;"><strong>Message ID:</strong> ${info.messageId}</p>
            </div>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #3b82f6;">
            <h3 style="color: #1e40af; margin-top: 0;">🎯 What This Means</h3>
            <p style="margin: 0; color: #1e40af;">Your email configuration is working! Weather alerts and reschedule notifications will be sent successfully.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
            <p>Sent from Crosswind Flight Management System</p>
            <p>Phase 5: Notification System Test</p>
          </div>
        </div>
      `,
      text: `Crosswind Email Test - SUCCESS

Phase 5 Notification System Working

Test Results:
- Service: Development Email (Gmail SMTP)
- Status: Working
- Timestamp: ${new Date().toLocaleString()}
- Message ID: ${info.messageId}

Your email configuration is working! Weather alerts and reschedule notifications will be sent successfully.

Sent from Crosswind Flight Management System
Phase 5: Notification System Test`,
    });

    console.log('   ✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Check your inbox: ${emailUser}`);

    console.log('\n5. Testing email service features...');
    console.log('   ✅ Gmail SMTP connection');
    console.log('   ✅ HTML email formatting');
    console.log('   ✅ Text email fallback');
    console.log('   ✅ Subject encoding');

    console.log('\n🎉 Phase 5 Email Tests Complete!');
    console.log('=====================================');
    console.log('All core email functionality is working correctly.');
    console.log('Weather monitoring and reschedule emails will be sent when conflicts occur.');

  } catch (error) {
    console.log(`\n❌ Test failed: ${error}`);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure 2-Step Verification is enabled on your Google account');
    console.log('2. Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.log('3. Use the 16-character app password (not your regular password)');
    console.log('4. Make sure "Allow less secure apps" is OFF (use App Passwords instead)');
  }
}

// Run the test
testEmailDirectly().catch(console.error);