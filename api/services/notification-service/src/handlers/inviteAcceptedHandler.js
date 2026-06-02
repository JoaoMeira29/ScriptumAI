const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Handle invite.accepted event from organization-service
 * Payload:
 * {
 *   inviteeEmail: 'user@example.com',
 *   organizationId: 'org-uuid',
 *   organizationName: 'Acme',
 *   adminEmail: 'admin@acme.com',
 *   role: 'USER',
 *   acceptedAt: '2026-05-23T...'
 * }
 */
async function handleInviteAccepted(payload) {
  try {
    const { inviteeEmail, organizationId, organizationName, adminEmail, role, acceptedAt } = payload;

    if (!adminEmail || !organizationId) {
      throw new Error('Missing required fields: adminEmail and organizationId are required');
    }

    const roleLabel = role === 'ADMIN' ? 'Administrador' : 'Utilizador';
    const date = acceptedAt
      ? new Date(acceptedAt).toLocaleDateString('pt-PT')
      : new Date().toLocaleDateString('pt-PT');

    await emailService.sendEmailWithTemplate({
      userId: null,
      organizationId,
      templateName: 'invite_accepted',
      recipientEmail: adminEmail,
      templateVariables: { inviteeEmail, organizationName, roleLabel, date },
      sourceService: 'organization-service',
      eventType: 'invite.accepted',
    });

    logger.info('invite.accepted email sent', { organizationId, recipient: adminEmail });
  } catch (error) {
    logger.error('Error handling invite.accepted event', { error: error.message, payload });
    throw error;
  }
}

module.exports = handleInviteAccepted;
