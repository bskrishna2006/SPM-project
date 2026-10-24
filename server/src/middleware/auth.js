import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[env.COOKIE_NAME]) {
      token = req.cookies[env.COOKIE_NAME];
    }

    // 2. Fallback to Bearer token in Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please sign in.', null, 401);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please sign in again.', null, 401);
      }
      return sendError(res, 'Invalid authentication token.', null, 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User account not found.', null, 401);
    }

    if (!user.isActive) {
      return sendError(res, 'This account has been deactivated. Please contact an administrator.', null, 403);
    }

    req.user = user;
    return next();
  } catch (err) {
    return sendError(res, 'Authentication failed.', null, 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
        null,
        403
      );
    }

    return next();
  };
}
