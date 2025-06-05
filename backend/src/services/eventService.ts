import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export type Creator = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

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
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
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
  fromDate?: Date,
  toDate?: Date
) => {
  const andFilters: Prisma.EventWhereInput[] = [];

  if (categoryFilter.length > 0) {
    andFilters.push({
      categories: {
        some: { id: { in: categoryFilter } },
      },
    });
  }

  if (search.trim()) {
    andFilters.push({
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
    });
  }

  if (fromDate && toDate) {
    andFilters.push({
      dateTime: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      },
    });
  }else if(fromDate){
    andFilters.push({
      dateTime: {
        ...(fromDate && { gte: fromDate }),
      },
    });
  }

  const where: Prisma.EventWhereInput = {
    AND: andFilters,
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
