import { Request, Response, NextFunction } from 'express';
import * as rsvpService from '../services/rsvpService';
import * as eventService from '../services/eventService';
import { catchAsync, AppError, ErrorCodes } from '../utils/errorHandler';
import { Prisma } from '@prisma/client';

interface AuthRequest extends Request {
    userId: string;
}

export const createRSVP = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;
    const userId = req.userId;

    if (!eventId) return next(new AppError('Event ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));

    const event = await eventService.getEventById(eventId, true);
    if (!event) return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));

    const existingRSVP = await rsvpService.getRSVPByUserAndEvent(userId, eventId);
    if (existingRSVP) return next(new AppError('User has already RSVPed to this event', 409, ErrorCodes.RESOURCE_ALREADY_EXISTS));

    const newRSVP: Prisma.RSVPCreateInput = {
        user: { connect: { id: userId } },
        event: { connect: { id: eventId } },
    };

    const rsvp = await rsvpService.createRSVP(newRSVP);
    res.status(201).json(rsvp);
});

export const getRSVPsOfLoggedInUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const rsvp = await rsvpService.getRSVPsByUserId(userId);
    res.json(rsvp);
});

export const getRSVPsOfUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId;
    const rsvp = await rsvpService.getRSVPsByUserId(userId);
    res.json(rsvp);
});

export const getRSVPsOfEvent = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.eventId;
    const rsvp = await rsvpService.getRSVPsByEventId(userId);
    res.json(rsvp);
});

export const getRSVP = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const rsvp = await rsvpService.getRSVPById(req.params.rsvpId);
    if (!rsvp) {
        return next(new AppError('RSVP not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.json(rsvp);
});

export const deleteRSVP = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const rsvp = await rsvpService.deleteRSVPById(req.params.rsvpId);
    if (!rsvp) {
        return next(new AppError('RSVP not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.status(204).send();
});

export const deleteRSVPByEvent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;
    const userId = req.userId;

    if (!eventId) return next(new AppError('Event ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));

    const event = await eventService.getEventById(eventId, true);
    if (!event) return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));

    const existingRSVP = await rsvpService.getRSVPByUserAndEvent(userId, eventId);
    if (!existingRSVP) return next(new AppError('No Rsvp with this event foud', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    const rsvp = await rsvpService.deleteRSVPById(existingRSVP.id);
    if (!rsvp) {
        return next(new AppError('RSVP not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.status(204).send();
});