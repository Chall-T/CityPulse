import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError, ErrorCodes } from '../utils/errorHandler';
import logger from '../utils/logger';

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}
));

export const generateUsername = async (email: string, name?: string): Promise<string> => {
  const base = name?.split(' ')[0]?.toLowerCase() || email.split('@')[0].toLowerCase();
  let username = base;
  let count = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${count}`;
    count++;
  }

  return username;
};


export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};


export const register = async (email: string, password: string, baseUsername: string, name?: string) => {
  logger.info(`Attempting to register user with email: ${email}`);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    logger.warn(`Registration failed: Email already in use - ${email}`);
    throw new AppError('Email already in use', 400, ErrorCodes.AUTH_EMAIL_ALREADY_IN_USE);
  }
  // Generate a basic username from name or email
  let username = baseUsername;
  const { nanoid } = await import('nanoid');
  let attempt = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    attempt++;
    username = `${baseUsername}${attempt}-${nanoid(4)}`;
  }
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const data: {
    id?: string;
    email: string;
    password: string;
    username: string;
    name?: string;
  } = { id: `usr_${nanoid()}`, email, password: hashedPassword, username }
  if (name) {
    data.name = name;
  }else{
    data.name = baseUsername;
  }
  const user = await prisma.user.create({
    data,
  });
  logger.info(`User registered successfully: ${user.id}`);
  return user;
};

export const login = async (email: string, password: string) => {
  logger.info(`Login attempt for user: ${email}`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn(`Login failed: User not found - ${email}`);
    throw new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND);
  }
  if (!user.password) {
    logger.warn(`Login failed: User has no password set - ${email}`);
    throw new AppError('User has no password set', 401, ErrorCodes.AUTH_NO_PASSWORD_SET);
  }
  // if (!user) throw (new AppError("No password set", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn(`Login failed: Invalid login method for user - ${email}`);
    throw new AppError('Invalid login method', 400, ErrorCodes.AUTH_WRONG_LOGIN_METHOD);
  }
  const { accessToken, refreshToken } = generateAccessTokens(user.id);

  logger.info(`User logged in successfully: ${user.id}`);

  return { user, accessToken, refreshToken };
};


export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError('User no longer exists', 404, ErrorCodes.RESOURCE_NOT_FOUND);
    }
    const { accessToken } = generateAccessTokens(user.id);

    logger.info(`New access token issued for user ${user.id}`);

    return accessToken;

  } catch (err) {
    logger.warn(`Invalid refresh token attempt`);
    throw new AppError('Invalid or expired refresh token', 400, ErrorCodes.AUTH_INVALID_REFRESH_TOKEN);
  }
};

export const generateAccessTokens = (userId: string) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  // Generate refresh token (longer-lived)
  const refreshToken = jwt.sign(
    { userId: userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}




export const handleGoogleLogin = async (googleProfile: any) => {
  const email = googleProfile.emails[0].value;
  const googleId = googleProfile.id;
  const name = googleProfile.displayName;
  const avatarUrl = googleProfile.photos[0].value;

  // Find user by googleId
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link Google account
      user = await prisma.user.update({
        where: { email },
        data: { googleId, avatarUrl, name },
      });
    } else {
      const { nanoid } = await import('nanoid');
      // Create new user
      user = await prisma.user.create({
        data: {
          id: `usr_${nanoid()}`,
          email,
          googleId,
          name,
          avatarUrl,
          username: await generateUsername(email, name),
        },
      });
    }
  }
  const { accessToken, refreshToken } = generateAccessTokens(user.id);

  return { user, accessToken, refreshToken };
};