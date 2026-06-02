const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Handle trial.expired event from organization-service
 * Payload example:
 * {
 *   organization_id: 'org-uuid',
 *   organization_name: 'Acme',
 *   owner_email: 'owner@acme.com',
 *   trial_ended_at: '2026-03-29T00:00:00.000Z'
 * }
 */
async function handleTrialExpired(payload) {
  try {
    const { organization_id, organization_name, owner_email, trial_ended_at } = payload;

    if (!organization_id || !owner_email || !trial_ended_at) {
      throw new Error(
        'Missing required fields: organization_id, owner_email and trial_ended_at are required',
      );
    }

    const trialEndedDate = new Date(trial_ended_at);
    const displayDate = Number.isNaN(trialEndedDate.getTime())
      ? trial_ended_at
      : trialEndedDate.toLocaleDateString('pt-PT');

    await emailService.sendEmailWithTemplate({
      userId: null,
      organizationId: organization_id,
      templateName: 'trial_expired',
      recipientEmail: owner_email,
      templateVariables: { organizationName: organization_name, displayDate },
      sourceService: 'organization-service',
      eventType: 'trial.expired',
    });

    logger.info('trial.expired email sent', {
      organizationId: organization_id,
      recipient: owner_email,
    });
  } catch (error) {
    logger.error('Error handling trial.expired event', {
      error: error.message,
      payload,
    });
    throw error;
  }
}

module.exports = handleTrialExpired;
