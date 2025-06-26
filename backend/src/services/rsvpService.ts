import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';

export const getRSVPByUserAndEvent = async (userId: string, eventId: string) => {
    return prisma.rSVP.findFirst({
        where: {
            userId,
            eventId,
        },
    });
};

export const getRSVPsByUserId = async (userId: string) => {
    return prisma.rSVP.findMany({
        where: {
            userId,
        },
    });
};

export const getRSVPsByEventId = async (eventId: string) => {
    return prisma.rSVP.findMany({
        where: {
            eventId,
        },
    });
};

export const createRSVP = async (data: Prisma.RSVPCreateInput) => {
    const rsvpId = `rsvp_${ulid()}`;
    data.id = rsvpId;
    return prisma.rSVP.create({ data });
};

export const getRSVPById = async (id: string) => {
    return prisma.rSVP.findUnique({ where: { id } });
};

export const deleteRSVPById = async (id: string) => {
    return prisma.rSVP.delete({ where: { id } });
};
