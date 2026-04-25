const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcast.controller');
const { publicApiLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * @swagger
 * tags:
 *   name: Broadcasting
 *   description: Public broadcasting endpoints for students
 */

/**
 * @swagger
 * /content/live/{teacherId}:
 *   get:
 *     summary: Get live content for a teacher (Public - no auth)
 *     tags: [Broadcasting]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         description: The UUID of the teacher
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         description: Filter by subject (optional)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Currently active content or no content message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     content:
 *                       type: object
 *                       nullable: true
 */
router.get('/:teacherId', publicApiLimiter, broadcastController.getLiveContent);

module.exports = router;
