const notificationLogRepository = require('../repositories/notificationLogRepository');
const notificationRepository = require('../repositories/notificationRepository');
const fcmService = require('../services/fcmService');

class LogController {
  async getLogs(req, res) {
    try {
      const { eventType, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const parsedLimit = Math.min(parseInt(limit) || 50, 100);
      const parsedOffset = parseInt(offset) || 0;

      const filters = { userId: req.userId };
      if (eventType) filters.eventType = eventType;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const [logs, total] = await Promise.all([
        notificationLogRepository.findAll(filters, parsedLimit, parsedOffset),
        notificationLogRepository.count(filters)
      ]);

      console.log(`Logs retrieved: ${logs.length}/${total}`);

      return res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            limit: parsedLimit,
            offset: parsedOffset,
            total,
            totalPages: Math.ceil(total / parsedLimit)
          },
          filters
        }
      });
    } catch (error) {
      console.error('Error in getLogs:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve logs',
        error: error.message
      });
    }
  }

  async markAllRead(req, res) {
    try {
      await notificationLogRepository.markAllReadByUserId(req.userId);
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
    }
  }

  async markOneRead(req, res) {
    try {
      const updated = await notificationLogRepository.markReadByIdAndUserId(req.params.id, req.userId);
      if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
    }
  }

  async deleteLog(req, res) {
    try {
      const deleted = await notificationLogRepository.deleteByIdAndUserId(req.params.id, req.userId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
      return res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete', error: error.message });
    }
  }

  async clearAll(req, res) {
    try {
      await notificationLogRepository.deleteAllByUserId(req.userId);
      return res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to clear', error: error.message });
    }
  }

  async submitContact(req, res) {
    try {
      const { firstName, lastName, email, subject, message } = req.body;
      if (!firstName || !email || !message) {
        return res.status(400).json({ success: false, message: 'firstName, email and message are required' });
      }

      const notification = await notificationRepository.create({
        userId: req.userId,
        organizationId: req.organizationId || null,
        recipientEmail: email,
        subject: `Contact Form: ${subject || 'General Enquiry'}`,
        bodyText: message,
        channel: 'EMAIL',
        status: 'SENT',
      });

      await notificationLogRepository.create({
        notificationId: notification.id,
        eventType: 'contact.submitted',
        eventData: { firstName, lastName, subject, message },
      });

      fcmService.sendToUser(req.userId, {
        title: 'Contact form sent',
        body: subject || 'Your message was sent to support',
        data: { eventType: 'contact.submitted' },
      }).catch(() => {});

      return res.status(201).json({ success: true, message: 'Contact form submitted' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to submit', error: error.message });
    }
  }

  async getLogsByNotificationId(req, res) {
    try {
      const { id } = req.params;

      const logs = await notificationLogRepository.findByNotificationId(id);

      console.log(`Notification logs retrieved: ${logs.length}`);

      return res.status(200).json({
        success: true,
        data: {
          notificationId: id,
          logs
        }
      });
    } catch (error) {
      console.error('Error in getLogsByNotificationId:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification logs',
        error: error.message
      });
    }
  }
}

module.exports = new LogController();
