import pino from 'pino';

// Configure logger based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const isDebug = process.env.DEBUG === 'true';

const baseConfig = {
  level: isDebug ? 'debug' : isDevelopment ? 'info' : 'warn',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label }),
    log: (object: any) => {
      // Add application context to all logs
      return {
        ...object,
        service: 'crosswind',
        version: process.env.npm_package_version || '1.0.0',
      };
    },
  },
};

// Development configuration with pretty printing
export const logger = isDevelopment
  ? pino(
      {
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname,service,version',
          },
        },
      }
    )
  : pino(baseConfig);

// Create child loggers with specific contexts
export const createChildLogger = (name: string, metadata?: Record<string, any>) => {
  return logger.child({
    module: name,
    ...metadata,
  });
};

// Export specific loggers for different modules
export const auditLogger = createChildLogger('audit');
export const weatherLogger = createChildLogger('weather');
export const emailLogger = createChildLogger('email');
export const apiLogger = createChildLogger('api');

export default logger;