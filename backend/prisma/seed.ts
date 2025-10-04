import { PrismaClient, Prisma } from '@prisma/client';
import { createCategory } from '../src/services/categoryService';
import { register } from '../src/services/authService';
import { createEvent, getEvents } from '../src/services/eventService';
import { searchStockImages } from '../../frontend/src/assets/images';
import type { Category } from '../../frontend/src/types';
const prisma = new PrismaClient();

async function main() {
  const categoriesData = [
    { name: 'Food', emoji: '🍜' },
    { name: 'Café', emoji: '☕' },
    { name: 'Pub / Bar', emoji: '🍻' },

    { name: 'Music', emoji: '🎵' },
    { name: 'Karaoke', emoji: '🎤' },
    { name: 'Stand-up Comedy', emoji: '😂' },

    { name: 'Gallery / Art', emoji: '🖼️' },
    { name: 'DIY Workshop', emoji: '🛠️' },

    { name: 'Movie', emoji: '🎬' },

    { name: 'Park Hangout', emoji: '🛩️' },
    { name: 'BBQ / Grill', emoji: '🌭' },
    { name: 'Bike Ride', emoji: '🚴' },
    { name: 'Sport', emoji: '🏊‍♀️' },

    { name: 'Flea Market', emoji: '🛍️' },

    { name: 'Club Night', emoji: '🎶' },
    { name: 'House Party', emoji: '🎛️' },
    { name: 'Techno', emoji: '🔊' },
    { name: 'LGBTQ+ Night & Queer Space', emoji: '🏳️‍🌈' },
    { name: 'Dance Social', emoji: '💃' },
    { name: 'Chill-Out', emoji: '😌' },

    { name: 'Tour', emoji: '🚶' },

    { name: 'Festival', emoji: '🎉' },
    { name: 'Community', emoji: '🤝' },

    { name: 'Board Game', emoji: '🎲' },
    { name: 'Video Game', emoji: '🎮' },
    { name: 'Tabletop', emoji: '🐉' },
    { name: 'Puzzles', emoji: '🗝️' },

    { name: 'Boat', emoji: '🚤' },
    { name: 'Rooftop Bar', emoji: '🌇' },
    { name: 'Experimental Performances', emoji: '🎭' },
  ]
  const categories: any[] = [];
  for (const catData of categoriesData) {
    const category = await createCategory(catData.name, catData.emoji);
    categories.push(category);
  }
  console.log(`Seeded categories: ${categories.map((c) => c.name).join(', ')}`);

  const email = 'testuser@example.com';
  const password = 'Password123!';
  const baseUsername = 'testuser';
  const name = 'Test User';

  let user;
  try {
    user = await register(email, password, baseUsername, name);
  } catch (err: any) {
    if (err.message.includes('Email already in use')) {
      user = await prisma.user.findUnique({ where: { email } });
      console.log('User already exists, using existing user');
    } else {
      throw err;
    }
  }
  if (!user) {
    throw new Error('User creation failed');
  }
  console.log(`User id: ${user.id}`);
  const getCategoryId = (name: string) => {
    const cat = categories.find(c => c.name === name);
    if (!cat) throw new Error(`Category "${name}" not found`);
    return cat.id;
  };
  function getMocapkCategory(name: string): Category {
    const cat = categories.find(c => c.name === name);
    if (!cat) throw new Error(`Category "${name}" not found`);
    return cat;
  }
  const eventsData: Prisma.EventCreateInput[] = [
    {
      title: 'Berlin Street Food Festival',
      description: 'Sample dishes from dozens of food trucks and international street food stalls.',
      location: 'RAW-Gelände, Berlin',
      lat: 52.5120,
      lng: 13.4540,
      dateTime: new Date('2025-09-30T12:00:00Z'),
      imageUrl: searchStockImages('food festival', [getMocapkCategory('Food'), getMocapkCategory('Festival')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Food') }, { id: getCategoryId('Festival') }] },
    },
    {
      title: 'Open-Air Techno Night',
      description: 'Dance under the stars with some of Berlin’s finest underground DJs.',
      location: 'Sisyphos, Berlin',
      lat: 52.5015,
      lng: 13.4542,
      dateTime: new Date('2025-11-12T22:00:00Z'),
      imageUrl: searchStockImages('techno night', [getMocapkCategory('Techno'), getMocapkCategory('Club Night')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Techno') }, { id: getCategoryId('Club Night') }] },
    },
    {
      title: 'Comedy Night at the Club',
      description: 'Local comedians take the stage for an evening of laughs.',
      location: 'Prenzlauer Berg, Berlin',
      lat: 52.5418,
      lng: 13.4241,
      dateTime: new Date('2025-12-28T20:00:00Z'),
      imageUrl: searchStockImages('comedy night', [getMocapkCategory('Stand-up Comedy')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Stand-up Comedy') }] },
    },
    {
      title: 'Gallery Opening: Urban Street Art',
      description: 'Discover new works by Berlin street artists at this one-night gallery opening.',
      location: 'Kreuzberg, Berlin',
      lat: 52.4996,
      lng: 13.4332,
      dateTime: new Date('2025-10-05T18:30:00Z'),
      imageUrl: searchStockImages('urban street art', [getMocapkCategory('Gallery / Art')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Gallery / Art') }] },
    },
    {
      title: 'Park Picnic & Games',
      description: 'Bring snacks, blankets, and join a chill picnic with frisbee and board games.',
      location: 'Tempelhofer Feld, Berlin',
      lat: 52.4731,
      lng: 13.4039,
      dateTime: new Date('2025-09-30T14:00:00Z'),
      imageUrl: searchStockImages('park picnic', [getMocapkCategory('BBQ / Grill'), getMocapkCategory('Board Game')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('BBQ / Grill') }, { id: getCategoryId('Board Game') }] },
    },
    {
      title: 'Rooftop Cocktail Evening',
      description: 'Enjoy sunset cocktails with panoramic views of Berlin.',
      location: 'Hotel Amano Rooftop, Berlin',
      lat: 52.5234,
      lng: 13.3986,
      dateTime: new Date('2025-10-15T19:00:00Z'),
      imageUrl: searchStockImages('rooftop cocktail', [getMocapkCategory('Pub / Bar'), getMocapkCategory('Rooftop Bar')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Pub / Bar') }, { id: getCategoryId('Rooftop Bar') }] },
    },
    {
      title: 'Jazz Night in the Park',
      description: 'Live jazz performances with food and drinks in an open-air setting.',
      location: 'Volkspark Friedrichshain, Berlin',
      lat: 52.5306,
      lng: 13.4240,
      dateTime: new Date('2025-11-01T18:00:00Z'),
      imageUrl: searchStockImages('jazz night', [getMocapkCategory('Music')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Music') }] },
    },
    {
      title: 'Underground Berlin Walking Tour',
      description: 'Explore hidden underground spots and secret locations in Berlin.',
      location: 'Start: Alexanderplatz, Berlin',
      lat: 52.5219,
      lng: 13.4132,
      dateTime: new Date('2025-11-20T11:00:00Z'),
      imageUrl: searchStockImages('underground tour', [getMocapkCategory('Tour')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Tour') }] },
    },
    {
      title: 'Café Crawl: Best Coffees in Berlin',
      description: 'Join us on a walking tour visiting the best cafés across the city.',
      location: 'Start: Hackescher Markt, Berlin',
      lat: 52.5212,
      lng: 13.4016,
      dateTime: new Date('2025-10-10T10:00:00Z'),
      imageUrl: searchStockImages('café crawl', [getMocapkCategory('Café')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Café') }] },
    },
    {
      title: 'Boat Party on the Spree',
      description: 'Dance, drinks, and sunset vibes on a boat cruising the Spree river.',
      location: 'Spree River, Berlin',
      lat: 52.5206,
      lng: 13.4098,
      dateTime: new Date('2025-12-10T20:00:00Z'),
      imageUrl: searchStockImages('boat party', [getMocapkCategory('Boat')])[0] || '',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Boat') }] },
    },
  ];


  for (const eventData of eventsData) {
    await createEvent(eventData);
  }
  const events = await getEvents(false)
  console.log(`Events (${eventsData.length}/${events.length}) seeded successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
