const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Handle org.suspended event from organization-service
 * Payload:
 * {
 *   organizationId: 'org-uuid',
 *   organizationName: 'Acme',
 *   adminEmail: 'admin@acme.com',
 * }
 */
async function handleOrgSuspended(payload) {
  try {
    const { organizationId, organizationName, adminEmail } = payload;

    if (!adminEmail || !organizationId) {
      throw new Error('Missing required fields: adminEmail and organizationId are required');
    }

    await emailService.sendEmailWithTemplate({
      userId: null,
      organizationId,
      templateName: 'org_suspended',
      recipientEmail: adminEmail,
      templateVariables: { organizationName },
      sourceService: 'organization-service',
      eventType: 'org.suspended',
    });

    logger.info('org.suspended email sent', { organizationId, recipient: adminEmail });
  } catch (error) {
    logger.error('Error handling org.suspended event', { error: error.message, payload });
    throw error;
  }
}

module.exports = handleOrgSuspended;
