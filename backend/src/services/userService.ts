import prisma from '../config/database';
import { Prisma } from '@prisma/client';

export const createUser = async (userData: Prisma.UserCreateInput) => {
  const { nanoid } = await import('nanoid');
  const userId = `usr_${nanoid()}`;
  userData.id = userId;
  return prisma.user.create({ data: userData });
};

export const getUsers = async () => {
  return prisma.user.findMany();
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (id: string, userUpdateData: Prisma.UserUpdateInput) => {
  return prisma.user.update({ where: { id }, data: userUpdateData });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};