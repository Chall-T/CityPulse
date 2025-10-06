import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export enum ErrorCodes {
  // Authentication Errors
  AUTH_MISSING_TOKEN = 'AUTH_MISSING_TOKEN',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_INVALID_REFRESH_TOKEN = 'AUTH_INVALID_REFRESH_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  AUTH_EMAIL_ALREADY_IN_USE = 'AUTH_EMAIL_ALREADY_IN_USE',
  AUTH_INVALID_PASSWORD = 'AUTH_INVALID_PASSWORD',
  AUTH_GOOGLE_LOGIN_FAILED = 'AUTH_GOOGLE_LOGIN_FAILED',
  AUTH_NO_PASSWORD_SET = 'AUTH_NO_PASSWORD_SET',
  AUTH_WRONG_LOGIN_METHOD = 'AUTH_WRONG_LOGIN_METHOD',
  AUTH_INVALID_CF_TOKEN = 'AUTH_INVALID_CF_TOKEN',

  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_TYPE = 'VALIDATION_INVALID_TYPE',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_BOUNDS = 'VALIDATION_OUT_OF_BOUNDS',
  VALIDATION_PROFANITY = 'VALIDATION_PROFANITY',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_IS_IMMUTABLE = 'RESOURCE_IS_IMMUTABLE',
  
  // Server Errors
  SERVER_INTERNAL_ERROR = 'SERVER_INTERNAL_ERROR',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

export class AppError extends Error {
  statusCode: number;
  errorCode?: ErrorCodes;

  constructor(message: string, statusCode: number, errorCode?: ErrorCodes) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: Error) => {
      logger.error(`Caught async error: ${error.message}`, { stack: error.stack });
      next(error);
    });
  };
};


export const globalErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || ErrorCodes.SERVER_INTERNAL_ERROR;

  logger.error(`${statusCode} - ${message} - ErrorCode: ${errorCode} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  res.status(statusCode).json({
    error: {
      message,
      errorCode,
    },
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack trace in development
  });
};