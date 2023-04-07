import config from '../../config';

import { IAnalyticsEvent } from '../../domain/analytics';

import models from '../../models';

import backend from '../../services/backend';
import { QueueWatcher } from '../../services/queue';
import logger from '../../services/logger';

import { IProcess } from '../base';

export class AnalyticsProcess implements IProcess {
  private watcher:QueueWatcher<IAnalyticsEvent>;

  async start() {
    this.watcher = new QueueWatcher<IAnalyticsEvent>(config.sqs.export_task);
    this.watcher.handle(async (event) => {
      const task = event.task;

      logger.debug({ task }, 'Analytics export has started.');

      try {
        logger.debug('Exporting menu data...');

        await models.analytics.exportMenu(task, models.db, models.location);

        const result = {};

        await backend.aws.step.sendTaskSuccess({
          taskToken: event.callback,
          output: JSON.stringify(result),
        }).promise();

        logger.debug({ task }, 'Analytics export is complete.');
      } catch (error) {
        await backend.aws.step.sendTaskFailure({
          taskToken: event.callback,
          error: 'WorkerError.Error',
          cause: error.message,
        }).promise();

        logger.error({ error, task }, 'Analytics export has failed.');
      }
    });
  }

  async end() {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
  }
}
