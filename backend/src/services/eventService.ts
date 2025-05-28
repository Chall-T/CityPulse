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
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
};

export const getEventsPaginatedWithFilters = async (
  cursor?: string,
  limit: number = 20,
  fetchCategories: boolean = true,
  categoryFilter: string[] = [],
  search: string = '',
  sortOrder: 'desc' | 'asc' = 'desc',
) => {
  const where: Prisma.EventWhereInput = {
    AND: [
      ...(categoryFilter.length > 0
        ? [{
          categories: {
            some: { id: { in: categoryFilter } },
          },
        }]
        : []),
      ...(search.trim()
        ? [{
          OR: [
            { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { location: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              categories: {
                some: { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              },
            },
          ],
        }]
        : []),
    ],
  };


  return prisma.event.findMany({

    orderBy: { createdAt: sortOrder },
    take: limit,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    where,
    include: {
      categories: fetchCategories,
      creator: {
        select: {
          id: true,
          name: true,
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
