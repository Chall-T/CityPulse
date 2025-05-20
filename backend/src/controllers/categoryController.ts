import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService';
import { catchAsync } from '../utils/errorHandler';
import { AppError, ErrorCodes } from '../utils/errorHandler';

export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, emoji } = req.body;

    if (!name) {
        return next(new AppError('Name is required to create a category', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const category = await categoryService.createCategory(name, emoji);
    res.status(201).json(category);
});

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await categoryService.getCategories();
    res.status(200).json(categories);
});

export const getCategoryById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(200).json(category);
});

export const updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, emoji } = req.body;
    const updates: Record<string, any> = {};

    if (name) updates.name = name;
    if (emoji) updates.emoji = emoji;

    if (Object.keys(updates).length === 0) {
        return next(new AppError('No valid fields provided to update', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const updatedCategory = await categoryService.updateCategory(req.params.id, updates.name, updates.emoji);

    if (!updatedCategory) {
        return next(new AppError('Category not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(200).json(updatedCategory);
});

export const deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = await categoryService.deleteCategory(req.params.id);

    if (!category) {
        return next(new AppError('Category not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(204).send();
});
