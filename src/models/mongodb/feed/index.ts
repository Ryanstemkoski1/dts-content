import * as URI from 'urijs';

import Blacklist, { IFeedBlacklist } from './blacklist';
import Post, { IFeedPost } from './post';

import { EEntityType } from '../../../domain/service';

import {
  IDocument,
  enumField,
  generateDocumentSchema,
  generateObjectSchema,
} from '../schema';
import { Document } from 'mongoose';

export { IFeedBlacklist, schema as blacklistSchema } from './blacklist';
export { IFeedPost, schema as postSchema } from './post';

export enum EFeedSource {
  Austinbus = 'austinbus',
  Calendar = 'calendar',
  Facebook = 'facebook',
  Instagram = 'instagram',
  Twitter = 'twitter',
  URL = 'url',
  Weather = 'weather',
}

export enum EFacebookSource {
  ProfilePhotos = 'profile_photos',
}

export enum EInstagramSource {
  ProfilePhotos = 'profile_photos',
}

export enum ETwitterSource {
  Hashtag = 'hashtag',
  Username = 'username',
}

export enum EWeatherSource {
  City = 'city',
  Coordinates = 'coordinates',
}

export interface IFeed extends IDocument {
  title:string;
  source:EFeedSource;
  calendar?:{
    type:ECalendarType;
    google?:{
      id:string;
      name:string;
      writable:boolean;
    };
  };
  facebook?:{
    mode:EFeedMode;
    source:EFacebookSource;
  };
  instagram?:{
    mode:EFeedMode;
    source:EInstagramSource;
  };
  twitter?:{
    mode:EFeedMode;
    source:ETwitterSource;
    hashtag?:string;
    username?:string;
  };
  url?:{
    link:string;
    authentication?:{
      header:string;
      value:string;
    };
  };
  weather?:{
    source:EWeatherSource;
    city?:string;
    lat?:number;
    lng?:number;
  };
  posts?:IFeedPost[];
  blacklist?:IFeedBlacklist;
}

export interface IFeedUpdate extends Document {
  title:string;
  blacklist?:IFeedBlacklist;
}

export enum EFeedMode {
  Whitelist = 'whitelist',
  Auto = 'auto',
}

export enum ECalendarType {
  Google = 'google',
}

const schemaCalendarGoogle = generateObjectSchema('FeedCalendarGoogle', {
  id: { type: String, required: true, description: 'Google calendar ID.' },
  name: { type: String, trim: true, required: true, description: 'Google calendar name.' },
  writable: { type: Boolean, required: true, description: 'Calendar is writable.' },
});

const schemaCalendar = generateObjectSchema('FeedCalendar', {
  type: enumField(ECalendarType),
  google: { type: schemaCalendarGoogle, description: 'Google calendar data.' },
});

const schemaFacebook = generateObjectSchema('FeedFacebook', {
  mode: enumField(EFeedMode),
  source: enumField(EFacebookSource),
  // username: { type: String, description: 'Username.' },
});

const schemaInstagram = generateObjectSchema('FeedInstagram', {
  mode: enumField(EFeedMode),
  source: enumField(EInstagramSource),
  // username: { type: String, required: true, description: 'Username.' },
});

const schemaTwitter = generateObjectSchema('FeedTwitter', {
  mode: enumField(EFeedMode),
  source: enumField(ETwitterSource),
  hashtag:  { type: String, description: 'Hashtag.' },
  username: { type: String, description: 'Username.' },
});

const validateUrl = () => ({
  validator: (v) => {
    if (!v) {
      return false;
    }

    const uri = URI(v);
    const hostname = uri.hostname();

    switch (true) {
      case !uri.is('absolute'):
      case !uri.is('domain'):
      case !uri.is('url'):
      case hostname === 'localhost':
        return false;
    }

    return true;
  },
  message: '{VALUE} is not a valid URL!',
});

const schemaUrl = generateObjectSchema('FeedUrl', {
  link: { type: String, required: true, validate: validateUrl(), description: 'Source URL.' },
  authentication: generateObjectSchema('FeedUrlAuthentication', {
    header: { type: String, required: true, description: 'Authentication header name.' },
    value: { type: String, required: true, description: 'Authentication header value.' },
  }),
});

const schemaWeather = generateObjectSchema('FeedWeather', {
  source: enumField(EWeatherSource),
  city: { type: String, description: 'City name (e.g. "Austin, US").' },
  lat: { type: Number, description: 'Latitude.' },
  lng: { type: Number, description: 'Longitude.' },
});

export const schema = generateDocumentSchema<IFeed>(EEntityType.Feed, {
  title:      { type: String, trim: true, required: true, description: 'Feed title.' },
  source:     enumField(EFeedSource),
  calendar:   { type: schemaCalendar },
  facebook:   { type: schemaFacebook },
  instagram:  { type: schemaInstagram },
  twitter:    { type: schemaTwitter },
  url:        { type: schemaUrl },
  weather:    { type: schemaWeather },
  posts:      { type: [Post], description: 'Approved posts.' },
  blacklist:  { type: Blacklist, description: 'Blacklist settings.' },
}, {
  minimal: [
    'title',
    'source',
  ],
});

export const patchSchema = generateObjectSchema<IFeedUpdate>('FeedPatch', {
  title:      { type: String, trim: true },
  blacklist:  { type: Blacklist },
});

export default schema;
