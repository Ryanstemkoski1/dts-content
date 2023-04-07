// Get a list of media files for a location

try {
  require('dotenv').config();
} catch (err) {}

import { IMedia } from '../models/mongodb/media';

import * as fs from 'fs';
import * as moment from 'moment';
import { MongoClient } from 'mongodb';

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

async function run(location:string) {
  const db = client.db('snap');
  const collection = db.collection('media');
  const cursor = collection.find({ location });

  const ids = [] as IMedia[];

  for await (const doc of cursor) {
    const entity = doc as IMedia;
    ids.push(entity);
  }

  const text = `"Name","MIME","Created","URL"\n` + ids.map((item) => {
    return `"${item.name?.replace(',', ' ') || ''}","${item.mime || ''}",` +
      `"${moment(item.created).utc().format()}","http://cdn.signjet.com/media/${item._id.toString()}"`;
  }).join('\n');

  fs.writeFileSync('output.csv', text);
}

init()
.then(() => run('845ebf02-b24e-4158-9c5c-64d67da5e085'))
.catch(console.error)
.then(async () => {
  if (client) {
    await client.close();
  }

  process.exit(0);
});
