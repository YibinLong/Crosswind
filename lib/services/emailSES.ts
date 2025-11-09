import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../logger';
import { EmailOptions, EmailService } from './email';

/**
 * Production email service using AWS SES
 * Requires AWS credentials and SES configuration
 */
export class ProductionEmailService implements EmailService {
  private sesClient: SESClient;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Check if required environment variables are set
      const awsRegion = process.env.AWS_SES_REGION;
      const awsAccessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
      const awsSecretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;

      if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey) {
        logger.warn('AWS SES credentials not found in environment variables');
        return;
      }

      this.sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });

      this.isInitialized = true;
      logger.info('Production email service initialized with AWS SES');
    } catch (error) {
      logger.error('Failed to initialize AWS SES email service:', error);
      this.isInitialized = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isInitialized) {
      await this.initializeClient();
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'AWS SES service not initialized - check AWS credentials',
        };
      }
    }

    try {
      // Convert email options to SES format
      const params = {
        Source: options.from || process.env.EMAIL_USER,
        Destination: {
          ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
          CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: options.text
              ? {
                  Data: options.text,
                  Charset: 'UTF-8',
                }
              : undefined,
            Html: options.html
              ? {
                  Data: options.html,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      };

      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);

      logger.info('Email sent successfully via AWS SES', {
        messageId: result.MessageId,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error('Failed to send email via AWS SES:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // SES doesn't have a direct "verify" method like nodemailer
      // We'll send a test email to verify the connection works
      const testResult = await this.sendEmail({
        to: process.env.EMAIL_USER || 'test@example.com',
        subject: 'SES Connection Test',
        text: 'This is a test email to verify AWS SES connection.',
      });

      if (testResult.success) {
        logger.info('AWS SES connection verified successfully');
        return true;
      } else {
        logger.error('AWS SES connection verification failed:', testResult.error);
        return false;
      }
    } catch (error) {
      logger.error('AWS SES connection verification failed:', error);
      return false;
    }
  }
}

/**
 * Create a singleton instance of the production email service
 */
export const productionEmailService = new ProductionEmailService();