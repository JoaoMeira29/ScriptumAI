const db = require('../config/database');

class DeviceTokenRepository {
  async register({ userId, fcmToken, deviceInfo = null }) {
    const query = `
      INSERT INTO user_device_tokens (user_id, fcm_token, device_info)
      VALUES ($1, $2, $3)
      ON CONFLICT (fcm_token) DO UPDATE
        SET user_id = $1, device_info = $3, is_active = true, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [userId, fcmToken, deviceInfo]);
    return result.rows[0];
  }

  async getActiveTokensByUserId(userId) {
    const query = `
      SELECT * FROM user_device_tokens
      WHERE user_id = $1 AND is_active = true
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  async deactivateByTokenId(tokenId, userId) {
    const query = `
      UPDATE user_device_tokens
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [tokenId, userId]);
    return result.rows[0] || null;
  }

  async deactivateTokens(ids) {
    if (!ids.length) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    await db.query(
      `UPDATE user_device_tokens SET is_active = false WHERE id IN (${placeholders})`,
      ids,
    );
  }
}

module.exports = new DeviceTokenRepository();
