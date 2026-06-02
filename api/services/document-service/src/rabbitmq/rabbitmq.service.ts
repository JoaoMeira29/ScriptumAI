import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly rabbitmqUrl: string;
  private readonly exchange = 'scriptumai.events';
  private isConnected = false;

  constructor() {
    this.rabbitmqUrl =
      process.env.RABBITMQ_URL || 'amqp://rabbitmq:rabbitmq@localhost:5672';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.logger.log('Connecting to RabbitMQ...');

      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      this.isConnected = true;
      this.logger.log('✅ Connected to RabbitMQ');

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.connection.on('error', (err: any) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isConnected = false;
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  async publish(routingKey: string, message: any): Promise<boolean> {
    try {
      if (!this.channel || !this.isConnected) {
        this.logger.warn('RabbitMQ not connected, attempting to reconnect...');
        await this.connect();
      }

      if (!this.channel) {
        throw new Error('Channel not available');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        this.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );

      if (published) {
        this.logger.log(`📤 Published event: ${routingKey}`);
      }

      return published;
    } catch (error) {
      this.logger.error(`Failed to publish event: ${routingKey}`, error);
      throw error;
    }
  }

  async consume(
    queue: string,
    routingKey: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('Channel not available');
      }

      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, this.exchange, routingKey);
      await this.channel.prefetch(1);

      this.logger.log(
        `🎧 Listening to queue: ${queue} (routing: ${routingKey})`,
      );

      await this.channel.consume(
        queue,
        async (msg: any) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              this.logger.log(`📥 Received message from ${queue}`);

              await callback(content);

              this.channel.ack(msg);
              this.logger.log(`✅ Message acknowledged`);
            } catch (error) {
              this.logger.error(
                `Error processing message from ${queue}`,
                error,
              );
              this.channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );
    } catch (error) {
      this.logger.error(`Failed to consume from ${queue}`, error);
      throw error;
    }
  }
}
