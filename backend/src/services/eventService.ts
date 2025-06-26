import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
export type Creator = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export const createEvent = async (userData: Prisma.EventCreateInput) => {
  // import { nanoid } from 'nanoid'; 

  const eventId = `evt_${ulid()}`;
  userData.id = eventId;
  return prisma.event.create({ data: userData });
};

export const setCordsEvent = async (id: string, lat: number, lng: number) => {
  return await prisma.$executeRaw(Prisma.sql`
    UPDATE "Event"
    SET coords = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${id}
  `);
}


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
export const getEventByIdWithCords = async (id: string, fetchCategories: boolean) => {
  const rawEvent: any = await prisma.$queryRaw(Prisma.sql`
  SELECT 
    id, 
    title, 
    description, 
    "imageUrl",
    "dateTime",
    location, 
    capacity, 
    "createdAt", 
    "updatedAt", 
    "creatorId",
    ST_AsGeoJSON(coords)::TEXT AS coords
  FROM "Event"
  WHERE id = ${id}
`);

  const event = rawEvent[0];

  if (event?.coords) {
    event.coords = JSON.parse(event.coords);
  }
  if (event && event.coords_geojson) {
    event.coords = JSON.parse(event.coords_geojson);
    delete event.coords_geojson;
  }

  const fullEvent = await prisma.event.findUnique({
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
  });

  return { ...fullEvent, coords: event.coords };
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
  } else if (fromDate) {
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
  const categoryFilter = categoryIds.length > 0
    ? Prisma.sql`AND ce."A" = ANY(${Prisma.join(categoryIds)})`
    : Prisma.sql``;
  const query = Prisma.sql`
  WITH filtered_events AS (
    SELECT 
      e.id,
      ST_Y(e.coords::geometry) AS lat,
      ST_X(e.coords::geometry) AS lng,
      e.coords,
      ST_GeoHash(e.coords::geometry, ${Prisma.raw(`${precision}::int`)}) AS geohash
    FROM "Event" e
    INNER JOIN "_CategoryToEvent" ce ON ce."B" = e.id
    WHERE e.coords IS NOT NULL
      AND ST_Y(e.coords::geometry) BETWEEN ${minLat} AND ${maxLat}
      AND ST_X(e.coords::geometry) BETWEEN ${minLng} AND ${maxLng}
      ${categoryFilter}
  )
  SELECT 
    geohash,
    COUNT(*) AS count,
    AVG(lat) AS lat,
    AVG(lng) AS lng
  FROM filtered_events
  GROUP BY geohash;
`;


  const result = await prisma.$queryRaw<Array<{
    geohash: string;
    count: bigint;
    lat: number;
    lng: number;
  }>>(query);

  const pins: ClusterPin[] = result
    .filter(cluster => cluster.lat != null && cluster.lng != null)
    .map(cluster => ({
      geohash: cluster.geohash,
      count: Number(cluster.count),
      lat: parseFloat(String(cluster.lat)),
      lng: parseFloat(String(cluster.lng)),
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
  // Build array of filters as Prisma.sql parts
  const filters: Prisma.Sql[] = [];

  // category filter
  if (categoryIds.length > 0) {
    filters.push(Prisma.sql`AND ce."A" = ANY(${categoryIds})`);
  }

  // date filters
  if (fromDate) {
    filters.push(Prisma.sql`AND e."dateTime" >= ${fromDate}`);
  }
  if (toDate) {
    filters.push(Prisma.sql`AND e."dateTime" <= ${toDate}`);
  }

  const query = Prisma.sql`
  SELECT DISTINCT
    e.id,
    ST_Y(e.coords::geometry) AS lat,
    ST_X(e.coords::geometry) AS lng
  FROM "Event" e
  INNER JOIN "_CategoryToEvent" ce ON ce."B" = e.id
  WHERE e.coords IS NOT NULL
    AND ST_Y(e.coords::geometry) BETWEEN ${minLat} AND ${maxLat}
    AND ST_X(e.coords::geometry) BETWEEN ${minLng} AND ${maxLng}
    ${Prisma.join(filters, ' ')}
`;


  const result = await prisma.$queryRaw<Array<{
    id: string;
    lat: number;
    lng: number;
  }>>(query);

  return result.map(pin => ({
    id: pin.id,
    lat: pin.lat,
    lng: pin.lng,
  }));
}
