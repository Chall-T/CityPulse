import { PrismaClient, Prisma  } from '@prisma/client';
import { createCategory } from '../src/services/categoryService';
import { register } from '../src/services/authService';
import { createEvent } from '../src/services/eventService';
const prisma = new PrismaClient();

async function main() {
  const categoriesData = [
  { name: 'Music', emoji: '🎵' },
  { name: 'Art', emoji: '🎨' },
  { name: 'Tech', emoji: '💻' },
  { name: 'Sports', emoji: '🏀' },
  { name: 'Education', emoji: '📚' },
  { name: 'Health', emoji: '💪' },
  { name: 'Food & Drink', emoji: '🍕' },
  { name: 'Networking', emoji: '🤝' },
  { name: 'Business', emoji: '💼' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Fashion', emoji: '👗' },
  { name: 'Comedy', emoji: '😂' },
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Fitness', emoji: '🏋️' },
  { name: 'Science', emoji: '🔬' },
  { name: 'Theatre', emoji: '🎭' },
  { name: 'Writing', emoji: '✍️' },
  { name: 'Movies', emoji: '🎬' },
  { name: 'Dance', emoji: '💃' },
  { name: 'Photography', emoji: '📸' },
  { name: 'Nature', emoji: '🌿' },
  { name: 'History', emoji: '🏛️' },
  { name: 'Spirituality', emoji: '🧘' },
  { name: 'Pets & Animals', emoji: '🐶' },
  { name: 'Volunteering', emoji: '🙌' },
  { name: 'Environment', emoji: '🌎' },
  { name: 'Startup', emoji: '🚀' },
  { name: 'Politics', emoji: '🏛️' },
  { name: 'Parenting', emoji: '🍼' },
  { name: 'Relationships', emoji: '❤️' },
  { name: 'Mental Health', emoji: '🧠' },
  { name: 'Crafts & DIY', emoji: '🧵' },
  { name: 'Cars & Motorsports', emoji: '🏎️' },
  { name: 'Books & Literature', emoji: '📖' },
  { name: 'Astronomy', emoji: '🌌' },
  { name: 'Finance', emoji: '💰' },
  { name: 'Coding', emoji: '👨‍💻' },
  { name: 'Language Learning', emoji: '🗣️' },
  { name: 'Board Games', emoji: '🎲' },
];
const categories = [];
  for (const catData of categoriesData) {
    const category = await createCategory(catData.name, catData.emoji);
    categories.push(category);
  }
  console.log(`Seeded categories: ${categories.map((c) => c.name).join(', ')}`);

  // 2. Create a user via your service register function
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

  // 3. Create some events linked to user and categories, using your createEvent service
  const eventsData: Prisma.EventCreateInput[] = [
    {
      title: 'Summer Music Fest',
      description: 'A fun outdoor festival with live bands and food trucks.',
      location: 'Berlin',
      dateTime: new Date('2025-08-15T18:00:00Z'),
      imageUrl: 'https://www.icmp.ac.uk/sites/default/files/styles/page_background/public/slider-image/festival_1.jpg?itok=znbQfiko',
      creator: { connect: { id: user.id } },
      categories: {
        connect: [{ id: categories.find((c) => c.name === 'Music')!.id }],
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
        connect: [{ id: categories.find((c) => c.name === 'Art')!.id }],
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
        connect: [{ id: categories.find((c) => c.name === 'Sports')!.id },
            { id: categories.find((c) => c.name === 'Health')!.id },

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
        connect: [{ id: categories.find((c) => c.name === 'Board Games')!.id },
            { id: categories.find((c) => c.name === 'Gaming')!.id },
            { id: categories.find((c) => c.name === 'Education')!.id },
            { id: categories.find((c) => c.name === 'Networking')!.id },
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
