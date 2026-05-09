/**
 * ShadowMe Structured Logger
 * 
 * Provides structured logging with:
 * - Timestamps (ISO 8601 format)
 * - Log levels (info, warn, error, debug)
 * - Context information
 * - Color-coded console output in development
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: unknown, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
};

const levelColors: Record<LogLevel, string> = {
  debug: colors.cyan,
  info: colors.blue,
  warn: colors.yellow,
  error: colors.red,
};

const levelIcons: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

/**
 * Format a log entry as a structured object
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (data && Object.keys(data).length > 0) {
    entry.context = data;
  }

  if (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    entry.error = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return entry;
}

/**
 * Output a log entry to console
 */
function outputLog(entry: LogEntry): void {
  const isDev = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const enableColors = isDev;
  const color = enableColors ? levelColors[entry.level] : '';
  const reset = enableColors ? colors.reset : '';
  const dim = enableColors ? colors.dim : '';

  const icon = levelIcons[entry.level];
  const levelStr = entry.level.toUpperCase().padEnd(5);
  const timestamp = isDev 
    ? `${dim}${new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3
      })}${reset}`
    : entry.timestamp;

  // Build the log message
  let logMessage = `[${timestamp}] ${color}${icon} [${levelStr}]${reset} ${entry.message}`;

  // Add context if present
  if (entry.context && Object.keys(entry.context).length > 0) {
    const contextStr = JSON.stringify(entry.context, null, 0);
    if (isDev) {
      logMessage += `\n${dim}    Context: ${colors.reset}${JSON.stringify(entry.context, null, 2).split('\n').join('\n    ')}`;
    } else {
      logMessage += ` ${contextStr}`;
    }
  }

  // Add error info if present
  if (entry.error) {
    if (isDev) {
      logMessage += `\n${color}    Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        logMessage += `\n${dim}    Stack: ${entry.error.stack.split('\n').slice(0, 3).join('\n' + dim + '           ')}`;
      }
    } else {
      logMessage += ` Error: ${entry.error.name}: ${entry.error.message}`;
    }
  }

  // Output based on level
  switch (entry.level) {
    case 'debug':
      if (!isProduction) console.debug(logMessage);
      break;
    case 'info':
      console.info(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'error':
      console.error(logMessage);
      break;
  }
}

/**
 * Create a logger instance with optional base context
 */
function createLogger(baseContext?: Record<string, unknown>): Logger {
  const context = { ...baseContext };

  const log = (level: LogLevel, message: string, data?: Record<string, unknown>, error?: unknown): void => {
    const mergedContext = { ...context, ...data };
    const entry = formatLogEntry(level, message, mergedContext, error);
    outputLog(entry);
  };

  return {
    info(message: string, data?: Record<string, unknown>): void {
      log('info', message, data);
    },

    error(message: string, error?: unknown, data?: Record<string, unknown>): void {
      log('error', message, data, error);
    },

    warn(message: string, data?: Record<string, unknown>): void {
      log('warn', message, data);
    },

    debug(message: string, data?: Record<string, unknown>): void {
      log('debug', message, data);
    },

    child(additionalContext: Record<string, unknown>): Logger {
      return createLogger({ ...context, ...additionalContext });
    },
  };
}

// Export a singleton logger instance
export const logger = createLogger({
  service: 'ShadowMe',
  version: process.env.npm_package_version || '1.0.0',
});

// Also export the factory for creating child loggers
export { createLogger };
