import prisma from '../config/database';
import { Category } from '@prisma/client';

export const createCategory = async (name: string, emoji?: string): Promise<Category> => {
    const { nanoid } = await import('nanoid');
    return await prisma.category.create({
        data: {
            id: `cat_${nanoid()}`,
            name,
            emoji,
        },
    });
}

export const getCategories = async (): Promise<Category[]> => {
    return await prisma.category.findMany();
}

export const getCategoryById = async (id: string): Promise<Category | null> => {
    return await prisma.category.findUnique({
        where: { id },
    });
}

export const updateCategory = async (id: string, name: string, emoji?: string): Promise<Category> => {
    return await prisma.category.update({
        where: { id },
        data: {
            name,
            emoji,
        },
    });
}

export const deleteCategory = async (id: string): Promise<Category> => {
    return await prisma.category.delete({
        where: { id },
    });
}
