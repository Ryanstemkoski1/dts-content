import logger from './services/logger';

import server from './server';

process.on('uncaughtException', (error) => {
  console.error('Fatal error.', error);
  logger.fatal({ error }, 'Fatal error.');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled error.');
  throw error;
});

server.start()
.then((srv) => {
  logger.info(`Server listening at ${srv.info.uri}`);

  process.on('SIGINT', () => {
    server.stop()
      .catch(error => logger.fatal({ error }, 'Unable to stop server.'))
      .then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    server.stop()
      .catch(error => logger.fatal({ error }, 'Unable to stop server.'))
      .then(() => process.exit(0));
  });
})
.catch((error) => {
  logger.fatal({ error }, 'Unable to start server.');
  process.exit(1);
});
