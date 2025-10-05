import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import * as messageService from '../services/messageService';
import * as rsvpService from '../services/rsvpService';
import { catchAsync, AppError, ErrorCodes } from '../utils/errorHandler';
import { Prisma } from '@prisma/client';
import { isISO8601 } from "validator";
import { isWithinBerlin } from "../utils/validators";
import { isSafeURL } from '../utils/validators';
import { EVENT_LIMITS } from '../config/limits';
import { containsProfanity } from '../utils/profanityFilter';
import { cacheImage } from '../utils/ImageCache';

interface AuthRequest extends Request {
    userId: string;
}

export const createEvent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, description, imageUrl, dateTime, location, lat, lng, capacity, categoryIds } = req.body;

    if (!title) return next(new AppError("Title is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (title.trim().length < EVENT_LIMITS.TITLE_MIN_LENGTH || title.trim().length > EVENT_LIMITS.TITLE_MAX_LENGTH) return next(new AppError("Title is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));

    if (!description) return next(new AppError("Description is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (description.trim().length < EVENT_LIMITS.DESCRIPTION_MIN_LENGTH || description.trim().length > EVENT_LIMITS.DESCRIPTION_MAX_LENGTH) return next(new AppError("Description is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));

    if (!isISO8601(dateTime)) return next(new AppError("Date and time are required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));

    if (typeof location !== "string") return next(new AppError("Location is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (location.trim().length < EVENT_LIMITS.LOCATION_MIN_LENGTH || location.trim().length > EVENT_LIMITS.LOCATION_MAX_LENGTH) return next(new AppError("Location is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(new AppError("At least one category ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (categoryIds.length > 4) {
        return next(new AppError("Too many categories", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    }
    if (lat && (isNaN(lat) || lat < -90 || lat > 90))
        return next(new AppError("Invalid latitude", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (lng && (isNaN(lng) || lng < -180 || lng > 180))
        return next(new AppError("Invalid longitude", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (lat && lng && !isWithinBerlin(lat, lng)) {
        return next(
            new AppError("Event location must be within Berlin.", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS)
        );
    }

    if (containsProfanity(title)) {
        return next(new AppError("Title contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    }
    if (containsProfanity(description)) {
        return next(new AppError("Description contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    }
    const newEvent: Prisma.EventCreateInput = {
        title,
        description,
        dateTime,
        location,
        categories: { connect: categoryIds.map((id: string) => ({ id })), },
        creator: { connect: { id: req.userId } },
    };
    if (imageUrl && isSafeURL(imageUrl)) {
        newEvent.imageUrl = await cacheImage(imageUrl);
      }
      
    if (capacity) newEvent.capacity = capacity;


    const event = await eventService.createEvent(newEvent);

    if (lat !== undefined && lng !== undefined) {
        const setCordsResult = await eventService.setCordsEvent(event.id, lat, lng);
    }
    if (event) {
        rsvpService.createRSVP({
            user: { connect: { id: req.userId } },
            event: { connect: { id: event.id } },
        });
    }
    (res as any).incrementEventCount?.();
    res.status(201).json(event);
});

export const getEvents = catchAsync(async (req: Request, res: Response) => {
    const events = await eventService.getEvents(true);
    res.json(events);
});

export const getEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const event = await eventService.getEventByIdWithCords(req.params.eventId, true);
    if (!event) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.json(event);
});

export const getPaginatedEvents = catchAsync(async (req: Request, res: Response) => {
    const { cursor, limit } = req.query;
    let userLimit = 20;

    if (limit) {
        userLimit = parseInt(limit as string);
    }

    const events = await eventService.getEventsPaginated(cursor as string, userLimit);

    res.json({
        data: events,
        nextCursor: events.length === userLimit ? events[events.length - 1].id : null,
    });
});

export const getClusterEventPinsWithFilters = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const { minLat, maxLat, minLng, maxLng, categoryIds, zoom } = req.query;
    const minLat = parseFloat(req.query.minLat as string);
    const maxLat = parseFloat(req.query.maxLat as string);
    const minLng = parseFloat(req.query.minLng as string);
    const maxLng = parseFloat(req.query.maxLng as string);
    const zoom = parseInt(req.query.zoom as string, 10);
    const categoryIds = (req.query.categoryIds as string);

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng) || isNaN(zoom)) {
        return next(new AppError("Missing required query parameters: minLat, maxLat, minLng, maxLng", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (typeof minLat !== 'number' || typeof maxLat !== 'number' || typeof minLng !== 'number' || typeof maxLng !== 'number' || typeof zoom !== 'number') {
        return next(new AppError("Query parameters must be numbers", 400, ErrorCodes.VALIDATION_INVALID_TYPE));
    }
    let categories: string[] = [];
    if (Array.isArray(categoryIds)) {
        categories = categoryIds
            .flatMap((id: string) => id.split(',').map((s) => s.trim()));
    } else if (typeof categoryIds === 'string') {
        categories = categoryIds.split(',').map((id: string) => id.trim());
    }


    const pins = await eventService.getGeoHashedClusters({ minLat, maxLat, minLng, maxLng, zoom, categoryIds: categories })

    if (!pins) {
        return next(new AppError('Internal error', 500, ErrorCodes.SERVER_INTERNAL_ERROR));
    }
    return res.json({ clusters: pins });
})

export const getEventPinsWithFilters = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // const { minLat, maxLat, minLng, maxLng, categoryIds, zoom } = req.query;
    const minLat = parseFloat(req.query.minLat as string);
    const maxLat = parseFloat(req.query.maxLat as string);
    const minLng = parseFloat(req.query.minLng as string);
    const maxLng = parseFloat(req.query.maxLng as string);
    const categoryIds = (req.query.categoryIds as string);
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLng) || isNaN(maxLng)) {
        return next(new AppError("Missing required query parameters: minLat, maxLat, minLng, maxLng", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (typeof minLat !== 'number' || typeof maxLat !== 'number' || typeof minLng !== 'number' || typeof maxLng !== 'number') {
        return next(new AppError("Query parameters must be numbers", 400, ErrorCodes.VALIDATION_INVALID_TYPE));
    }
    let categories: string[] = []
    if (Array.isArray(categoryIds)) {
        categories = categoryIds
            .flatMap((id: string) => id.split(',').map((s) => s.trim()));
    } else if (typeof categoryIds === 'string') {
        categories = categoryIds.split(',').map((id: string) => id.trim());
    }

    let parsedFromDate = fromDate ? new Date(fromDate as string) : undefined;
    let parsedToDate = toDate ? new Date(toDate as string) : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedFromDate !== undefined && parsedFromDate < today) {
        parsedFromDate = today
    } else if (parsedFromDate === undefined) {
        parsedFromDate = today
    }

    const pins = await eventService.getEventPins({ minLat, maxLat, minLng, maxLng, categoryIds: categories, fromDate: parsedFromDate, toDate: parsedToDate })

    if (!pins) {
        return next(new AppError('Internal error', 500, ErrorCodes.SERVER_INTERNAL_ERROR));
    }
    return res.json({ pins: pins });
})

export const getPaginatedEventsWithFilters = catchAsync(async (req: Request, res: Response) => {
  const { cursor, limit, categoryIds, search, sort, fromDate, toDate } = req.query;

  let userLimit = 20;
  if (limit) userLimit = parseInt(limit as string);

  let sortMode: 'asc' | 'desc' | 'score' = 'desc';
  if (sort && typeof sort === 'string' && ['asc', 'desc', 'score'].includes(sort)) {
    sortMode = sort as 'asc' | 'desc' | 'score';
  }

  const categoryArray: string[] = categoryIds
    ? Array.isArray(categoryIds)
      ? (categoryIds as string[]).map((c) => c.trim())
      : String(categoryIds).split(',').map((c) => c.trim())
    : [];

  const searchTerm = typeof search === 'string' ? search.trim() : '';

  let parsedFromDate = fromDate ? new Date(fromDate as string) : undefined;
  let parsedToDate = toDate ? new Date(toDate as string) : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsedFromDate !== undefined && parsedFromDate < today) {
    parsedFromDate = today;
  } else if (parsedFromDate === undefined) {
    parsedFromDate = today;
  }

  const events = await eventService.getEventsPaginatedWithFilters(
    cursor ? String(cursor) : undefined,
    userLimit,
    true,
    categoryArray,
    searchTerm,
    sortMode,
    parsedFromDate,
    parsedToDate
  );

  res.json({
    data: events,
    nextCursor: events.length === userLimit ? events[events.length - 1].id : null,
  });
});





export const updateEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, imageUrl, dateTime, location, lat, lng, capacity, categoryIds } = req.body;

    const updates: Prisma.EventUpdateInput = {
    };
    if (imageUrl) updates.imageUrl = imageUrl;
    if (capacity) updates.capacity = capacity;
    if (title) updates.title = title;
    if (title.trim().length < EVENT_LIMITS.TITLE_MIN_LENGTH || title.trim().length > EVENT_LIMITS.TITLE_MAX_LENGTH) return next(new AppError("Title is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (description) updates.description = description;
    if (description.trim().length < EVENT_LIMITS.DESCRIPTION_MIN_LENGTH || description.trim().length > EVENT_LIMITS.DESCRIPTION_MAX_LENGTH) return next(new AppError("Description is too short or long", 400, ErrorCodes.VALIDATION_OUT_OF_BOUNDS));
    if (dateTime) updates.dateTime = dateTime;
    if (location) updates.location = location;
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(new AppError("At least one category ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (title && containsProfanity(title)) {
        return next(new AppError("Title contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    }
    if (description && containsProfanity(description)) {
        return next(new AppError("Description contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    }

    if (Object.keys(updates).length === 0) {
        return next(new AppError('No valid fields provided to update', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    const event = await eventService.updateEvent(req.params.eventId, updates);
    if (!event) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    if (event.status == 'CANCELED' || event.dateTime < new Date()) {
        return next(new AppError('Event is cancelled or in the past', 400, ErrorCodes.RESOURCE_IS_IMMUTABLE));
    }

    if (event && lat !== undefined && lng !== undefined) {
        const setCordsResult = await eventService.setCordsEvent(req.params.eventId, lat, lng);
    }

    res.json(event);
});

export const cancelEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;
    const eventCheck = await eventService.getEventById(eventId, false);

    if (!eventCheck) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    if (eventCheck.status == 'CANCELED' && eventCheck.dateTime < new Date()) {
        return next(new AppError('Event is cancelled or in the past', 400, ErrorCodes.RESOURCE_IS_IMMUTABLE));
    }

    const event = await eventService.cancelEventById(eventId);

    res.json(event);
});

export const deleteEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const event = await eventService.deleteEvent(req.params.eventId);
    if (!event) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
    res.status(204).send();
});

export const sendMessageInEvent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId
    const userId = req.userId;
    if (!userId) return next(new AppError("No UserId found", 500, ErrorCodes.SERVER_INTERNAL_ERROR));
    const { message } = req.body;
    if (!message) return next(new AppError("Message is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (containsProfanity(message)) return next(new AppError("Message contains profanity", 400, ErrorCodes.VALIDATION_PROFANITY));
    if (!eventId) return next(new AppError("Event ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    const event = await eventService.getEventById(eventId, false);
    if (event && (event.creatorId != userId && (event.status == 'CANCELED' || event.dateTime < new Date()))) {
        return next(new AppError('Event is cancelled or in the past', 400, ErrorCodes.RESOURCE_IS_IMMUTABLE));
    }
    const newMessage = {
        content: message,
        event: { connect: { id: eventId } },
        user: { connect: { id: req.userId } },
    }
    const msg = await messageService.createMessage(newMessage);
    res.json(msg);
});

export const getPaginatedMessages = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { cursor, limit } = req.query;
    var userLimit = 20;
    if (limit) {
        userLimit = parseInt(limit as string);
    }
    const messages = await messageService.getMessagesByEventIdSection(
        eventId,
        cursor as string,
        userLimit,
    );

    res.json({
        data: messages,
        nextCursor: messages.length > userLimit ? messages[messages.length - 1].id : null,
    });
});


export const voteOnEvent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;
    const userId = req.userId;
    const { value } = req.body;

    if (![1, -1].includes(value)) {
        return next(new AppError('Invalid vote value', 400, ErrorCodes.VALIDATION_INVALID_TYPE));
    }

    const event = await eventService.getEventById(eventId, false);
    if (!event) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    // Add or update vote
    const vote = await eventService.upsertEventVote(eventId, userId, value);

    res.json({ success: true, vote });
});


const validReasons = [
  "SPAM",
  "INAPPROPRIATE",
  "HARASSMENT",
  "MISINFORMATION",
  "OTHER",
] as const;

type ReportReason = (typeof validReasons)[number];

import prisma from '../config/database';

export const reportEvent = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const eventId = req.params.eventId;
    const userId = req.userId;
    const { reason: rawReason, details } = req.body;


    // Validate reason
    if (!rawReason || !validReasons.includes(rawReason)) {
      return next(
        new AppError("Invalid report reason", 400, ErrorCodes.VALIDATION_INVALID_TYPE)
      );
    }

    const reason = rawReason as ReportReason;

    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return next(
        new AppError("Event not found", 404, ErrorCodes.RESOURCE_NOT_FOUND)
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedEventId: eventId,
        reason,
        details: details?.slice(0, 100), // max 100 chars
      },
    });

    res.json({ success: true, report });
  }
);