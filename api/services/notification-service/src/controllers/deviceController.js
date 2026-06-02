const deviceTokenRepository = require('../repositories/deviceTokenRepository');
const logger = require('../utils/logger');

const deviceController = {
  async register(req, res) {
    try {
      const { fcmToken, deviceInfo } = req.body;
      const userId = req.userId;

      if (!fcmToken) {
        return res.status(400).json({ error: 'fcmToken is required' });
      }

      const token = await deviceTokenRepository.register({ userId, fcmToken, deviceInfo });

      logger.info('Device token registered', { userId, tokenId: token.id });
      return res.status(201).json({ id: token.id, message: 'Device registered' });
    } catch (err) {
      logger.error('Error registering device token', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async unregister(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const token = await deviceTokenRepository.deactivateByTokenId(id, userId);

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      logger.info('Device token unregistered', { userId, tokenId: id });
      return res.status(200).json({ message: 'Device unregistered' });
    } catch (err) {
      logger.error('Error unregistering device token', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = deviceController;
