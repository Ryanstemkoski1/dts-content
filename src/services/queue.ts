import backend from './backend';
import logger from './logger';

import { Consumer } from 'sqs-consumer';

export type QueueHandler<T = any> = (event:T) => Promise<void>;

export class QueueWatcher<T = any> {
  private readonly app:Consumer;
  private handlers:QueueHandler<T>[] = [];

  constructor(private readonly queue:string, batchSize:number = 10) {
    this.app = Consumer.create({
      batchSize,
      sqs: backend.aws.notrace.sqs as any,
      queueUrl: backend.aws.getQueueUrl(queue),
      handleMessageBatch: batchSize > 1 ? async (messages) => {
        const tasks = messages.map(async (message) => {
          const payload = JSON.parse(message.Body);

          const tasks = this.handlers.map((handler) => {
            return handler(payload);
          });

          return await Promise.all(tasks);
        });

        await Promise.allSettled(tasks);
      } : undefined,
      handleMessage: batchSize === 1 ? async (message) => {
        const payload = JSON.parse(message.Body);

        const tasks = this.handlers.map((handler) => {
          return handler(payload);
        });

        await Promise.all(tasks);
      } : undefined,
    });

    this.app.on('error', (error) => {
      logger.error({ error }, `Queue ${this.queue} error.`);
    });

    this.app.on('processing_error', (error) => {
      logger.warn({ error }, `Queue ${this.queue} processing error.`);
    });

    this.app.on('timeout_error', (error) => {
      logger.error({ error }, `Queue ${this.queue} timeout error.`);
    });

    this.app.start();
  }

  handle(handler:QueueHandler<T>):void {
    this.handlers.push(handler);
  }

  dispose():void {
    this.handlers = [];

    this.app.stop();
    this.app.removeAllListeners();
  }
}

export const watchQueue = <T = any>(queue:string, batchSize:number = 10):QueueWatcher<T> => {
  return new QueueWatcher(queue, batchSize);
};
