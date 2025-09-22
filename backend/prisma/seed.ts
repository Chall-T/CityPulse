import { PrismaClient, Prisma } from '@prisma/client';
import { createCategory } from '../src/services/categoryService';
import { register } from '../src/services/authService';
import { createEvent } from '../src/services/eventService';
const prisma = new PrismaClient();

async function main() {
  const categoriesData = [
    { name: 'Street Food', emoji: '🍜' },
    { name: 'Café Crawl', emoji: '☕' },
    { name: 'Beer Garden', emoji: '🍻' },
    { name: 'Wine Bar', emoji: '🍷' },
    { name: 'Cocktail Evening', emoji: '🍸' },

    { name: 'Music', emoji: '🎵' },
    { name: 'Jazz', emoji: '🎷' },
    { name: 'Karaoke', emoji: '🎤' },
    { name: 'Stand-up Comedy', emoji: '😂' },

    { name: 'Gallery', emoji: '🖼️' },
    { name: 'Street Art', emoji: '🎨' },
    { name: 'Exhibition', emoji: '🖌️' },
    { name: 'DIY Workshop', emoji: '🛠️' },

    { name: 'Movie', emoji: '🎬' },
    { name: 'Cinema', emoji: '📽️' },

    { name: 'Tempelhofer Feld Hangout', emoji: '🛩️' },
    { name: 'Park Picnic & Grill', emoji: '🌭' },
    { name: 'Bike Ride', emoji: '🚴' },
    { name: 'Yoga in the Park', emoji: '🧘' },

    { name: 'Flea Market', emoji: '🛍️' },

    { name: 'Small Club Night', emoji: '🎶' },
    { name: 'Underground Party', emoji: '🎛️' },
    { name: 'Techno Party', emoji: '🔊' },
    { name: 'Themed Party & Rave', emoji: '🕺' },
    { name: 'LGBTQ+ Night & Queer Space', emoji: '🏳️‍🌈' },
    { name: 'Dance Social', emoji: '💃' },
    { name: 'Chill-Out Space', emoji: '🌙' },

    { name: 'Walking Tour', emoji: '🚶' },
    { name: 'Underground Berlin', emoji: '🚇' },

    { name: 'Festival', emoji: '🎉' },
    { name: 'Community Meetup', emoji: '🤝' },

    { name: 'Board Game', emoji: '🎲' },
    { name: 'Trivia', emoji: '❓' },
    { name: 'Video Game', emoji: '🎮' },
    { name: 'Tabletop', emoji: '🐉' },
    { name: 'Puzzles', emoji: '🗝️' },

    { name: 'Boat Party', emoji: '🚤' },
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
  const eventsData: Prisma.EventCreateInput[] = [
    {
      title: 'Berlin Street Food Festival',
      description: 'Sample dishes from dozens of food trucks and international street food stalls.',
      location: 'RAW-Gelände, Berlin',
      lat: 52.5120,
      lng: 13.4540,
      dateTime: new Date('2025-06-21T12:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Street Food') }, { id: getCategoryId('Festival') }] },
    },
    {
      title: 'Open-Air Techno Night',
      description: 'Dance under the stars with some of Berlin’s finest underground DJs.',
      location: 'Sisyphos, Berlin',
      lat: 52.5015,
      lng: 13.4542,
      dateTime: new Date('2025-07-12T22:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Techno Party') }, { id: getCategoryId('Underground Party') }] },
    },
    {
      title: 'Comedy Night at the Club',
      description: 'Local comedians take the stage for an evening of laughs.',
      location: 'Prenzlauer Berg, Berlin',
      lat: 52.5418,
      lng: 13.4241,
      dateTime: new Date('2025-05-28T20:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Stand-up Comedy') }] },
    },
    {
      title: 'Gallery Opening: Urban Street Art',
      description: 'Discover new works by Berlin street artists at this one-night gallery opening.',
      location: 'Kreuzberg, Berlin',
      lat: 52.4996,
      lng: 13.4332,
      dateTime: new Date('2025-06-05T18:30:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1549887534-7f7bc6d0f6b3',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Street Art') }, { id: getCategoryId('Gallery') }] },
    },
    {
      title: 'Park Picnic & Games',
      description: 'Bring snacks, blankets, and join a chill picnic with frisbee and board games.',
      location: 'Tempelhofer Feld, Berlin',
      lat: 52.4731,
      lng: 13.4039,
      dateTime: new Date('2025-06-30T14:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Park Picnic & Grill') }, { id: getCategoryId('Board Game') }] },
    },
    {
      title: 'Rooftop Cocktail Evening',
      description: 'Enjoy sunset cocktails with panoramic views of Berlin.',
      location: 'Hotel Amano Rooftop, Berlin',
      lat: 52.5234,
      lng: 13.3986,
      dateTime: new Date('2025-07-15T19:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Cocktail Evening') }, { id: getCategoryId('Rooftop Bar') }] },
    },
    {
      title: 'Jazz Night in the Park',
      description: 'Live jazz performances with food and drinks in an open-air setting.',
      location: 'Volkspark Friedrichshain, Berlin',
      lat: 52.5306,
      lng: 13.4240,
      dateTime: new Date('2025-08-01T18:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1508780709619-79562169bc64',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Jazz') }, { id: getCategoryId('Music') }] },
    },
    {
      title: 'Underground Berlin Walking Tour',
      description: 'Explore hidden underground spots and secret locations in Berlin.',
      location: 'Start: Alexanderplatz, Berlin',
      lat: 52.5219,
      lng: 13.4132,
      dateTime: new Date('2025-07-20T11:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1582719478186-9a7b93aa8d45',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Walking Tour') }, { id: getCategoryId('Underground Berlin') }] },
    },
    {
      title: 'Café Crawl: Best Coffees in Berlin',
      description: 'Join us on a walking tour visiting the best cafés across the city.',
      location: 'Start: Hackescher Markt, Berlin',
      lat: 52.5212,
      lng: 13.4016,
      dateTime: new Date('2025-07-10T10:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1510626176961-4b1ecf3f1f5b',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Café Crawl') }] },
    },
    {
      title: 'Boat Party on the Spree',
      description: 'Dance, drinks, and sunset vibes on a boat cruising the Spree river.',
      location: 'Spree River, Berlin',
      lat: 52.5206,
      lng: 13.4098,
      dateTime: new Date('2025-08-10T20:00:00Z'),
      imageUrl: 'https://images.unsplash.com/photo-1546484959-03a1e50229b1',
      creator: { connect: { id: user.id } },
      categories: { connect: [{ id: getCategoryId('Boat Party') }, { id: getCategoryId('Dance Social') }] },
    },
  ];


  for (const eventData of eventsData) {
    await createEvent(eventData);
  }

  console.log('Events seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
