// Generate preview for all presentations and templates

try {
  require('dotenv').config();
} catch (err) {}

import model from '../models';
import { IPresentation } from '../models/mongodb/presentation';
import { ITemplate } from '../models/mongodb/template';

import * as Bluebird from 'bluebird';

const CONCURRENCY = 30;

async function init() {
  await model.connect();
}

async function runPresentationsCreated() {
  const presentations = model.db.Presentation
    .find({
      $or: [
        { created: { $exists: false } },
        { created: null },
      ],
    })
    .cursor();

  let tasks = [];

  await presentations.eachAsync(async (entity) => {
    const task = async () => {
      const query = { _id: entity.token };
      const update = { created: new Date() } as IPresentation;

      await model.db.Presentation
        .findOneAndUpdate(query, update, { projection: { _id: true } })
        .lean()
        .exec();

      console.log(`Updated ${entity.token}`);
    };

    tasks.push(task);

    if (tasks.length > CONCURRENCY) {
      await Bluebird.map(tasks, t => t(), { concurrency: CONCURRENCY });
      tasks = [];
    }
  });
}

async function runTemplatesCreated() {
  const presentations = model.db.Template
    .find({
      $or: [
        { created: { $exists: false } },
        { created: null },
      ],
    })
    .cursor();

  let tasks = [];

  await presentations.eachAsync(async (entity) => {
    const task = async () => {
      const query = { _id: entity.token };
      const update = { created: new Date() } as ITemplate;

      await model.db.Template
        .findOneAndUpdate(query, update, { projection: { _id: true } })
        .lean()
        .exec();

      console.log(`Updated ${entity.token}`);
    };

    tasks.push(task);

    if (tasks.length > CONCURRENCY) {
      await Bluebird.map(tasks, t => t(), { concurrency: CONCURRENCY });
      tasks = [];
    }
  });
}

init()
.then(() => runPresentationsCreated())
.then(() => runTemplatesCreated())
.catch(console.error)
.then(() => process.exit(0));
