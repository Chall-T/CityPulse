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
      title: 'Summer Music Fest',
      description: 'A fun outdoor festival with live bands and food trucks.',
      location: 'Berlin',
      dateTime: new Date('2025-08-15T18:00:00Z'),
      imageUrl: 'https://www.icmp.ac.uk/sites/default/files/styles/page_background/public/slider-image/festival_1.jpg?itok=znbQfiko',
      creator: { connect: { id: user.id } },
      categories: {
        connect: [{ id: getCategoryId('Music')}],
      },
    },
    {
      title: 'Modern Art Exhibition',
      description: 'Explore stunning modern art by upcoming local artists.',
      location: 'Berlin',
      dateTime: new Date('2025-06-10T10:00:00Z'),
      imageUrl: 'https://www.laartshow.com/wp-content/uploads/20190127-la-artshow-19-1179.jpg',
      creator: { connect: { id: user.id } },
      categories: {
        connect: [{ id: getCategoryId('Art')}],
      },
    },
    {
      title: 'City Marathon 2025',
      description: 'Join thousands running through the city streets.',
      location: 'Berlin',
      dateTime: new Date('2025-09-05T07:00:00Z'),
      imageUrl: 'https://wmimg.azureedge.net/public/img/marathons/bmw-berlin-marathon/bDMIHP_bmw-berlin-marathon.jpg?c=1504021533',
      creator: { connect: { id: user.id } },
      categories: {
        connect: [{ id: getCategoryId('Sports') },
        { id: getCategoryId('Health')!.id },

        ],
      },
    },
    {
      title: 'Chess Tournament',
      description: 'Small local tournament for chess enthusiasts.',
      location: 'Berlin',
      dateTime: new Date('2025-10-05T16:00:00Z'),

      creator: { connect: { id: user.id } },
      categories: {
        connect: [{ id: getCategoryId('Board Games') },
        { id: getCategoryId('Gaming') },
        { id: getCategoryId('Education') },
        { id: getCategoryId('Networking') },
        ],
      },
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
