const amqp = require('amqplib');

class RabbitMQPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = process.env.RABBITMQ_EXCHANGE || 'scriptumai.events';
  }

  async connect() {
    try {
      const user = process.env.RABBITMQ_USER || 'rabbitmq';
      const password = process.env.RABBITMQ_PASSWORD || 'rabbitmq';
      const host = process.env.RABBITMQ_HOST || 'rabbitmq';
      const port = process.env.RABBITMQ_PORT || '5672';

      const url = `amqp://${user}:${password}@${host}:${port}`;

      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      console.log('Auth Service connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message);
      throw error;
    }
  }

  async publish(routingKey, message) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now()
      });

      console.log(`Event published: ${routingKey}`, message);
    } catch (error) {
      console.error('Failed to publish event:', error.message);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error.message);
    }
  }
}

module.exports = new RabbitMQPublisher();