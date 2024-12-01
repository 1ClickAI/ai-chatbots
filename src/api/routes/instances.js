const express = require('express');
const router = express.Router();
const {
    createInstance,
    deleteInstance,
    listInstances,
    getQRCode,
    updateWebhook,
    disconnectInstance,
} = require('../controllers/instances');

/**
 * @swagger
 * /api/instances:
 *   post:
 *     summary: Create a new instance
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               udid:
 *                 type: string
 *                 description: Unique identifier for the instance.
 *                 example: "unique-id-123"
 *     responses:
 *       201:
 *         description: Instance created successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.post('/', createInstance);

/**
 * @swagger
 * /api/instances/{id}:
 *   delete:
 *     summary: Delete an instance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier for the instance.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instance deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Instance not found.
 *       500:
 *         description: Internal server error.
 */
router.delete('/:id', deleteInstance);

/**
 * @swagger
 * /api/instances:
 *   get:
 *     summary: List all instances
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of instances.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   udid:
 *                     type: string
 *                     description: Unique identifier for the instance.
 *                   status:
 *                     type: string
 *                     description: Status of the instance.
 *                   phone_number:
 *                     type: string
 *                     description: Associated phone number.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
router.get('/', listInstances);

/**
 * @swagger
 * /api/instances/{id}/qr:
 *   get:
 *     summary: Get QR Code for an instance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier for the instance.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR Code retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qr_code:
 *                   type: string
 *                   description: QR Code string.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Instance not found.
 *       500:
 *         description: Internal server error.
 */
router.get('/:id/qr', getQRCode);

/**
 * @swagger
 * /api/instances/{id}/webhook:
 *   patch:
 *     summary: Update webhook URL for an instance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier for the instance.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhook:
 *                 type: string
 *                 description: The webhook URL.
 *                 example: "https://your-webhook-url.com"
 *     responses:
 *       200:
 *         description: Webhook updated successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Instance not found.
 *       500:
 *         description: Internal server error.
 */
router.patch('/:id/webhook', updateWebhook);

/**
 * @swagger
 * /api/instances/{id}/disconnect:
 *   post:
 *     summary: Disconnect an instance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier for the instance.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instance disconnected successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Instance not found.
 *       500:
 *         description: Internal server error.
 */
router.post('/:id/disconnect', disconnectInstance);

module.exports = router;
