// Comprehensive logging utility for Instagram Content Moderation

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 logs in memory

  constructor() {
    this.minLevel = process.env.NODE_ENVI === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any, error?: Error): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const contextStr = context ? `[${context}]` : '';
    
    let logMessage = `${timestamp} ${levelStr} ${contextStr} ${message}`;
    
    if (data) {
      logMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        logMessage += `\nStack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any, error?: Error): void {
    if (level < this.minLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output
    const formattedMessage = this.formatMessage(level, message, context, data, error);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any, p0?: Error): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  // Instagram-specific logging methods
  webhookReceived(payload: any): void {
    this.info('Webhook received', 'WEBHOOK', { 
      object: payload.object,
      entryCount: payload.entry?.length || 0 
    });
  }

  webhookVerification(success: boolean, token?: string): void {
    if (success) {
      this.info('Webhook verification successful', 'WEBHOOK_VERIFY');
    } else {
      this.warn('Webhook verification failed', 'WEBHOOK_VERIFY', { token });
    }
  }

  messageReceived(senderId: string, message: string): void {
    this.info('Message received', 'MESSAGE_IN', { senderId, message });
  }

  messageSent(recipientId: string, message: string, success: boolean, messageId?: string): void {
    if (success) {
      this.info('Message sent successfully', 'MESSAGE_OUT', { recipientId, message, messageId });
    } else {
      this.error('Failed to send message', 'MESSAGE_OUT', { recipientId, message });
    }
  }

  autoReplyTriggered(trigger: string, response: string, recipientId: string): void {
    this.info('Auto-reply triggered', 'AUTO_REPLY', { trigger, response, recipientId });
  }

  apiError(endpoint: string, error: Error, statusCode?: number): void {
    this.error('API error', 'API', { endpoint, statusCode }, error);
  }

  // Get recent logs (for debugging/monitoring)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', 'LOGGER');
  }
}

// Create singleton instance
export const logger = new Logger();

// Helper function for error handling with automatic logging
export function handleError(error: unknown, context: string, additionalData?: any): Error {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(`Unhandled error in ${context}`, context, additionalData, err);
  return err;
}

// Async error wrapper
export async function withErrorHandling<T>(
  fn: () => Promise<T>, 
  context: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

// Express-style error handler for API routes
export function createErrorResponse(error: unknown, context: string): Response {
  const err = handleError(error, context);
  
  const isProduction = process.env.NODE_ENVI === 'production';
  
  return new Response(JSON.stringify({
    error: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack, context })
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}