import { generateObjectSchema } from '../../schema';

import { Document, Schema } from 'mongoose';

export interface IPresentationElementBitmap extends Document {
  source:string;
}

export const schema = generateObjectSchema<IPresentationElementBitmap>(
  'PresentationElementBitmap', {
    source: { type: Schema.Types.ObjectId, required: true },
  });

export default schema;
