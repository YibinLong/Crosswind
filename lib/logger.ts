// Simple logger fallback to avoid module issues
const isDebug = process.env.DEBUG === 'true';

interface LoggerInterface {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

const createLogger = (name?: string): LoggerInterface => ({
  info: (message: string, meta?: any) => {
    if (isDebug) {
      console.log(`[${name || 'APP'}] INFO:`, message, meta || '');
    }
  },
  error: (message: string, meta?: any) => {
    console.error(`[${name || 'APP'}] ERROR:`, message, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[${name || 'APP'}] WARN:`, message, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (isDebug) {
      console.log(`[${name || 'APP'}] DEBUG:`, message, meta || '');
    }
  }
});

export const logger = createLogger();
export const auditLogger = createLogger('audit');
export const weatherLogger = createLogger('weather');
export const emailLogger = createLogger('email');
export const apiLogger = createLogger('api');

export const createChildLogger = (name: string, metadata?: Record<string, any>) => {
  return createLogger(name);
};

export default logger;