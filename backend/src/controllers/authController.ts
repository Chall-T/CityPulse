import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { catchAsync, AppError, ErrorCodes } from '../utils/errorHandler';
import logger from '../utils/logger';
import { isProd, API_PATH, cFSecretKey } from '../utils/secrets';
import { USER_LIMITS } from '../config/limits';
import { containsProfanity } from '../utils/profanityFilter';
import { verifyTurnstile } from '../middleware/authMiddleware';

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  logger.info('Register endpoint called');
  const { email, password, name, token } = req.body;
  
  if (isProd && cFSecretKey) {
    const data = await verifyTurnstile(token, cFSecretKey);
    if (!data.success) {
      return next(new AppError("Failed human verification", 400, ErrorCodes.AUTH_INVALID_CF_TOKEN));
    }
  }

  if (!email) return next(new AppError("Email is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  authService.isValidEmail(email) || next(new AppError("Invalid email format", 400, ErrorCodes.VALIDATION_INVALID_FORMAT));

  if (!password) return next(new AppError("Password is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  if (password.length < USER_LIMITS.PASSWORD_MIN_LENGTH) return next(new AppError(`Password must be at least ${USER_LIMITS.PASSWORD_MIN_LENGTH} characters long`, 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
  if (name && name > USER_LIMITS.NAME_MAX_LENGTH) return next(new AppError("Name is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
  if (name && containsProfanity(name)) return next(new AppError("Name contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
  // if (!name) return next(new AppError("Name is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  const username = await authService.generateUsername(email, name);
  const user = await authService.register(email, password, username, name);
  logger.info(`User registered successfully: ${user.id}`);
  res.status(201).json(user);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  logger.info('Login endpoint called');
  const { email, password } = req.body;

  if (!email) return next(new AppError("Email is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  authService.isValidEmail(email) || next(new AppError("Invalid email format", 400, ErrorCodes.VALIDATION_INVALID_FORMAT));
  if (!password) return next(new AppError("Password is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));

  const browser = req.get('User-Agent') || 'Unknown';
  const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'Unknown';

  const { user, accessToken, refreshToken } = await authService.login(email, password, browser, ipAddress);
  logger.info(`User logged in successfully: ${email} on ${browser} from ${ipAddress}`);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: `${API_PATH}/auth`,
  });

  res.json({ user, token: accessToken });
});


export const refresh = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return next(new AppError("Refresh token missing", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  }
  const browser = req.get('User-Agent') || 'Unknown';
  const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'Unknown';

  const newAccessToken = await authService.refreshAccessToken(refreshToken, browser, ipAddress);
  res.json({ token: newAccessToken });
});

export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return next(new AppError("Not logged in", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: `${API_PATH}/auth`,
  });

  res.status(200).json({ message: 'Logged out successfully' });
});


export const googleCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const googleProfile = req.user as {
      id: string;
      emails: { value: string }[];
      displayName: string;
      photos: { value: string }[];
    };

    if (!googleProfile) {
      return next(new AppError("Google authentication failed", 401, ErrorCodes.AUTH_GOOGLE_LOGIN_FAILED));
    }

    const browser = req.get('User-Agent') || 'Unknown';
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'Unknown';
    const { user, accessToken, refreshToken } = await authService.handleGoogleLogin(googleProfile, browser, ipAddress);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: `${API_PATH}/auth`,
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  } catch (error) {
    logger.error(error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
  }
});