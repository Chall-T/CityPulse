import express from 'express';
import * as userController from '../controllers/userController';
import * as rsvpController from '../controllers/rsvpController';
import { authenticate, authorizeSelf } from '../middleware/authMiddleware';

const router = express.Router();



router.get('/me', authenticate, userController.returnLoggedInUser);

/**
 * @swagger
 * /users/{userId}/rsvps:
 *   get:
 *     summary: Get all RSVPs of a specific user
 *     tags: [RSVP, Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve RSVPs for
 *     responses:
 *       200:
 *         description: List of RSVPs for the specified user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RSVP'
 *       404:
 *         description: User not found
 */
router.get('/:userId/rsvps', authenticate, authorizeSelf, rsvpController.getRSVPsOfUser);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:userId', authenticate, userController.getUser);

/**
 * @swagger
 * /users/{userId}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: User updated successfully
 *       500:
 *         description: Failed to update user
 *       404:
 *         description: User not found
 */
router.patch('/:userId', authenticate, authorizeSelf, userController.updateUser);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       500:
 *         description: Failed to delete post
 */
router.delete('/:userId', authenticate, authorizeSelf, userController.deleteUser);


export default router;