/**
 * src/lib/logger.js
 *
 * Simple logging utility for job processing and pipeline operations.
 * In production, this would integrate with a proper logging service (Datadog, etc).
 * For now, logs to console with structured JSON format.
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL] : LOG_LEVELS.info;

/**
 * Format log message with level and context
 */
function formatLog(level, message, context = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  debug(message, context) {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.log(formatLog('DEBUG', message, context));
    }
  },

  info(message, context) {
    if (LOG_LEVELS.info >= currentLevel) {
      console.log(formatLog('INFO', message, context));
    }
  },

  warn(message, context) {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn(formatLog('WARN', message, context));
    }
  },

  error(message, context) {
    if (LOG_LEVELS.error >= currentLevel) {
      console.error(formatLog('ERROR', message, context));
    }
  },
};
