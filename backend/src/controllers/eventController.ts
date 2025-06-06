import { Request, Response, NextFunction } from 'express';
import * as eventService from '../services/eventService';
import * as messageService from '../services/messageService';
import * as rsvpService from '../services/rsvpService';
import { catchAsync, AppError, ErrorCodes } from '../utils/errorHandler';
import { Prisma } from '@prisma/client';
import { isISO8601 } from "validator";
import { isWithinBerlin } from "../utils/validators";
import { isSafeURL } from '../utils/validators';
interface AuthRequest extends Request {
    userId: string;
}

export const createEvent = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, description, imageUrl, dateTime, location, lat, lng, capacity, categoryIds } = req.body;
    if (!title || title.trim().length < 3) return next(new AppError("Title is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (!description || description.trim().length < 30) return next(new AppError("Description is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (!isISO8601(dateTime)) return next(new AppError("Date and time are required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (typeof location !== "string" || location.trim().length < 3) return next(new AppError("Location is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(new AppError("At least one category ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (categoryIds.length > 4){
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
    const newEvent: Prisma.EventCreateInput = {
        title,
        description,
        dateTime,
        location,
        categories: { connect: categoryIds.map((id: string) => ({ id })), },
        creator: { connect: { id: req.userId } },
    };
    if (imageUrl && isSafeURL(imageUrl)) newEvent.imageUrl = imageUrl;
    if (lat) newEvent.lat = lat;
    if (lng) newEvent.lng = lng;
    if (capacity) newEvent.capacity = capacity;


    const event = await eventService.createEvent(newEvent);

    if (event) {
        rsvpService.createRSVP({
            user: { connect: { id: req.userId } },
            event: { connect: { id: event.id } },
        });
    }
    res.status(201).json(event);
});

export const getEvents = catchAsync(async (req: Request, res: Response) => {
    const events = await eventService.getEvents(true);
    res.json(events);
});

export const getEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const event = await eventService.getEventById(req.params.eventId, true);
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

export const getPaginatedEventsWithFilters = catchAsync(async (req: Request, res: Response) => {
    const { cursor, limit, categories, search, sort, fromDate, toDate } = req.query;
    let userLimit = 20;
    let sortOrder: 'asc' | 'desc' = 'desc';
    if (limit) {
        userLimit = parseInt(limit as string);
    }
    if (sort && typeof sort === 'string' && ['asc', 'desc'].includes(sort)) {
        sortOrder = sort as 'asc' | 'desc';
    }

    const categoryArray: string[] = categories
        ? Array.isArray(categories)
            ? (categories as string[]).map((c) => c.trim())
            : String(categories).split(',').map((c) => c.trim())
        : [];


    const searchTerm = typeof search === 'string' ? search.trim() : '';

    let parsedFromDate = fromDate ? new Date(fromDate as string) : undefined;
    let parsedToDate = toDate ? new Date(toDate as string) : undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(parsedFromDate !== undefined, parsedFromDate !== undefined && parsedFromDate < today)
    if (parsedFromDate !== undefined && parsedFromDate < today) {
        parsedFromDate = today
    } else if (parsedFromDate === undefined) {
        parsedFromDate = today
    }

    const events = await eventService.getEventsPaginatedWithFilters(
        cursor ? String(cursor) : undefined,
        userLimit,
        true,
        categoryArray,
        searchTerm,
        sortOrder,
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
    if (lat) updates.lat = lat;
    if (lng) updates.lng = lng;
    if (capacity) updates.capacity = capacity;
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (dateTime) updates.dateTime = dateTime;
    if (location) updates.location = location;
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(new AppError("At least one category ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    if (Object.keys(updates).length === 0) {
        return next(new AppError('No valid fields provided to update', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const event = await eventService.updateEvent(req.params.eventId, updates);
    if (!event) {
        return next(new AppError('Event not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }
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
    const { message } = req.body;
    if (!message) return next(new AppError("Message is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    if (!eventId) return next(new AppError("Event ID is required", 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
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
