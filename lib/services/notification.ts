import { logger } from '../logger';
import { developmentEmailService } from './email';
import { productionEmailService } from './emailSES';
import { EmailOptions } from './email';

export type NotificationType =
  | 'weather_conflict'
  | 'reschedule_confirmed'
  | 'reschedule_suggestions'
  | 'flight_reminder';

export interface NotificationData {
  type: NotificationType;
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  data?: Record<string, any>; // Additional data for logging
}

/**
 * Notification service that handles sending emails via appropriate provider
 * Uses development service in local env, production in production
 */
export class NotificationService {
  private isProduction = process.env.NODE_ENV === 'production';
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Send notification email with retry logic
   */
  async sendNotification(notificationData: NotificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    logger.info('Sending notification', {
      type: notificationData.type,
      recipients: notificationData.recipients.map(r => r.email),
      isProduction: this.isProduction,
    });

    // Prepare email options for each recipient
    const emailPromises = notificationData.recipients.map(recipient =>
      this.sendEmailWithRetry({
        to: recipient.email,
        subject: notificationData.subject,
        html: notificationData.htmlContent,
        text: notificationData.textContent,
        from: process.env.EMAIL_USER,
      })
    );

    try {
      const results = await Promise.allSettled(emailPromises);

      // Check if all emails were sent successfully
      const successfulEmails = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      );

      const failedEmails = results.filter(result =>
        result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      );

      if (failedEmails.length === 0) {
        logger.info('All notifications sent successfully', {
          type: notificationData.type,
          recipientCount: notificationData.recipients.length,
        });

        return {
          success: true,
          messageId: successfulEmails[0]?.status === 'fulfilled' ? successfulEmails[0].value.messageId : undefined,
        };
      } else {
        logger.error('Some notifications failed', {
          type: notificationData.type,
          successCount: successfulEmails.length,
          failureCount: failedEmails.length,
          failures: failedEmails.map(result =>
            result.status === 'rejected' ? result.reason : result.value.error
          ),
        });

        return {
          success: false,
          error: `${failedEmails.length} out of ${notificationData.recipients.length} notifications failed`,
        };
      }
    } catch (error) {
      logger.error('Notification sending failed completely', {
        type: notificationData.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Send single email with retry logic
   */
  private async sendEmailWithRetry(emailOptions: EmailOptions, attempt: number = 1): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailService = this.isProduction ? productionEmailService : developmentEmailService;

    try {
      const result = await emailService.sendEmail(emailOptions);

      if (result.success) {
        return result;
      }

      // If failed and we have retries left, try again
      if (attempt < this.retryAttempts) {
        logger.warn(`Email send attempt ${attempt} failed, retrying...`, {
          to: emailOptions.to,
          error: result.error,
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));

        return this.sendEmailWithRetry(emailOptions, attempt + 1);
      }

      // All retries failed
      return result;
    } catch (error) {
      logger.error(`Email send attempt ${attempt} threw error`, {
        to: emailOptions.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // If error and we have retries left, try again
      if (attempt < this.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendEmailWithRetry(emailOptions, attempt + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Verify email service connection
   */
  async verifyConnection(): Promise<boolean> {
    const emailService = this.isProduction ? productionEmailService : developmentEmailService;
    return emailService.verifyConnection();
  }
}

/**
 * Create singleton instance of notification service
 */
export const notificationService = new NotificationService();