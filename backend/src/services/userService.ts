import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';

export const createUser = async (userData: Prisma.UserCreateInput) => {
  const userId = `usr_${ulid()}`;
  userData.id = userId;
  return prisma.user.create({ data: userData });
};

export const getUsers = async () => {
  return prisma.user.findMany();
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const getUserPersonalProfileById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          categories: true
        }
      },
      rsvps:{ // get only future and active rsvps
        where:{
          event: {
            status: 'ACTIVE',
            dateTime: {
              gte: new Date(), 
            },
          }
        },
        include: {
          event: true
        }
      }
    }
  });
};


export const updateUser = async (id: string, userUpdateData: Prisma.UserUpdateInput) => {
  return prisma.user.update({ where: { id }, data: userUpdateData });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};