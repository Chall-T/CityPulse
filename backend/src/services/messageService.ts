import prisma from '../config/database';
import { Prisma } from '@prisma/client';



export const createMessage = async (data: Prisma.MessageCreateInput) => {
    const { nanoid } = await import('nanoid');
    const messageId = `msg_${nanoid()}`;
    data.id = messageId;
    return prisma.message.create({ data });
};

export const getMessagesByEventId = async (eventId: string) => {
    return prisma.message.findMany({ where: { eventId } });
};

export const getMessagesByEventIdSection = async (
    eventId: string,
    cursor?: string,
    limit: number = 20
) => {
    return prisma.message.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        ...(cursor && {
            skip: 1,
            cursor: { id: cursor },
        }),
    });
};
