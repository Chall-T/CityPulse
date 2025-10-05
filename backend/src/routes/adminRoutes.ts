import express from 'express';
import * as userController from '../controllers/userController';
import * as adminController from '../controllers/adminController';
import * as eventController from '../controllers/eventController';
import * as categoryController from '../controllers/categoryController';
import { authenticate, authorizeSelf } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
const router = express.Router();

// USERS

router.get('/users', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), userController.getAllUsers);

router.get('/users/:userId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), userController.getUser);

router.patch('/users/:userId/role', authenticate, authorizeRoles('ADMIN'), adminController.updateUserRole);

router.delete('/users/:userId', authenticate, authorizeRoles('ADMIN'), userController.deleteUser);


// CATEGORIES

router.post('/categories/', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.createCategory);

router.patch('/categories/:id', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.updateCategory);

router.delete('/categories/:id', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.deleteCategory);

router.get('/categories/', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), adminController.getAllCategories);

// EVENTS

router.get('/events', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), eventController.getEvents);

router.patch('/events/:eventId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), eventController.updateEvent);

router.delete('/events/:eventId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), eventController.deleteEvent);


// REPORTS

router.get('/reports', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), adminController.getAllReports);

router.delete('/reports/:reportId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), adminController.deleteReport);

router.post('/reports/:reportId/review', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), adminController.reviewReport);

export default router;