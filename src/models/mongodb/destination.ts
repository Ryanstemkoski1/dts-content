import { generateObjectSchema } from './schema';
import { Document, Schema } from 'mongoose';

export interface IDestination extends Document {
  target?:string;
  page?:string;
  url?:string;
}

export const schema = generateObjectSchema<IDestination>('Destination', {
  target: { type: Schema.Types.ObjectId },
  page:   { type: String },
  url:    { type: String },
});

export default schema;
