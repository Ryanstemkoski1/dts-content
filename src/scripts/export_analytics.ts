// Export content for analytics

try {
  require('dotenv').config();
} catch (err) {}

import * as uuid from 'uuid';

import model from '../models';

import logger from '../services/logger';


async function init() {
  await model.connect();

  logger.level = 'error';
}

async function runMenu() {
  await model.analytics.exportMenu({
    time: new Date().toISOString(),
    execution: `test_${uuid.v4()}`,
  }, model.db, model.location);
}

init()
.then(() => runMenu())
.catch(console.error)
.then(() => process.exit(0));
