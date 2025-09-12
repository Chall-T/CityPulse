import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit, { RateLimitRequestHandler, RateLimitExceededEventHandler } from 'express-rate-limit';
import { AppError, ErrorCodes } from '../utils/errorHandler';
import { getUserById } from '../services/userService';
import { RATE_LIMITS, USER_LIMITS } from '../config/limits';


const handleRateLimit: RateLimitExceededEventHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  options
) => {
  next(
    new AppError(
      options.message || 'Too many requests',
      options.statusCode || 429,
      ErrorCodes.TOO_MANY_REQUESTS
    )
  );
};

export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  handler: handleRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH_WINDOW_MS,
  max: RATE_LIMITS.AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts from this IP, please try again later.',
  handler: handleRateLimit,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});





export const eventCreationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMITS.EVENT_CREATION_WINDOW_MS,
  max: RATE_LIMITS.EVENT_CREATION_MAX_REQUESTS,
  message: 'Too many event creation attempts, please try again later.',
  handler: handleRateLimit,
  standardHeaders: true,
  legacyHeaders: false,

  // limits BOTH IP and user/account ID
  keyGenerator: (req: Request) => {
    const userId = (req as any).userId;
    const ip = req.ip;
    return `${userId}-${ip}`;
  },
});