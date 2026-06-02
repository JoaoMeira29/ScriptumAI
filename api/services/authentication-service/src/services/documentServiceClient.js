const DEFAULT_BASE_URL =
  process.env.DOC_SERVICE_URL || 'http://document-service:3000';

class DocumentServiceClient {
  static async getChatUsage(authorizationHeader) {
    if (!authorizationHeader) {
      return null;
    }

    const response = await fetch(`${DEFAULT_BASE_URL}/documents/chat/usage`, {
      method: 'GET',
      headers: {
        Authorization: authorizationHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseBody = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        responseBody?.message ||
        `Document usage lookup failed with status ${response.status}`;
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

module.exports = DocumentServiceClient;