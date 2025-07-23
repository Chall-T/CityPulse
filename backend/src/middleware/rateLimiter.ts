import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler, RateLimitExceededEventHandler } from 'express-rate-limit';
import { AppError, ErrorCodes } from '../utils/errorHandler';

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
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  handler: handleRateLimit,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});