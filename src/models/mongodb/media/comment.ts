import { generateObjectSchema } from '../schema';
import { Document } from 'mongoose';

export interface IMediaCommentdata extends Document {
  body?:string;
  mentions?:string[];
  user?:string;
}

export const fields = {
  body:           { type: String, description:"Media Comments"},
  mentions:           { type: [String], description: 'Mentioned Users'},
  user:          { type: String, description: "User"},
};

export const schema = generateObjectSchema<IMediaCommentdata>('MediaComments', fields);

export default schema;
