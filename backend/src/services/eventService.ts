import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const createEvent = async (userData: Prisma.EventCreateInput) => {
  const { nanoid } = await import('nanoid');
  const eventId = `evt_${nanoid()}`;
  userData.id = eventId;
  return prisma.event.create({ data: userData });
};

export const getEvents = async () => {
  return prisma.event.findMany();
};

export const getEventById = async (id: string) => {
  return prisma.event.findUnique({ where: { id } });
};

export const updateEvent = async (id: string, userUpdateData: Prisma.EventUpdateInput) => {
  return prisma.event.update({ where: { id }, data: userUpdateData });
};

export const deleteEvent = async (id: string) => {
  return prisma.event.delete({ where: { id } });
};