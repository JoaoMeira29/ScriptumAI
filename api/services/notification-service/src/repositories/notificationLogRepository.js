const db = require('../config/database');

class NotificationLogRepository {
  async create(logData) {
    const { notificationId, eventType, eventData = {} } = logData;

    const query = `
      INSERT INTO notification_logs (notification_id, event_type, event_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [notificationId, eventType, JSON.stringify(eventData)]);
    return result.rows[0];
  }

  async findByNotificationId(notificationId) {
    const query = `
      SELECT * FROM notification_logs 
      WHERE notification_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [notificationId]);
    return result.rows;
  }

  async findAll(filters = {}, limit = 50, offset = 0) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`n.user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.eventType) {
      conditions.push(`l.event_type = $${paramIndex++}`);
      values.push(filters.eventType);
    }

    if (filters.startDate) {
      conditions.push(`l.created_at >= $${paramIndex++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`l.created_at <= $${paramIndex++}`);
      values.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);

    const query = `
      SELECT
        l.id, l.notification_id, l.event_type, l.event_data, l.is_read, l.created_at,
        n.user_id, n.subject, n.recipient_email AS recipient
      FROM notification_logs l
      LEFT JOIN notifications n ON l.notification_id = n.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  async markReadByIdAndUserId(logId, userId) {
    const result = await db.query(
      `UPDATE notification_logs l SET is_read = true
       FROM notifications n WHERE l.notification_id = n.id AND l.id = $1 AND n.user_id = $2
       RETURNING l.id`,
      [logId, userId],
    );
    return result.rows[0] || null;
  }

  async markAllReadByUserId(userId) {
    await db.query(
      `UPDATE notification_logs l SET is_read = true
       FROM notifications n WHERE l.notification_id = n.id AND n.user_id = $1`,
      [userId],
    );
  }

  async deleteByIdAndUserId(logId, userId) {
    const result = await db.query(
      `DELETE FROM notification_logs l USING notifications n
       WHERE l.notification_id = n.id AND l.id = $1 AND n.user_id = $2
       RETURNING l.id`,
      [logId, userId],
    );
    return result.rows[0] || null;
  }

  async deleteAllByUserId(userId) {
    await db.query(
      `DELETE FROM notification_logs l USING notifications n
       WHERE l.notification_id = n.id AND n.user_id = $1`,
      [userId],
    );
  }

  async count(filters = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`n.user_id = $${paramIndex++}`);
      values.push(filters.userId);
    }

    if (filters.eventType) {
      conditions.push(`l.event_type = $${paramIndex++}`);
      values.push(filters.eventType);
    }

    if (filters.startDate) {
      conditions.push(`l.created_at >= $${paramIndex++}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`l.created_at <= $${paramIndex++}`);
      values.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT COUNT(*) as total
      FROM notification_logs l
      LEFT JOIN notifications n ON l.notification_id = n.id
      ${whereClause}
    `;

    const result = await db.query(query, values);
    return parseInt(result.rows[0].total);
  }
}

module.exports = new NotificationLogRepository();
