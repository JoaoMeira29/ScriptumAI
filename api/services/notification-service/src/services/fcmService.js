const { admin, initializeFirebase } = require('../config/firebase');
const deviceTokenRepository = require('../repositories/deviceTokenRepository');
const logger = require('../utils/logger');

class FcmService {
  constructor() {
    initializeFirebase();
  }

  async sendToUser(userId, { title, body, data = {} }) {
    const tokens = await deviceTokenRepository.getActiveTokensByUserId(userId);

    if (!tokens.length) {
      logger.info('No active FCM tokens for user', { userId });
      return { sent: 0, failed: 0 };
    }

    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens: tokens.map((t) => t.fcm_token),
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const failedTokens = [];
    response.responses.forEach((res, i) => {
      if (!res.success) {
        logger.warn('FCM send failed for token', {
          token: tokens[i].fcm_token,
          error: res.error?.message,
        });
        if (
          res.error?.code === 'messaging/registration-token-not-registered' ||
          res.error?.code === 'messaging/invalid-registration-token'
        ) {
          failedTokens.push(tokens[i].id);
        }
      }
    });

    if (failedTokens.length) {
      await deviceTokenRepository.deactivateTokens(failedTokens);
    }

    logger.info('FCM multicast result', {
      userId,
      sent: response.successCount,
      failed: response.failureCount,
    });

    return { sent: response.successCount, failed: response.failureCount };
  }
}

module.exports = new FcmService();
