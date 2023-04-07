import models from '../models';

import logger from '../services/logger';

import { GraphQLServer } from './graphql';
import { WebServer } from './web';

import { startProcesses, endProcesses } from '../process';
import routes from '../routes';

import * as Hapi from '@hapi/hapi';

class Server {
  public readonly graphql:GraphQLServer;
  public readonly web:WebServer;

  private timer:NodeJS.Timeout;

  constructor() {
    this.web = new WebServer(routes);
    this.graphql = new GraphQLServer(this.web.hapi);
  }

  public async start():Promise<Hapi.Server> {
    try {
      try {
        await models.connect();
      } catch (error) {
        logger.fatal({ error }, 'Unable to start the services.');
        throw error;
      }

      await this.web.init();

      try {
        await this.graphql.start();
      } catch (error) {
        logger.fatal({ error }, 'Unable to start the GraphQL server.');
        throw error;
      }

      try {
        await this.web.start();
      } catch (error) {
        logger.fatal({ error }, 'Unable to start the web server.');
        throw error;
      }

      try {
        await startProcesses();
      } catch (error) {
        logger.fatal({ error }, 'Unable to start the processes.');
        throw error;
      }
    } catch (err) {
      await this.stop();
      throw err;
    }

    this.timer = setInterval(() => {
      logger.debug('Server is running.');
    }, 1000 * 60 * 30);

    return this.web.hapi;
  }

  public async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    try {
      await endProcesses();
    } catch (error) {
      logger.fatal({ error }, 'Unable to stop the processes.');
    }

    try {
      await this.web.stop();
    } catch (error) {
      logger.fatal({ error }, 'Unable to stop the web server.');
    }

    try {
      await this.graphql.stop();
    } catch (error) {
      logger.fatal({ error }, 'Unable to stop the GraphQL server.');
    }

    try {
      await models.disconnect();
    } catch (error) {
      logger.fatal({ error }, 'Unable to stop the services.');
    }
  }
}

export default new Server();
