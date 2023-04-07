import { generateObjectSchema } from '../schema';
import { Document } from 'mongoose';

export interface IMediaCommentdata extends Document {
  body?:string;
  mentions?:string[];
  user?:string;
  createdAt?:Date;
}

export const fields = {
  body:           { type: String},
  mentions:           { type: [String]},
  user:          { type: String},
  createdAt:         { type: Number, default: Date.now }
};

export const schema = generateObjectSchema<IMediaCommentdata>('MediaComments', fields);

export default schema;
