import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import geohash from 'ngeohash';


export type Creator = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export const createEvent = async (userData: Prisma.EventCreateInput) => {
  const eventId = `evt_${ulid()}`;
  userData.id = eventId;
  return prisma.event.create({ data: userData });
};

export const setCordsEvent = async (id: string, lat: number, lng: number) => {
  return await prisma.event.update({
    where: { id },
    data: {
      lat,
      lng,
    },
  });
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
        rsvps: {
          select: {
            userId: true
          }
        }
      },
    },

  );
};

export const getEventByIdWithCords = async (id: string, fetchCategories: boolean) => {
  return await prisma.event.findUnique({
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
      rsvps: {
        select: {
          user: {
            select: {
              id: true,
              avatarUrl: true,
              username: true,
              name: true,
            },
          },
        },
      },
      votes: {
        select: {
          userId: true,
          value: true,
        },
      },
    },
  });
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
    where: {
      status: 'ACTIVE',
    }
  });
};

export const getEventsPaginatedWithFilters = async (
  cursor?: string,
  limit: number = 20,
  fetchCategories: boolean = true,
  categoryFilter: string[] = [],
  search: string = '',
  sort: 'asc' | 'desc' | 'score' = 'desc',
  fromDate?: Date,
  toDate?: Date
) => {
  const andFilters: Prisma.EventWhereInput[] = [{
    status: 'ACTIVE',
  }];

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
        gte: fromDate,
        lte: toDate,
      },
    });
  } else if (fromDate) {
    andFilters.push({
      dateTime: { gte: fromDate },
    });
  }

  const where: Prisma.EventWhereInput = { AND: andFilters };

  return prisma.event.findMany({
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
      _count: {
        select: { votes: true },
      },
    },
    orderBy:
      sort === 'score'
        ? { votes: { _count: 'desc' } } // sort by total votes count
        : { dateTime: sort },
  });
};


export const updateEvent = async (id: string, userUpdateData: Prisma.EventUpdateInput) => {
  return prisma.event.update({ where: { id }, data: userUpdateData });
};

export const deleteEvent = async (id: string) => {
  return prisma.event.delete({ where: { id } });
};


function getGeoHashPrecision(zoom: number): number {
  if (zoom >= 15) return 8;
  if (zoom >= 13) return 7;
  if (zoom >= 11) return 6;
  if (zoom >= 9) return 5;
  if (zoom >= 7) return 4;
  return 3;
}

type RawGeoCluster = {
  geohash: string;
  count: string | number | null;
  lat: string | number | null;
  lng: string | number | null;
};

type ClusterPin = {
  geohash: string;
  count: number;
  lat: number;
  lng: number;
};

export async function getGeoHashedClusters({
  minLat,
  maxLat,
  minLng,
  maxLng,
  zoom,
  categoryIds,
}: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoom: number;
  categoryIds: string[];
}) {
  const precision = getGeoHashPrecision(zoom);

  const events = await prisma.event.findMany({
    where: {
      lat: { gte: minLat, lte: maxLat },
      lng: { gte: minLng, lte: maxLng },
      status: 'ACTIVE',
      categories: categoryIds.length > 0 ? {
        some: {
          id: { in: categoryIds },
        },
      } : undefined,
      // Ensure lat and lng are not null
      NOT: [
        { lat: null },
        { lng: null }
      ],
    },
    select: {
      id: true,
      lat: true,
      lng: true,
    },
  });

  const clustersMap = new Map<string, { count: number; latSum: number; lngSum: number }>();

  for (const event of events) {
    const hash = geohash.encode(event.lat!, event.lng!, precision);

    const cluster = clustersMap.get(hash) || { count: 0, latSum: 0, lngSum: 0 };
    cluster.count++;
    cluster.latSum += event.lat!;
    cluster.lngSum += event.lng!;
    clustersMap.set(hash, cluster);
  }

  // Build array of cluster pins
  const pins = Array.from(clustersMap.entries()).map(([geohash, cluster]) => ({
    geohash,
    count: cluster.count,
    lat: cluster.latSum / cluster.count,
    lng: cluster.lngSum / cluster.count,
  }));

  return pins;
}



export async function getEventPins({
  minLat,
  maxLat,
  minLng,
  maxLng,
  categoryIds,
  fromDate,
  toDate,
}: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  categoryIds: string[];
  fromDate?: Date;
  toDate?: Date;
}) {
  const filters: any = {
    lat: {
      not: null,
      gte: minLat,
      lte: maxLat,
    },
    lng: {
      not: null,
      gte: minLng,
      lte: maxLng,
    },
    status: 'ACTIVE',
  };


  if (fromDate || toDate) {
    filters.dateTime = {};
    if (fromDate) filters.dateTime.gte = fromDate;
    if (toDate) filters.dateTime.lte = toDate;
  }

  if (categoryIds.length > 0) {
    filters.categories = {
      some: {
        id: { in: categoryIds },
      },
    };
  }

  const pins = await prisma.event.findMany({
    where: filters,
    select: {
      id: true,
      lat: true,
      lng: true,
    },
    distinct: ['id'], // Just in case duplicates pop up
  });

  return pins;
}


export async function cancelEventById(eventId: string) {
  return await prisma.event.update({
    where: { id: eventId },
    data: { status: 'CANCELED' },
  });
}


export const upsertEventVote = async (eventId: string, userId: string, value: number) => {
    return prisma.eventVote.upsert({
        where: { eventId_userId: { eventId, userId } },
        update: { value },
        create: { eventId, userId, value },
    });
};


