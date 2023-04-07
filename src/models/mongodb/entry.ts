import { validateUuid, generateObjectSchema } from './schema';
import { Document } from 'mongoose';

export interface IEntry extends Document {
  token:string;
  price:number;
  tax:number;
  stream?:string;
  pos_id?:string;
  name?:string;
}

export const schema = generateObjectSchema<IEntry>('Entry', {
  token: {
    type: String,
    required: false,
    validate: validateUuid(true),
    description: 'Entry ID.',
  },
  price:  { type: Number, required: false, default: 0, min: 0, description: 'Price.' },
  tax:  { type: Number, required: false, default: 0, min: 0, max: 0.99, description: 'Tax amount (0-1).' },
  stream:  {
    type: String,
    required: false,
    validate: validateUuid(true),
    description: 'OMS Stream ID.',
  },
  pos_id:  { type: String, description: 'External POS ID.' },
  name: {
    type: String,
    description: 'Entry name.',
  },
});

export default schema;
