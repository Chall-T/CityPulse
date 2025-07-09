import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { catchAsync, AppError, ErrorCodes } from '../utils/errorHandler';
import { USER_LIMITS } from '../config/limits';
import { containsProfanity } from '../utils/profanityFilter';

interface AuthRequest extends Request {
    userId: string;
}


export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.getUserById(req.params.userId);
    if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.json(user);
});

export const returnLoggedInUser = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) return next(new AppError("No UserId found", 500, ErrorCodes.SERVER_INTERNAL_ERROR));

  const user = await userService.getUserPersonalProfileById(req.userId);

  res.json({ user });
});


export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, username, bio, avatarUrl } = req.body;
    if (name && (name.length > USER_LIMITS.NAME_MAX_LENGTH || name.length < USER_LIMITS.NAME_MIN_LENGTH)) return next(new AppError("Name is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (containsProfanity(name)) return next(new AppError("Name contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    if (username && (username.length > USER_LIMITS.USERNAME_MAX_LENGTH || username.length < USER_LIMITS.USERNAME_MIN_LENGTH)) return next(new AppError("Username is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (containsProfanity(username)) return next(new AppError("Username contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    if (bio && (bio.length > USER_LIMITS.BIO_MAX_LENGTH)) return next(new AppError("Bio is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (containsProfanity(bio)) return next(new AppError("Bio contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (bio) updates.bio = bio;
    if (avatarUrl) updates.avatarUrl = avatarUrl;
    if (Object.keys(updates).length === 0) {
        return next(new AppError('No valid fields provided to update', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const updatedUser = await userService.updateUser(req.params.userId, updates);

    if (!updatedUser) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.json(updatedUser);
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.deleteUser(req.params.userId);
    if (!user) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.status(204).send();
});


