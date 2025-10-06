import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ErrorCodes } from '../utils/errorHandler';
import logger from '../utils/logger';
import prisma from '../config/database';

interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    logger.warn('No Authorization header provided');
    return next(new AppError('No Authorization header provided', 400, ErrorCodes.AUTH_MISSING_TOKEN));
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    logger.warn('No token provided');
    return next(new AppError('No token provided', 400, ErrorCodes.AUTH_MISSING_TOKEN));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    logger.info(`User ${decoded.userId} authenticated successfully`);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.error(`JWT Error: Token expired`);
      return next(new AppError('Token has expired', 401, ErrorCodes.AUTH_TOKEN_EXPIRED));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error(`JWT Error: ${error.message}`);
      return next(new AppError(`Invalid token: ${error.message}`, 401, ErrorCodes.AUTH_INVALID_TOKEN));
    }
    logger.error('Unexpected error during authentication:', error);
    next(new AppError('Authentication failed', 401, ErrorCodes.AUTH_INVALID_TOKEN));
  }
};

export const authorizeSelf = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userId !== req.params.userId) {
    return next(new AppError("You're not allowed to perform this action", 403, ErrorCodes.AUTHORIZATION_FAILED));
  }
  next();
};

export const authorizeEventOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const eventId = req.params.eventId;

  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { creatorId: true }
  });

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  if (event.creatorId !== req.userId) {
    return res.status(403).json({ error: 'Forbidden: You do not own this event' });
  }

  next();
};



// CF Turnstile verification

import https from "https";
import querystring from "querystring";

interface TurnstileResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export function verifyTurnstile(token: string, secret: string): Promise<TurnstileResult> {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({ secret, response: token });

    const options = {
      hostname: "challenges.cloudflare.com",
      path: "/turnstile/v0/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          const result: TurnstileResult = JSON.parse(data);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on("error", (err) => reject(err));

    request.write(postData);
    request.end();
  });
}
