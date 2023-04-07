import { generateObjectSchema } from '../schema';

import { Document } from 'mongoose';

export interface IFeedPost extends Document {
  id:string;
  date?:Date;
  username?:string;
  userid?:string;
  text?:string;
  userpic?:string;
  photo?:string;
}

export const schema = generateObjectSchema<IFeedPost>('FeedPost', {
  id: { type: String, required: true },
  date:   { type: Date, required: false },
  username: { type: String, required: false },
  userid: { type: String, required: false },
  text: { type: String, required: false },
  userpic: { type: String, required: false },
  photo: { type: String, required: false },
});

export default schema;
