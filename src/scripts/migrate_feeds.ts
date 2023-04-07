// Migrate all feeds to the new format

try {
  require('dotenv').config();
} catch (err) {}

import {
  EFacebookSource,
  EFeedMode,
  EFeedSource,
  EInstagramSource,
  ETwitterSource,
  EWeatherSource,
  IFeed,
  IFeedPost,
  schema,
} from '../models/mongodb/feed';

import * as utils from '../routes/utils';

import { MongoClient } from 'mongodb';

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

async function run() {
  const model = utils.documentModel(schema, {
    operation: 'read',
  });

  const db = client.db('snap');
  const collection = db.collection('feeds');
  const cursor = collection.find({ source: { $exists: false } });

  for await (const doc of cursor) {
    const update = {
      created: new Date(),
      source: doc.subscription?.source,
    } as IFeed;

    switch (update.source) {
      case EFeedSource.Austinbus:
        break;
      case EFeedSource.Facebook:
        update.facebook = {
          mode: doc.mode || EFeedMode.Auto,
          source: EFacebookSource.ProfilePhotos,
        };
        break;
      case EFeedSource.Instagram:
        update.instagram = {
          mode: doc.mode || EFeedMode.Auto,
          source: EInstagramSource.ProfilePhotos,
        };
        break;
      case EFeedSource.Twitter:
        update.twitter = {
          mode: doc.mode || EFeedMode.Auto,
          source: doc.subscription.type || ETwitterSource.Hashtag,
          hashtag: doc.subscription.type === ETwitterSource.Hashtag
            ? doc.subscription.name
            : undefined,
          username: doc.subscription.type === ETwitterSource.Username
            ? doc.subscription.name
            : undefined,
        };
        break;
      case EFeedSource.URL:
        update.url = {
          link: doc.subscription.url.link,
        };
        break;
      case EFeedSource.Weather:
        update.weather = {
          source: doc.subscription.type === 'city'
            ? EWeatherSource.City
            : EWeatherSource.Coordinates,
          city: doc.subscription.type === 'city'
            ? doc.subscription.name
            : undefined,
          lat: doc.subscription.type !== 'city'
            ? doc.subscription.weather?.lat
            : undefined,
          lng: doc.subscription.type !== 'city'
            ? doc.subscription.weather?.lng
            : undefined,
        };
        break;
      default:
        console.log(`Invalid source: ${doc._id.toString()}`, doc);
        continue;
    }

    switch (doc.subscription.source) {
      case EFeedSource.Facebook:
      case EFeedSource.Instagram:
      case EFeedSource.Twitter:
        update.posts = (doc.items as any[] || []).map(x => ({
          id: x['id'],
          date: x['date'],
          username: x['username'],
          userid: x['userid'],
          text: x['text'],
          userpic: x['userpic'],
          photo: x['photo'],
        } as IFeedPost)).filter(x => x.id);
        break;
    }

    const payload = {
      token: doc._id.toString(),
      ...JSON.parse(JSON.stringify(doc)),
      ...JSON.parse(JSON.stringify(update)),
    };

    const validation = model.validate(payload, { stripUnknown: true });

    if (validation.error) {
      console.error(validation.error);
    } else {
      await collection.updateOne({
        _id: doc._id,
      }, {
        $set: update,
      });

      console.log(`Updated ${doc._id.toString()}`);
    }
  }
}

init()
.then(() => run())
.catch(console.error)
.then(async () => {
  if (client) {
    await client.close();
  }

  process.exit(0);
});
