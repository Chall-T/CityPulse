import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Express TypeScript API',
      version: '1.0.0',
      description: 'A simple Express TypeScript API with Prisma and authentication',
    },
    servers: [
      {
        url: 'http://localhost:1000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the user',
              example: 'abc123',
            },
            email: {
              type: 'string',
              description: 'The user\'s email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'The user\'s password',
              example: 'password123',
            },
            name: {
              type: 'string',
              description: 'The user\'s full name',
              example: 'John Doe',
            },
            username: {
              type: 'string',
              description: 'The user\'s unique username',
              example: 'johndoe',
            },
            avatarUrl: {
              type: 'string',
              description: 'The URL of the user\'s avatar image',
              example: 'https://example.com/avatar.jpg',
            },
            bio: {
              type: 'string',
              description: 'A brief biography of the user',
              example: 'A passionate software developer.',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the user was created',
              example: '2025-05-07T14:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the user was last updated',
              example: '2025-05-07T14:30:00Z',
            },
          },
        },
        Event: {
          type: 'object',
          required: ['title', 'description', 'dateTime', 'location', 'categoryId'],
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the event',
              example: '54321',
            },
            title: {
              type: 'string',
              description: 'The title of the event',
              example: 'Tech Conference 2025',
            },
            description: {
              type: 'string',
              description: 'A detailed description of the event',
              example: 'An amazing tech conference featuring industry leaders.',
            },
            imageUrl: {
              type: 'string',
              description: 'The URL of the event\'s image',
              example: 'https://example.com/event-image.jpg',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the event is scheduled to start',
              example: '2025-06-10T09:00:00Z',
            },
            location: {
              type: 'string',
              description: 'The location where the event will take place',
              example: 'New York City',
            },
            lat: {
              type: 'number',
              description: 'The latitude of the event\'s location',
              example: 40.7128,
            },
            lng: {
              type: 'number',
              description: 'The longitude of the event\'s location',
              example: -74.0060,
            },
            capacity: {
              type: 'integer',
              description: 'The maximum number of people who can attend the event',
              example: 200,
            },
            creatorId: {
              type: 'string',
              description: 'The ID of the user who created the event',
              example: 'abc123',
            },
            categories: {
              type: 'array',
              description: 'The category of the event',
              items: {
                $ref: '#/components/schemas/Category',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the event was created',
              example: '2025-05-07T14:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the event was last updated',
              example: '2025-05-07T14:30:00Z',
            },
          },
        },
        RSVP: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the RSVP',
              example: '1',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user who RSVPed',
              example: '12345',
            },
            eventId: {
              type: 'string',
              description: 'The ID of the event the user RSVPed for',
              example: '54321',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the RSVP was created',
              example: '2025-05-07T14:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the RSVP was last updated',
              example: '2025-05-07T14:30:00Z',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the message',
              example: '67890',
            },
            content: {
              type: 'string',
              description: 'The content of the message',
              example: 'Looking forward to the event!',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the message was created',
              example: '2025-05-07T14:30:00Z',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user who sent the message',
              example: '12345',
            },
            eventId: {
              type: 'string',
              description: 'The ID of the event the message is related to',
              example: '54321',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique identifier for the category',
              example: 'cat_abc123',
            },
            name: {
              type: 'string',
              description: 'The name of the category',
              example: 'Music',
            },
            emoji: {
              type: 'string',
              nullable: true,
              description: 'An optional emoji representing the category',
              example: '🎵',
            },
            events: {
              type: 'array',
              description: 'List of events associated with this category',
              items: {
                $ref: '#/components/schemas/Event',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],  // Path to the route files with annotations
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
