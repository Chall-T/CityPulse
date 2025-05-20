import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const createEvent = async (userData: Prisma.EventCreateInput) => {
  const { nanoid } = await import('nanoid');
  const eventId = `evt_${nanoid()}`;
  userData.id = eventId;
  return prisma.event.create({ data: userData });
};

export const getEvents = async (fetchCategories: boolean) => {
  return prisma.event.findMany({
    include: {
      categories: fetchCategories,
    },
  });
};

export const getEventById = async (id: string, fetchCategories: boolean) => {
  return prisma.event.findUnique(
    {
      where: { id },
      include: {
        categories: fetchCategories,
      },
    },

  );
};

export const getEventsPaginated = async (
  cursor?: string,
  limit: number = 20, 
  fetchCategories: boolean = true
) => {
  return prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    include: {
      categories: fetchCategories,
      creator: {
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatarUrl: true,
      },
    },
    },
  });
};

export const updateEvent = async (id: string, userUpdateData: Prisma.EventUpdateInput) => {
  return prisma.event.update({ where: { id }, data: userUpdateData });
};

export const deleteEvent = async (id: string) => {
  return prisma.event.delete({ where: { id } });
};