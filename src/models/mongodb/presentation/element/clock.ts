import Style, { IPresentationElementStyle } from './style';
import { generateObjectSchema, enumField } from '../../schema';

import { Document } from 'mongoose';

export enum EPresentationElementClockType {
  Analog = 'analog',
  Digital = 'digital',
}

export interface IPresentationElementClock extends Document {
  style?:IPresentationElementStyle;
  timezone?:boolean;
  type:EPresentationElementClockType;
}

export const schema = generateObjectSchema<IPresentationElementClock>('PresentationClock', {
  style:    { type: Style, required: false },
  timezone: { type: String, required: false },
  type:     enumField(EPresentationElementClockType),
});

export default schema;
