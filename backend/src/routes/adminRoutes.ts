import express from 'express';
import * as userController from '../controllers/userController';
import * as rsvpController from '../controllers/rsvpController';
import * as eventController from '../controllers/eventController';
import * as categoryController from '../controllers/categoryController';
import { authenticate, authorizeSelf } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
const router = express.Router();

// USERS

router.get('/users', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), userController.getAllUsers);

router.get('/users/:userId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), userController.getUser);


router.delete('/users/:userId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), userController.deleteUser);


// CATEGORIES

router.post('/categories/', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.createCategory);

router.patch('/categories/:id', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.updateCategory);

router.delete('/categories/:id', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), categoryController.deleteCategory);


// EVENTS

router.delete('/:eventId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), eventController.deleteEvent);



export default router;