import { generateObjectSchema } from '../schema';

import { Document } from 'mongoose';

export interface IFeedBlacklist extends Document {
  profanity?:boolean;
  posts?:string[];
  users?:string[];
  words?:string[];
}

export const schema = generateObjectSchema<IFeedBlacklist>('FeedBlacklist', {
  profanity: { type: Boolean, description: 'Automatically filter out profanity.' },
  posts: { type: [String], description: 'Ignored post IDs.' },
  removed: { type: [String], description: 'Removed post IDs.' },
  users: { type: [String], description: 'Ignored user IDs.' },
  words: { type: [String], description: 'Ignored words.' },
});

export default schema;
