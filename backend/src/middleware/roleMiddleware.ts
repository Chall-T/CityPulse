import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCodes } from '../utils/errorHandler';
import logger from '../utils/logger';
import prisma from '../config/database';

interface AuthRequest extends Request {
  userId?: string;
}


export const authorizeRoles = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return next(new AppError('No Authorization header provided', 400, ErrorCodes.AUTH_MISSING_TOKEN));
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded: { userId: string, role: string };

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      req.userId = decoded.userId;

      if (!allowedRoles.includes(decoded.role)) {
        logger.warn(`User ${decoded.userId} has role ${decoded.role}, access denied`);
        return next(new AppError('Forbidden: insufficient role', 403, ErrorCodes.AUTHORIZATION_FAILED));
      }

      logger.info(`User ${decoded.userId} with role ${decoded.role} authorized`);
      next();
    } catch (error) {
      logger.error('JWT role check failed:', error);
      return next(new AppError('Authentication failed', 401, ErrorCodes.AUTH_INVALID_TOKEN));
    }
  };
};
