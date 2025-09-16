/**
 * Simple logger utility for the MCP server
 * Logs to stderr to avoid interfering with MCP communication
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = 'API-FORGE', level: LogLevel = LogLevel.INFO) {
    this.prefix = prefix;
    this.level = this.getLogLevelFromEnv() || level;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      return LogLevel[envLevel as keyof typeof LogLevel] as LogLevel;
    }
    return null;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${this.prefix}] [${level}] ${message}`;
    
    if (data !== undefined) {
      try {
        logMessage += ` ${JSON.stringify(data)}`;
      } catch {
        logMessage += ` [non-serializable data]`;
      }
    }
    
    return logMessage;
  }

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.error(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.error(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.error(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.level <= LogLevel.ERROR) {
      const errorData = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('ERROR', message, errorData));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger, LogLevel };