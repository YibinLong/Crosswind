# Email Notifications Setup Guide

This guide explains how to configure email notifications for the Crosswind flight scheduling system.

## Overview

Crosswind supports two email providers:
- **Development**: Gmail SMTP (for testing and development)
- **Production**: Amazon SES (for production deployments)

## Development Setup (Gmail SMTP)

### Prerequisites
- A Gmail account with 2-factor authentication enabled
- Gmail App Password (not your regular password)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account settings](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Follow the setup process

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the app dropdown
3. Select "Other (Custom name)" and enter "Crosswind Development"
4. Click "Generate"
5. Copy the 16-character password (this is your `EMAIL_PASS`)

### Step 3: Configure Environment Variables
Add the following to your `.env.local` file:

```bash
# Email Configuration (Development)
EMAIL_SMTP_SERVER="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_16_character_app_password"
EMAIL_FROM_NAME="Crosswind Flight Scheduling"
EMAIL_FROM_ADDRESS="noreply@crosswind.app"
```

### Step 4: Test Email Configuration
Run the test script to verify your setup:

```bash
npm run test:email
```

## Production Setup (Amazon SES)

### Prerequisites
- AWS Account with SES enabled
- Verified domain or email address in SES
- IAM user with SES permissions

### Step 1: Set Up Amazon SES
1. Go to [Amazon SES Console](https://console.aws.amazon.com/ses/)
2. Choose your preferred region (recommended: `us-east-1`)
3. Verify a domain or email address:
   - **For domain**: Add DNS records provided by AWS
   - **For email**: Click verification link sent to your email

### Step 2: Request Production Access
1. In SES Console, go to "Sending Statistics"
2. Click "Request Production Access"
3. Fill out the form with details about your use case
4. Wait for AWS approval (usually 1-2 business days)

### Step 3: Create IAM User
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user with "Programmatic access"
3. Attach the `AmazonSESSendingAccess` policy
4. Save the Access Key ID and Secret Access Key

### Step 4: Configure Environment Variables
Add the following to your production environment:

```bash
# Email Configuration (Production)
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SES_SECRET_ACCESS_KEY="your_aws_secret_access_key"
EMAIL_FROM_NAME="Crosswind Flight Scheduling"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
```

## Email Templates

Crosswind includes three email templates:

### 1. Weather Conflict Alert
- **Triggers**: When weather conditions violate training level minimums
- **Recipients**: Student and instructor
- **Content**: Weather details, violated minimums, reschedule link

### 2. Reschedule Confirmation
- **Triggers**: When a reschedule suggestion is confirmed
- **Recipients**: Student and instructor
- **Content**: New flight details, weather forecast, AI reasoning

### 3. Flight Reminder
- **Triggers**: Scheduled flights (24 hours and 2 hours before)
- **Recipients**: Student and instructor
- **Content**: Flight details, weather forecast, pre-flight checklist

## Testing Email Notifications

### Test Weather Conflict Notifications
1. Create a test booking with coordinates in bad weather
2. Run weather monitoring: `POST /api/weather/monitor`
3. Check emails for conflict alerts

### Test Reschedule Notifications
1. Create a booking with AI reschedule suggestions
2. Confirm a suggestion via the API or UI
3. Check emails for confirmation

### Manual Email Test
```javascript
// Test email sending programmatically
import { notificationService } from '@/lib/services/notification';

const result = await notificationService.sendNotification({
  type: 'weather_conflict',
  recipients: [{ email: 'test@example.com', name: 'Test User' }],
  subject: 'Test Email',
  htmlContent: '<h1>Test Email</h1><p>This is a test email.</p>',
  textContent: 'Test Email\n\nThis is a test email.'
});

console.log('Email result:', result);
```

## Troubleshooting

### Gmail SMTP Issues
- **"Invalid credentials"**: Ensure you're using an App Password, not your regular password
- **"Connection refused"**: Check that 2-factor authentication is enabled
- **"Rate limit exceeded"**: Gmail limits sending to ~100 emails/day for new accounts

### Amazon SES Issues
- **"Access denied"**: Verify your IAM user has SES permissions
- **"Email address not verified"**: Ensure your sender email is verified in SES
- **"Sandbox mode"**: Request production access to send to unverified addresses

### General Issues
- **Emails not sending**: Check logs for error messages
- **Delayed delivery**: Check email service provider status
- **Spam folder**: Add sender email to contacts/address book

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `EMAIL_SMTP_SERVER` | SMTP server hostname | Dev only | `smtp.gmail.com` |
| `EMAIL_SMTP_PORT` | SMTP server port | Dev only | `587` |
| `EMAIL_USER` | Email username | Dev only | `user@gmail.com` |
| `EMAIL_PASS` | Email password (App Password) | Dev only | `abcd1234efgh5678` |
| `AWS_SES_REGION` | AWS SES region | Prod only | `us-east-1` |
| `AWS_SES_ACCESS_KEY_ID` | AWS access key | Prod only | `AKIA...` |
| `AWS_SES_SECRET_ACCESS_KEY` | AWS secret key | Prod only | `abc123...` |
| `EMAIL_FROM_NAME` | Sender display name | Both | `Crosswind Flight Scheduling` |
| `EMAIL_FROM_ADDRESS` | Sender email address | Both | `noreply@crosswind.app` |

## Security Best Practices

1. **Never commit email credentials to version control**
2. **Use different email addresses for development and production**
3. **Regularly rotate email passwords and API keys**
4. **Monitor email sending rates and quotas**
5. **Implement proper error handling and logging**

## Support

For issues with email notifications:
1. Check application logs for error messages
2. Verify environment variables are correctly set
3. Test email service provider status
4. Review this documentation for configuration steps

For additional help, create an issue in the project repository with:
- Environment details (dev/prod)
- Error messages from logs
- Steps to reproduce the issue