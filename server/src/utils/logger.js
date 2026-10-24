import { env } from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'cookie',
]);

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: msg, ...sanitize(meta) }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message: msg, ...sanitize(meta) }));
  },
  error: (msg, err = {}, meta = {}) => {
    const errorDetails = err instanceof Error ? { name: err.name, message: err.message, stack: env.NODE_ENV === 'development' ? err.stack : undefined } : err;
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: msg, error: errorDetails, ...sanitize(meta) }));
  },
  debug: (msg, meta = {}) => {
    if (env.NODE_ENV === 'development') {
      console.log(JSON.stringify({ level: 'debug', timestamp: new Date().toISOString(), message: msg, ...sanitize(meta) }));
    }
  },
};
