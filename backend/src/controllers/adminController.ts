
import { catchAsync } from '../utils/errorHandler';
import { AppError, ErrorCodes } from '../utils/errorHandler';
import * as adminService from '../services/adminService';
import { Response, NextFunction, Request } from 'express';
import { findModeratorByUserId } from '../services/adminService';

interface AuthRequest extends Request {
    userId: string;
}

export const getAllReports = catchAsync(async (req: AuthRequest, res: Response) => {
    const { toReview } = req.query;
    if (toReview === 'true') {
        const reportsToReview = await adminService.getAllReportsToReview();
        return res.status(200).json(reportsToReview);
    }
    const reports = await adminService.getAllReports();
    res.status(200).json(reports);
});

export const deleteReport = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const reportId = req.params.reportId;
    if (!reportId) {
        return next(new AppError('Report ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    await adminService.deleteReport(reportId);
    res.status(204).send();
});

export const reviewReport = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const reportId = req.params.reportId;
    const actionTaken = req.body.actionTaken;

    
    const userId = req.userId;

    const moderator = await findModeratorByUserId(userId);
    if (!moderator) {
        return next(new AppError('Moderator not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }           

    if (!reportId) {
        return next(new AppError('Report ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    // if (!actionTaken || !['APPROVE', 'REJECT'].includes(actionTaken)) {
    //     return next(new AppError('Action must be either APPROVE or REJECT', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    // }
    if (!moderator.id) {
        return next(new AppError('Admin ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const reviewedReport = await adminService.reviewReport(reportId, actionTaken, moderator.id);
    if (!reviewedReport) {
        return next(new AppError('Report not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(200).json(reviewedReport);
});

export const updateUserRole = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!userId) {
        return next(new AppError('User ID is required', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }
    if (!role || !['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
        return next(new AppError('New role must be USER, MODERATOR, or ADMIN', 400, ErrorCodes.VALIDATION_REQUIRED_FIELD));
    }

    const updatedUser = await adminService.updateUserRole(userId, role);
    if (!updatedUser) {
        return next(new AppError('User not found', 404, ErrorCodes.RESOURCE_NOT_FOUND));
    }

    res.status(200).json(updatedUser);
});

export const getAllCategories = catchAsync(async (req: AuthRequest, res: Response) => {
    const categories = await adminService.getCategoriesWithActiveCount();
    res.status(200).json(categories);
});