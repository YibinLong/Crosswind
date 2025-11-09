import { notificationService } from '../services/notification';
import { generateWeatherConflictEmail } from '../email-templates';
import { generateRescheduleConfirmationEmail } from '../email-templates';
import { generateFlightReminderEmail } from '../email-templates';
import { logger } from '../logger';

/**
 * Test script for email notification system
 * Run with: npx tsx lib/test/notifications.ts
 */

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  duration: number;
}

export class NotificationTester {
  private testResults: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Email Notification System Tests...\n');

    await this.testBasicEmailSending();
    await this.testWeatherConflictTemplate();
    await this.testRescheduleConfirmationTemplate();
    await this.testFlightReminderTemplate();
    await this.testNotificationService();

    this.printResults();
    return this.testResults;
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({
        testName,
        success: true,
        duration,
      });
      console.log(`✅ ${testName} - Passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.testResults.push({
        testName,
        success: false,
        error: errorMessage,
        duration,
      });
      console.log(`❌ ${testName} - Failed (${duration}ms): ${errorMessage}`);
    }
  }

  private async testBasicEmailSending(): Promise<void> {
    await this.runTest('Basic Email Sending', async () => {
      const result = await notificationService.sendNotification({
        type: 'weather_conflict',
        recipients: [{ email: 'test@example.com', name: 'Test User' }],
        subject: 'Crosswind Email Test',
        htmlContent: '<h1>Test Email</h1><p>This is a test email from Crosswind notification system.</p>',
        textContent: 'Test Email\n\nThis is a test email from Crosswind notification system.',
      });

      if (!result.success) {
        throw new Error(`Email sending failed: ${result.error}`);
      }

      // Verify email service connection
      const isConnected = await notificationService.verifyConnection();
      if (!isConnected) {
        throw new Error('Email service connection verification failed');
      }
    });
  }

  private async testWeatherConflictTemplate(): Promise<void> {
    await this.runTest('Weather Conflict Template Generation', async () => {
      const mockData = {
        student: {
          name: 'John Doe',
          email: 'john@example.com',
          trainingLevel: 'Student Pilot',
        },
        booking: {
          id: 1,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        },
        weatherReport: {
          windKts: 15,
          windGustKts: 22,
          visibility: 2.5,
          ceilingFt: 800,
          condition: 'Rain',
          temperature: 45,
        },
        instructorName: 'Jane Smith',
        trainingLevelMinimums: ['Max 10kt crosswind', 'Min 3 SM visibility', 'Min 1000ft ceiling'],
      };

      const template = generateWeatherConflictEmail(mockData);

      if (!template.subject || !template.htmlContent || !template.textContent) {
        throw new Error('Template generation failed - missing required fields');
      }

      if (!template.subject.includes('Weather Conflict Alert')) {
        throw new Error('Template subject does not contain expected text');
      }

      if (!template.htmlContent.includes(mockData.student.name)) {
        throw new Error('Template HTML does not include student name');
      }

      // Test actual email sending with template
      const result = await notificationService.sendNotification({
        type: 'weather_conflict',
        recipients: [{ email: 'test@example.com', name: 'Test User' }],
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
      });

      if (!result.success) {
        throw new Error(`Template email sending failed: ${result.error}`);
      }
    });
  }

  private async testRescheduleConfirmationTemplate(): Promise<void> {
    await this.runTest('Reschedule Confirmation Template Generation', async () => {
      const originalDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const mockData = {
        student: {
          name: 'John Doe',
          email: 'john@example.com',
          trainingLevel: 'Student Pilot',
        },
        booking: {
          id: 1,
          scheduledDate: newDate,
        },
        instructorName: 'Jane Smith',
        selectedSuggestion: {
          proposedDate: newDate,
          proposedTime: '14:00',
          reason: 'Clear weather conditions expected',
          confidence: 0.95,
        },
        originalDate: originalDate,
        weatherForecast: 'Sunny with light winds, excellent visibility',
      };

      const template = generateRescheduleConfirmationEmail(mockData);

      if (!template.subject || !template.htmlContent || !template.textContent) {
        throw new Error('Template generation failed - missing required fields');
      }

      if (!template.subject.includes('Flight Rescheduled')) {
        throw new Error('Template subject does not contain expected text');
      }

      if (!template.htmlContent.includes(mockData.student.name)) {
        throw new Error('Template HTML does not include student name');
      }
    });
  }

  private async testFlightReminderTemplate(): Promise<void> {
    await this.runTest('Flight Reminder Template Generation', async () => {
      const scheduledDate = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 hours from now

      const mockData = {
        student: {
          name: 'John Doe',
          email: 'john@example.com',
          trainingLevel: 'Student Pilot',
        },
        booking: {
          id: 1,
          scheduledDate: scheduledDate,
        },
        aircraft: {
          tailNumber: 'N12345',
          model: 'Cessna 172',
        },
        instructorName: 'Jane Smith',
        hoursUntilFlight: 25,
        weatherForecast: 'Partly cloudy with good visibility',
      };

      const template = generateFlightReminderEmail(mockData);

      if (!template.subject || !template.htmlContent || !template.textContent) {
        throw new Error('Template generation failed - missing required fields');
      }

      if (!template.subject.includes('Flight Reminder')) {
        throw new Error('Template subject does not contain expected text');
      }

      if (!template.htmlContent.includes(mockData.student.name)) {
        throw new Error('Template HTML does not include student name');
      }
    });
  }

  private async testNotificationService(): Promise<void> {
    await this.runTest('Notification Service Integration', async () => {
      // Test with multiple recipients
      const result = await notificationService.sendNotification({
        type: 'reschedule_confirmed',
        recipients: [
          { email: 'student@example.com', name: 'Student User' },
          { email: 'instructor@example.com', name: 'Instructor User' },
        ],
        subject: 'Test Multi-Recipient Email',
        htmlContent: '<h1>Multi-Recipient Test</h1><p>This email was sent to multiple recipients.</p>',
        textContent: 'Multi-Recipient Test\n\nThis email was sent to multiple recipients.',
        data: {
          bookingId: 123,
          testRun: true,
        },
      });

      if (!result.success) {
        throw new Error(`Multi-recipient email sending failed: ${result.error}`);
      }

      // Test notification service connection
      const isConnected = await notificationService.verifyConnection();
      if (!isConnected) {
        throw new Error('Notification service connection verification failed');
      }
    });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('======================');

    const passedTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);

    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`⏱️ Total Duration: ${this.testResults.reduce((sum, r) => sum + r.duration, 0)}ms`);

    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.error}`);
      });
    }

    console.log('\n' + '='.repeat(50));

    if (failedTests.length === 0) {
      console.log('🎉 All tests passed! Email notification system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above and fix the issues.');
    }

    console.log('\n📝 Notes:');
    console.log('- Test emails were sent to test@example.com (check your spam folder)');
    console.log('- Ensure your email configuration in .env.local is correct');
    console.log('- For Gmail, make sure to use an App Password, not your regular password');
    console.log('- For production, configure AWS SES credentials instead of Gmail');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new NotificationTester();
  tester.runAllTests()
    .then((results) => {
      const failedCount = results.filter(r => !r.success).length;
      process.exit(failedCount > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default NotificationTester;