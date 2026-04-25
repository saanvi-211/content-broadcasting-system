const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { handleUpload } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content management endpoints
 */

/**
 * @swagger
 * /content/upload:
 *   post:
 *     summary: Upload new content (Teacher only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, subject, file]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               subject:
 *                 type: string
 *                 example: maths
 *               file:
 *                 type: string
 *                 format: binary
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               rotationDuration:
 *                 type: integer
 *                 description: Minutes per rotation slot
 *                 example: 5
 *     responses:
 *       201:
 *         description: Content uploaded
 *       400:
 *         description: Invalid input
 */
router.post('/upload', authenticate, authorize('teacher'), handleUpload, contentController.uploadContent);

/**
 * @swagger
 * /content/my:
 *   get:
 *     summary: Get teacher's own content (Teacher only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content list
 */
router.get('/my', authenticate, authorize('teacher'), contentController.getMyContent);

/**
 * @swagger
 * /content/all:
 *   get:
 *     summary: Get all content (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All content
 */
router.get('/all', authenticate, authorize('principal'), contentController.getAllContent);

/**
 * @swagger
 * /content/pending:
 *   get:
 *     summary: Get pending content (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending content list
 */
router.get('/pending', authenticate, authorize('principal'), contentController.getPendingContent);

/**
 * @swagger
 * /content/{id}/approve:
 *   patch:
 *     summary: Approve content (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content approved
 *       404:
 *         description: Content not found
 */
router.patch('/:id/approve', authenticate, authorize('principal'), contentController.approveContent);

/**
 * @swagger
 * /content/{id}/reject:
 *   patch:
 *     summary: Reject content (Principal only)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content rejected
 */
router.patch('/:id/reject', authenticate, authorize('principal'), contentController.rejectContent);

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content details
 */
router.get('/:id', authenticate, contentController.getContentById);

module.exports = router;
