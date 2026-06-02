const DEFAULT_BASE_URL = process.env.ORG_SERVICE_URL || "http://organization-service:3000/api";

class OrganizationServiceClient {
  static async createTrialOnboarding({ organizationName, ownerUserId, ownerEmail, city, address, contact, zipCode }) {
    const response = await fetch(`${DEFAULT_BASE_URL}/organizations/onboarding-trial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationName,
        ownerUserId,
        ownerEmail,
        ...(city && { city }),
        ...(address && { address }),
        ...(contact != null && { contact }),
        ...(zipCode && { zipCode }),
      }),
    });

    const responseBody = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        responseBody?.message ||
        `Organization onboarding failed with status ${response.status}`;
      throw this.createHttpError(message, response.status);
    }

    return responseBody;
  }

  static async getOrganizationStatus(organizationId) {
    const response = await fetch(
      `${DEFAULT_BASE_URL}/organizations/${organizationId}/status`,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    const responseBody = await this.parseJsonResponse(response);
    if (!response.ok) {
      throw this.createHttpError(responseBody?.message || `Org status check failed with status ${response.status}`, response.status);
    }
    return responseBody;
  }

  static async getSubscriptionStatus(organizationId) {
    const response = await fetch(
      `${DEFAULT_BASE_URL}/organizations/${organizationId}/subscription-status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const responseBody = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        responseBody?.message ||
        `Subscription check failed with status ${response.status}`;
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

module.exports = OrganizationServiceClient;
