import express from 'express';
import * as eventController from '../controllers/eventController';
import * as rsvpController from '../controllers/rsvpController';
import { authenticate, authorizeEventOwner } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
const router = express.Router();

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
*       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: #/components/schemas/Event
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request, invalid input data
 *         content:
 *           application/json:
 */
router.post('/', authenticate, eventController.createEvent);


router.get('/clusters', eventController.getClusterEventPinsWithFilters);

router.get('/pins', eventController.getEventPinsWithFilters);

/**
 * @swagger
 * /events/{eventId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:eventId', eventController.getEvent);

/**
 * @swagger
 * /events/{eventId}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           description: The ID of the event to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the event.
 *               description:
 *                 type: string
 *                 description: The description of the event.
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: The URL of the event's image.
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time of the event.
 *               location:
 *                 type: string
 *                 description: The location of the event.
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: Latitude for event location.
 *               lng:
 *                 type: number
 *                 format: float
 *                 description: Longitude for event location.
 *               capacity:
 *                 type: integer
 *                 description: The maximum number of participants allowed for the event.
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category the event belongs to.
 *             required:
 *               - title
 *               - description
 *               - dateTime
 *               - location
 *               - categoryId
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request, missing required fields
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to update event
 */

router.patch('/:eventId', authenticate, authorizeEventOwner, eventController.updateEvent);

/**
 * @swagger
 * /event/{eventId}:
 *   delete:
 *     summary: Delete a event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       500:
 *         description: Failed to delete event
 */
router.delete('/:eventId', authenticate, authorizeRoles('ADMIN', 'MODERATOR'), eventController.deleteEvent);

/**
* @swagger
* /events/{eventId}/messages:
*   post:
*     summary: Send a message in an event
*     tags: [Messages, Events]
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: eventId
*         required: true
*         schema:
*           type: string
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - message
*             properties:
*               message:
*                 type: string
*     responses:
*       200:
*         description: Message sent successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Message'
*       400:
*         description: Missing message or event ID
*       401:
*         description: Unauthorized
*/
router.post('/:eventId/messages', authenticate, eventController.sendMessageInEvent);

/**
 * @swagger
 * /events/{eventId}/messages:
 *   get:
 *     summary: Get messages for an event (paginated)
 *     tags: [Messages, Events]
 *     security:
*       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           description: ID of the last message received (used for pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *           description: Number of messages to return
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/messages', authenticate, eventController.getPaginatedMessages);

/**
 * @swagger
 * /events/{eventId}/rsvps:
 *   post:
 *     summary: RSVP to an event
 *     tags: [RSVP, Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       201:
 *         description: RSVP created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVP'
 *       400:
 *         description: Missing event ID
 *       404:
 *         description: Event not found
 *       409:
 *         description: User has already RSVPed
 */
router.post('/:eventId/rsvps', authenticate, rsvpController.setRSVPStatus);

router.post('/:eventId/cancel', authenticate, eventController.cancelEvent);

/**
 * @swagger
 * /events/{eventId}/rsvps:
 *   get:
 *     summary: Get all RSVPs for a specific event
 *     tags: [RSVP, Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of RSVPs for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RSVP'
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/rsvps', authenticate, rsvpController.getRSVPsOfEvent);

/**
 * @swagger
 * /rsvps/{rsvpId}:
 *   delete:
 *     summary: Delete an RSVP by ID
 *     tags: [Events, RSVP]
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
router.delete('/:eventId/rsvps', authenticate, rsvpController.deleteRSVPByEvent);

router.post('/:eventId/vote', authenticate, eventController.voteOnEvent);

router.post('/:eventId/report', authenticate, eventController.reportEvent);


/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get a list of events (paginated)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *           description: ID of the last event received (for pagination)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *           description: Number of events to return
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */

router.get('/', eventController.getPaginatedEventsWithFilters);


export default router;