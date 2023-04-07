// Generate preview for all presentations and templates

try {
  require('dotenv').config();
} catch (err) {}

import model from '../models';
import { IPresentation } from '../models/mongodb/presentation';
import { ITemplate } from '../models/mongodb/template';

import logger from '../services/logger';

import * as Bluebird from 'bluebird';

const CONCURRENCY = 10;

async function init() {
  await model.connect();

  logger.level = 'error';
}

async function runPresentations(location?:string) {
  const presentations = model.db.Presentation
    .find({
      // location,
      // preview: { $exists: !!location },
    })
    .cursor();

  let tasks = [];

  await presentations.eachAsync(async (entity) => {
    const task = async () => {
      const preview = model.presentation.preparePresentationPreview(entity);

      if (preview) {
        await model.presentation.generatePresentationPreview(entity)
          .then(async () => {
            const query = { _id: entity.token };
            const update = { preview } as IPresentation;

            await model.db.Presentation
              .findOneAndUpdate(query, update, { projection: { _id: true } })
              .lean()
              .exec();

            console.log(`Campaign preview updated for ${entity.token.toString()} to ${preview}`);
          })
          .catch((error) => {
            console.error(`Campaign preview error for ${entity.token.toString()}: ${error.message}`);
          });
      }
    };

    tasks.push(task);

    if (tasks.length > CONCURRENCY) {
      await Bluebird.map(tasks, t => t(), { concurrency: CONCURRENCY });
      tasks = [];
    }
  });
}

async function runTemplates(location?:string) {
  const templates = model.db.Template
    .find({
      // location,
      // preview: { $exists: !!location },
    })
    .cursor();

  let tasks = [];

  await templates.eachAsync(async (entity) => {
    const task = async () => {
      const preview = model.presentation.prepareTemplatePreview(entity);

      if (preview) {
        await model.presentation.generateTemplatePreview(entity)
          .then(async () => {
            const query = { _id: entity.token };
            const update = { preview } as ITemplate;

            await model.db.Template
              .findOneAndUpdate(query, update, { projection: { _id: true } })
              .lean()
              .exec();

            console.log(`Template preview updated for ${entity.token.toString()} to ${preview}`);
          })
          .catch((error) => {
            console.error(`Template preview error for ${entity.token.toString()}: ${error.message}`);
          });
      }
    };

    tasks.push(task);

    if (tasks.length > CONCURRENCY) {
      await Bluebird.map(tasks, t => t(), { concurrency: CONCURRENCY });
      tasks = [];
    }
  });
}

init()
.then(() => runPresentations())
.then(() => runTemplates())
.catch(console.error)
.then(() => process.exit(0));
