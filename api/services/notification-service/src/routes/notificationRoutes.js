
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const logController = require('../controllers/logController');
const deviceController = require('../controllers/deviceController');

// Importar AMBOS os middlewares
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  validateSendNotification,
  validateGetLogs,
  sanitizeInputs
} = require('../middleware/validationMiddleware');

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Enviar notificação por email
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail]
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               subject:
 *                 type: string
 *                 example: Welcome!
 *               bodyHtml:
 *                 type: string
 *                 example: <h1>Hello!</h1>
 *               templateName:
 *                 type: string
 *                 enum: [welcome, invite]
 *               templateVariables:
 *                 type: object
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       400:
 *         description: Validation failed
 */
router.post(
  '/send',
  authenticateToken,        // 1º: Valida JWT e extrai userId
  sanitizeInputs,           // 2º: Sanitiza HTML (XSS protection)
  validateSendNotification, // 3º: Valida campos
  notificationController.sendNotification
);

/**
 * @swagger
 * /notifications/logs:
 *   get:
 *     summary: Consultar logs de notificações
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SENT, FAILED]
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/logs',
  authenticateToken,  //  Valida JWT
  validateGetLogs,    //  Valida query params
  logController.getLogs
);

/**
 * @swagger
 * /notifications/logs/read-all:
 *   patch:
 *     summary: Mark all notification logs as read
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All logs marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch('/logs/read-all', authenticateToken, logController.markAllRead);

/**
 * @swagger
 * /notifications/logs/{id}/read:
 *   patch:
 *     summary: Mark a single notification log as read
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Log marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log not found
 */
router.patch('/logs/:id/read', authenticateToken, logController.markOneRead);

/**
 * @swagger
 * /notifications/logs:
 *   delete:
 *     summary: Clear all notification logs
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All logs cleared
 *       401:
 *         description: Unauthorized
 */
router.delete('/logs', authenticateToken, logController.clearAll);

/**
 * @swagger
 * /notifications/logs/{id}:
 *   delete:
 *     summary: Delete a single notification log
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Log deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Log not found
 */
router.delete('/logs/:id', authenticateToken, logController.deleteLog);

/**
 * @swagger
 * /notifications/contact:
 *   post:
 *     summary: Submit a contact/support message
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact message sent
 *       401:
 *         description: Unauthorized
 */
router.post('/contact', authenticateToken, logController.submitContact);

/**
 * @swagger
 * /notifications/devices/register:
 *   post:
 *     summary: Register a device for push notifications
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token
 *               platform:
 *                 type: string
 *                 enum: [android, ios, web]
 *     responses:
 *       200:
 *         description: Device registered
 *       401:
 *         description: Unauthorized
 */
router.post('/devices/register', authenticateToken, deviceController.register);

/**
 * @swagger
 * /notifications/devices/{id}:
 *   delete:
 *     summary: Unregister a device from push notifications
 *     tags: [Devices]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device unregistered
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device not found
 */
router.delete('/devices/:id', authenticateToken, deviceController.unregister);

module.exports = router;