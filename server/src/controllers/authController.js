import crypto from 'crypto';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getCookieOptions,
  getRefreshCookieOptions,
} from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, role, department, course, academicYear } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', null, 409);
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'student',
      department: department || '',
      course: course || '',
      academicYear: academicYear || '',
    });

    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie(env.COOKIE_NAME, accessToken, getCookieOptions());
    res.cookie(env.COOKIE_REFRESH_NAME, refreshToken, getRefreshCookieOptions());

    logger.info(`User registered successfully: ${user.email} (${user.role})`);

    return sendSuccess(
      res,
      'Registration successful',
      {
        user,
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Invalid email or password.', null, 401);
    }

    if (!user.isActive) {
      return sendError(res, 'This account has been deactivated. Please contact an administrator.', null, 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', null, 401);
    }

    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie(env.COOKIE_NAME, accessToken, getCookieOptions());
    res.cookie(env.COOKIE_REFRESH_NAME, refreshToken, getRefreshCookieOptions());

    logger.info(`User logged in: ${user.email}`);

    // Clean user object
    const userObj = user.toJSON();

    return sendSuccess(res, 'Login successful', {
      user: userObj,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie(env.COOKIE_NAME, getCookieOptions());
  res.clearCookie(env.COOKIE_REFRESH_NAME, getRefreshCookieOptions());
  return sendSuccess(res, 'Logged out successfully');
}

export async function getMe(req, res) {
  return sendSuccess(res, 'Current user retrieved', { user: req.user });
}

export async function refresh(req, res) {
  try {
    let token = req.cookies?.[env.COOKIE_REFRESH_NAME] || req.body?.refreshToken;

    if (!token) {
      return sendError(res, 'Refresh token required', null, 401);
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return sendError(res, 'User inactive or not found', null, 401);
    }

    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    res.cookie(env.COOKIE_NAME, newAccessToken, getCookieOptions());
    res.cookie(env.COOKIE_REFRESH_NAME, newRefreshToken, getRefreshCookieOptions());

    return sendSuccess(res, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return sendError(res, 'Invalid or expired refresh token', null, 401);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond with a generic message to prevent account enumeration
    const genericMsg = 'If that email address is in our system, we have generated a password reset request.';

    if (!user || !user.isActive) {
      return sendSuccess(res, genericMsg);
    }

    // Delete existing reset tokens for user
    await PasswordResetToken.deleteMany({ user: user._id });

    // Generate unguessable reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 1-hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      user: user._id,
      hashedToken,
      expiresAt,
    });

    logger.info(`Password reset requested for: ${user.email}`);

    // In local development or testing mode, return the resetToken in the response for developer convenience
    const responseData = env.NODE_ENV === 'development' ? { resetToken: rawToken } : null;

    return sendSuccess(res, genericMsg, responseData);
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const record = await PasswordResetToken.findOne({
      hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return sendError(res, 'Password reset token is invalid or has expired.', null, 400);
    }

    const user = await User.findById(record.user);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    user.passwordHash = await User.hashPassword(password);
    await user.save();

    // Delete used token
    await PasswordResetToken.findByIdAndDelete(record._id);

    logger.info(`Password reset successfully for: ${user.email}`);

    return sendSuccess(res, 'Password has been reset successfully. You can now log in.');
  } catch (err) {
    return next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', null, 400);
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return sendSuccess(res, 'Password changed successfully.');
  } catch (err) {
    return next(err);
  }
}
