const rabbitMQClient = require('../config/rabbitmq');
const handleInviteCreated = require('../handlers/inviteCreatedHandler');
const handleInviteAccepted = require('../handlers/inviteAcceptedHandler');
const handleUserCreated = require('../handlers/userCreatedHandler');
const handleDocumentUploaded = require('../handlers/documentUploadedHandler');
const handleDocumentAiCompleted = require('../handlers/documentAiCompletedHandler');
const handleTrialExpired = require('../handlers/trialExpiredHandler');
const handleOrgSuspended = require('../handlers/orgSuspendedHandler');

class EventConsumer {
  async start() {
    try {
      console.log('Starting event consumer...');

      await rabbitMQClient.connect();

      await this.subscribeToEvents();

      console.log('Event consumer started successfully');
    } catch (error) {
      console.error('Failed to start event consumer:', error);
      process.exit(1);
    }
  }

  async subscribeToEvents() {
    const queuePrefix = 'notification-service';

    // 1. Subscribe to invite.created
    await rabbitMQClient.consume(
      `${queuePrefix}.invite.created`,
      'invite.created',
      handleInviteCreated
    );

    // 2. Subscribe to user.created
    await rabbitMQClient.consume(
      `${queuePrefix}.user.created`,
      'user.created',
      handleUserCreated
    );

    // 3. Subscribe to document.uploaded
    await rabbitMQClient.consume(
      `${queuePrefix}.document.uploaded`,
      'document.uploaded',
      handleDocumentUploaded
    );
    // 4. Subscribe to document.ai.completed
    await rabbitMQClient.consume(
      `${queuePrefix}.document.ai.completed`,
      'document.ai.completed',
      handleDocumentAiCompleted
    );

    // 5. Subscribe to trial.expired
    await rabbitMQClient.consume(
      `${queuePrefix}.trial.expired`,
      'trial.expired',
      handleTrialExpired
    );

    // 6. Subscribe to invite.accepted
    await rabbitMQClient.consume(
      `${queuePrefix}.invite.accepted`,
      'invite.accepted',
      handleInviteAccepted
    );

    // 7. Subscribe to org.suspended
    await rabbitMQClient.consume(
      `${queuePrefix}.org.suspended`,
      'org.suspended',
      handleOrgSuspended
    );

    console.log('Subscribed to all events');
  }
}

module.exports = new EventConsumer();
