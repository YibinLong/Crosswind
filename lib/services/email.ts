import nodemailer from 'nodemailer';
import { logger } from '../logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
  verifyConnection(): Promise<boolean>;
}

/**
 * Development email service using Gmail SMTP
 * Requires Gmail App Password for authentication
 */
export class DevelopmentEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Check if required environment variables are set
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const smtpServer = process.env.EMAIL_SMTP_SERVER || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT || '587');

      if (!emailUser || !emailPass) {
        logger.warn('Email credentials not found in environment variables');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        // Enable connection pooling for better performance
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
      });

      this.isInitialized = true;
      logger.info('Development email service initialized with Gmail SMTP');
    } catch (error) {
      logger.error('Failed to initialize development email service:', error);
      this.isInitialized = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isInitialized) {
      await this.initializeTransporter();
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Email service not initialized - check environment variables',
        };
      }
    }

    try {
      const mailOptions = {
        from: options.from || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email:', {
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
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection verification failed:', error);
      return false;
    }
  }

  /**
   * Close the connection pool (useful for graceful shutdown)
   */
  async close(): Promise<void> {
    if (this.isInitialized && this.transporter) {
      this.transporter.close();
      logger.info('Email service connection closed');
    }
  }
}

/**
 * Create a singleton instance of the development email service
 */
export const developmentEmailService = new DevelopmentEmailService();