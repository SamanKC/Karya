/**
 * Structured logger for production use.
 *
 * Outputs JSON in production for machine parsing (log aggregators, CloudWatch, etc.).
 * Outputs human-readable format in development.
 * Replaces raw console.log/console.error throughout the server.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === 'production';
const minLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? (isProduction ? 'info' : 'debug')];

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= minLevel;
}

function formatEntry(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }

  const { level, message, timestamp, ...extra } = entry;
  const tag = level.toUpperCase().padEnd(5);
  const time = timestamp.split('T')[1]?.replace('Z', '') ?? timestamp;
  const extraStr = Object.keys(extra).length > 0 ? ' ' + JSON.stringify(extra) : '';
  return `${time} [${tag}] ${message}${extraStr}`;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const formatted = formatEntry(entry);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    log('debug', message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    log('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    log('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    log('error', message, meta);
  },
};
