// Send feed update events

try {
  require('dotenv').config();
} catch (err) {}

import backend from '../services/backend';

import * as Bluebird from 'bluebird';
import { MongoClient } from 'mongodb';
import { EEntityType } from '../domain/service';

const CONCURRENCY = 10;

let client:MongoClient;

async function init() {
  client = await new Promise((resolve, reject) => {
    MongoClient.connect(process.env.MONGODB, (error, cl) => {
      if (error) {
        return reject(error);
      }

      console.log('Connected successfully to server');

      resolve(cl);
    });
  });
}

async function notify() {
  const db = client.db('snap');
  const collection = db.collection('feeds');
  const cursor = collection.find({ source: { $exists: true } }, { limit: 99999 });

  const tasks = [];

  for await (const doc of cursor) {
    tasks.push(async () => {
      await backend.entity.updated(EEntityType.Feed, {
        token: doc._id.toString(),
        location: doc.location,
      });
    });
  }

  console.log(`Sending ${tasks.length} events...`);

  await Bluebird.map(
    tasks,
    (t) => {
      process.stdout.write('.');
      

      return t();
    },
    { concurrency: CONCURRENCY },
  );

  console.log('Done');
}

init()
.then(() => notify())
.catch(console.error)
.then(async () => {
  if (client) {
    await client.close();
  }

  process.exit(0);
});
