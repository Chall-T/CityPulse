import express from 'express';
import * as rsvpController from '../controllers/rsvpController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /rsvps/{rsvpId}:
 *   get:
 *     summary: Get an RSVP by ID
 *     tags: [RSVP]
 *     parameters:
 *       - in: path
 *         name: rsvpId
 *         required: true
 *         schema:
 *           type: string
 *         description: RSVP ID
 *     responses:
 *       200:
 *         description: RSVP retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVP'
 *       404:
 *         description: RSVP not found
 */
router.get('/:rsvpId', authenticate, rsvpController.getRSVP);

/**
 * @swagger
 * /rsvps/{rsvpId}:
 *   delete:
 *     summary: Delete an RSVP by ID
 *     tags: [RSVP]
 *     security:
*       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rsvpId
 *         required: true
 *         schema:
 *           type: string
 *         description: RSVP ID
 *     responses:
 *       204:
 *         description: RSVP deleted successfully
 *       404:
 *         description: RSVP not found
 */
router.delete('/:rsvpId', authenticate, rsvpController.deleteRSVP);


export default router;
