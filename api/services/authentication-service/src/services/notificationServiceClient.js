const jwt = require("jsonwebtoken");

const DEFAULT_BASE_URL =
  process.env.NOTIFICATION_SERVICE_URL ||
  "http://notification-service:3000/api/notifications/send";

class NotificationServiceClient {
  static generateServiceToken() {
    const secret =
      process.env.JWT_SECRET ||
      process.env.SECRET_TOKEN ||
      "super-secret-key-shared-by-everyone";

    return jwt.sign(
      {
        id: "auth-service",
        email: "noreply@scriptumai.local",
        role: "service",
        organizationId: null,
      },
      secret,
      { expiresIn: "15m" }
    );
  }

  static async sendPasswordResetEmail({
    userId,
    organizationId,
    recipientEmail,
    recipientName,
    resetUrl,
  }) {
    const token = this.generateServiceToken();

    const response = await fetch(DEFAULT_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        organizationId,
        recipientEmail,
        subject: "Recuperacao de password - ScriptumAI",
        bodyHtml: `
          <p>Ola ${recipientName || ""},</p>
          <p>Recebemos um pedido para redefinir a tua password.</p>
          <p><a href="${resetUrl}">Clique aqui para redefinir a password</a></p>
          <p>Se nao foste tu, ignora este email.</p>
        `.trim(),
        bodyText: `Recebemos um pedido para redefinir a tua password. Usa este link: ${resetUrl}`,
      }),
    });

    const responseBody = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        responseBody?.message ||
        `Notification service request failed with status ${response.status}`;
      throw this.createHttpError(message, response.status);
    }

    return responseBody;
  }

  static createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  static async parseJsonResponse(response) {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (_error) {
      return { message: text };
    }
  }
}

module.exports = NotificationServiceClient;